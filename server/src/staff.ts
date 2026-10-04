import type { Express, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { attachmentStorage } from "./attachments/storage.js";
import { attachmentUploadMiddleware } from "./attachments/upload.js";
import { getPrisma } from "./prisma.js";
import {
  getAuthenticatedUser,
  sendAuthenticationRequired,
  sendForbidden,
} from "./auth/http.js";

const priorityValues = [
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;

const ticketStatusValues = [
  "New",
  "InProgress",
  "WaitingForRequester",
  "Resolved",
  "Closed",
  "Reopened",
  "Cancelled",
] as const;

type TicketPriority = (typeof priorityValues)[number];
type TicketStatusValue = (typeof ticketStatusValues)[number];

const allowedTransitions: Record<
  TicketStatusValue,
  TicketStatusValue[]
> = {
  New: ["InProgress", "Cancelled"],
  InProgress: [
    "WaitingForRequester",
    "Resolved",
    "Cancelled",
  ],
  WaitingForRequester: ["InProgress", "Resolved"],
  Resolved: ["Closed", "Reopened"],
  Closed: [],
  Reopened: ["InProgress"],
  Cancelled: [],
};

function hasRole(
  user: { roles: unknown[] },
  role: "Requester" | "ITStaff" | "Administrator"
): boolean {
  return user.roles.some(
    (userRole) => String(userRole) === role
  );
}

function toActor(user: {
  id: string;
  displayName: string;
}) {
  return {
    id: user.id,
    displayName: user.displayName,
  };
}

function sendTicketNotFound(res: Response) {
  return res.status(404).json({
    error: {
      code: "TICKET_NOT_FOUND",
      message: "Ticket not found.",
      fieldErrors: [],
    },
  });
}

function sendValidationError(
  res: Response,
  message: string,
  fieldErrors: { field: string; message: string }[]
) {
  return res.status(422).json({
    error: {
      code: "VALIDATION_ERROR",
      message,
      fieldErrors,
    },
  });
}

function isPriority(
  value: string
): value is TicketPriority {
  return priorityValues.includes(
    value as TicketPriority
  );
}

function isTicketStatus(
  value: string
): value is TicketStatusValue {
  return ticketStatusValues.includes(
    value as TicketStatusValue
  );
}

function statusLabel(status: TicketStatusValue) {
  return status
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function queryValue(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : undefined;
}

async function requireStaffUser(
  req: Request,
  res: Response
) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    sendAuthenticationRequired(res);
    return null;
  }

  if (!hasRole(user, "ITStaff")) {
    sendForbidden(res);
    return null;
  }

  return user;
}

async function authorizePublicCommentTicket(
  req: Request,
  res: Response,
  ticketId: string
) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    sendAuthenticationRequired(res);
    return null;
  }

  const prisma = getPrisma();
  let ticket;

  if (
    hasRole(user, "ITStaff") ||
    hasRole(user, "Administrator")
  ) {
    ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
  } else if (hasRole(user, "Requester")) {
    const requester =
      await prisma.developmentRequester.findUnique({
        where: { id: user.id },
        select: { isActive: true },
      });

    if (!requester?.isActive) {
      sendForbidden(res);
      return null;
    }

    ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        requesterUserId: user.id,
      },
      select: { id: true },
    });
  } else {
    sendForbidden(res);
    return null;
  }

  if (!ticket) {
    sendTicketNotFound(res);
    return null;
  }

  return { user, ticket };
}

function queueQuery(req: Request) {
  const fieldErrors: {
    field: string;
    message: string;
  }[] = [];

  const search = queryValue(req.query.search);
  const requester = queryValue(req.query.requester);
  const relatedSystemId = queryValue(
    req.query.relatedSystemId
  );
  const requestedPriority = queryValue(
    req.query.requestedPriority
  );
  const itPriority = queryValue(req.query.itPriority);
  const status = queryValue(req.query.status);
  const assignedToUserId = queryValue(
    req.query.assignedToUserId
  );
  const requesterUserId = queryValue(
    req.query.requesterUserId
  );
  const sort =
    queryValue(req.query.sort) ?? "updatedAt";
  const order =
    queryValue(req.query.order) ?? "desc";
  const categoryValue = queryValue(
    req.query.categoryId
  );
  const pageValue =
    queryValue(req.query.page) ?? "1";
  const pageSizeValue =
    queryValue(req.query.pageSize) ?? "10";

  let categoryId: number | undefined;

  if (search && search.length > 120) {
    fieldErrors.push({
      field: "search",
      message:
        "Search must contain at most 120 characters.",
    });
  }

  if (requester && requester.length > 120) {
    fieldErrors.push({
      field: "requester",
      message:
        "Requester filter must contain at most 120 characters.",
    });
  }

  if (categoryValue) {
    categoryId = Number(categoryValue);

    if (
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      fieldErrors.push({
        field: "categoryId",
        message: "Category is invalid.",
      });
    }
  }

  if (
    requestedPriority &&
    !isPriority(requestedPriority)
  ) {
    fieldErrors.push({
      field: "requestedPriority",
      message:
        "Requested Priority is invalid.",
    });
  }

  if (
    itPriority &&
    !isPriority(itPriority)
  ) {
    fieldErrors.push({
      field: "itPriority",
      message: "IT Priority is invalid.",
    });
  }

  if (
    status &&
    !isTicketStatus(status)
  ) {
    fieldErrors.push({
      field: "status",
      message: "Status is invalid.",
    });
  }

  const supportedSorts = [
    "ticketNo",
    "createdAt",
    "updatedAt",
    "requestedPriority",
    "itPriority",
    "status",
  ];

  if (!supportedSorts.includes(sort)) {
    fieldErrors.push({
      field: "sort",
      message: "Sort field is invalid.",
    });
  }

  if (
    order !== "asc" &&
    order !== "desc"
  ) {
    fieldErrors.push({
      field: "order",
      message: "Sort order is invalid.",
    });
  }

  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    fieldErrors.push({
      field: "page",
      message:
        "Page must be a positive integer.",
    });
  }

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    fieldErrors.push({
      field: "pageSize",
      message:
        "Page size must be an integer between 1 and 50.",
    });
  }

  if (fieldErrors.length > 0) {
    return { fieldErrors };
  }

  return {
    categoryId,
    search,
    requester,
    relatedSystemId,
    requestedPriority:
      requestedPriority as
        | TicketPriority
        | undefined,
    itPriority:
      itPriority as
        | TicketPriority
        | undefined,
    status:
      status as
        | TicketStatusValue
        | undefined,
    assignedToUserId,
    requesterUserId,
    sort: sort as
      | "ticketNo"
      | "createdAt"
      | "updatedAt"
      | "requestedPriority"
      | "itPriority"
      | "status",
    order: order as
      | "asc"
      | "desc",
    page,
    pageSize,
  };
}

export function registerStaffRoutes(
  app: Express
) {
  app.get(
    "/api/v1/staff/assignees",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const assignees =
          await getPrisma().user.findMany({
            where: {
              isActive: true,
              roles: {
                has: "ITStaff",
              },
            },
            orderBy: [
              {
                displayName: "asc",
              },
              {
                id: "asc",
              },
            ],
            select: {
              id: true,
              displayName: true,
            },
          });

        return res
          .status(200)
          .json({
            data: assignees,
          });
      } catch (error) {
        console.error(
          "Failed to load staff assignees:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "STAFF_ASSIGNEES_FAILED",
            message:
              "Unable to load staff assignees.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.get(
    "/api/v1/staff/tickets",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const query =
          queueQuery(req);

        if (query.fieldErrors) {
          return sendValidationError(
            res,
            "One or more queue parameters are invalid.",
            query.fieldErrors
          );
        }

        const filters:
          Prisma.TicketWhereInput[] =
          [];

        if (query.search) {
          filters.push({
            OR: [
              {
                ticketNo: {
                  contains:
                    query.search,
                  mode: "insensitive",
                },
              },
              {
                summary: {
                  contains:
                    query.search,
                  mode: "insensitive",
                },
              },
              {
                requester: {
                  displayName: {
                    contains:
                      query.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                requester: {
                  email: {
                    contains:
                      query.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                requesterUser: {
                  is: {
                    displayName: {
                      contains:
                        query.search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                requesterUser: {
                  is: {
                    email: {
                      contains:
                        query.search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          });
        }

        if (query.requester) {
          filters.push({
            OR: [
              {
                requester: {
                  displayName: {
                    contains:
                      query.requester,
                    mode: "insensitive",
                  },
                },
              },
              {
                requester: {
                  email: {
                    contains:
                      query.requester,
                    mode: "insensitive",
                  },
                },
              },
              {
                requesterUser: {
                  is: {
                    displayName: {
                      contains:
                        query.requester,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                requesterUser: {
                  is: {
                    email: {
                      contains:
                        query.requester,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          });
        }

        if (query.categoryId) {
          filters.push({
            categoryId:
              query.categoryId,
          });
        }

        if (
          query.relatedSystemId
        ) {
          filters.push({
            relatedSystemId:
              query.relatedSystemId,
          });
        }

        if (
          query.requestedPriority
        ) {
          filters.push({
            requestedPriority:
              query.requestedPriority,
          });
        }

        if (query.itPriority) {
          filters.push({
            itPriority:
              query.itPriority,
          });
        }

        if (query.status) {
          filters.push({
            status: query.status,
          });
        }

        if (
          query.assignedToUserId
        ) {
          filters.push(
            query.assignedToUserId ===
              "unassigned"
              ? {
                  assignedToUserId:
                    null,
                }
              : {
                  assignedToUserId:
                    query.assignedToUserId,
                }
          );
        }

        if (
          query.requesterUserId
        ) {
          filters.push({
            requesterUserId:
              query.requesterUserId,
          });
        }

        const where:
          Prisma.TicketWhereInput =
          filters.length > 0
            ? { AND: filters }
            : {};

        const orderBy:
          Prisma.TicketOrderByWithRelationInput[] =
          [
            {
              [query.sort]:
                query.order,
            },
            {
              ticketNo: "asc",
            },
          ];

        const prisma = getPrisma();

        const [
          totalItems,
          tickets,
        ] = await Promise.all([
          prisma.ticket.count({
            where,
          }),

          prisma.ticket.findMany({
            where,
            include: {
              requester: true,
              requesterUser: true,
              category: true,
              relatedSystem: true,
              assignedTo: true,
            },
            orderBy,
            skip:
              (query.page - 1) *
              query.pageSize,
            take: query.pageSize,
          }),
        ]);

        return res
          .status(200)
          .json({
            data: tickets.map(
              (ticket) => ({
                id: ticket.id,
                ticketNo:
                  ticket.ticketNo,
                summary:
                  ticket.summary,
                requester: {
                  id:
                    ticket
                      .requesterUser
                      ?.id ??
                    ticket
                      .requester.id,

                  displayName:
                    ticket
                      .requesterUser
                      ?.displayName ??
                    ticket
                      .requester
                      .displayName,

                  email:
                    ticket
                      .requesterUser
                      ?.email ??
                    ticket
                      .requester
                      .email,
                },
                category: {
                  id:
                    ticket.category
                      .id,
                  name:
                    ticket.category
                      .name,
                },
                relatedSystem: {
                  id:
                    ticket
                      .relatedSystem
                      .id,
                  name:
                    ticket
                      .relatedSystem
                      .name,
                },
                requestedPriority:
                  ticket.requestedPriority,
                itPriority:
                  ticket.itPriority,
                status:
                  ticket.status,
                assignedTo:
                  ticket.assignedTo
                    ? toActor(
                        ticket.assignedTo
                      )
                    : null,
                createdAt:
                  ticket.createdAt,
                updatedAt:
                  ticket.updatedAt,
              })
            ),
            meta: {
              page: query.page,
              pageSize:
                query.pageSize,
              totalItems,
              totalPages:
                Math.ceil(
                  totalItems /
                    query.pageSize
                ),
            },
          });
      } catch (error) {
        console.error(
          "Failed to load staff Tickets:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "STAFF_TICKETS_FAILED",
            message:
              "Unable to load staff Tickets.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  // -------------------------------------------------------------------------
  // Lab 3 - Staff Attachment Upload
  // POST /api/v1/staff/tickets/:ticketId/attachments
  // -------------------------------------------------------------------------
  app.post(
    "/api/v1/staff/tickets/:ticketId/attachments",
    attachmentUploadMiddleware,
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const prisma =
          getPrisma();

        const ticketId =
          req.params.ticketId;

        const ticket =
          await prisma.ticket.findUnique(
            {
              where: {
                id: ticketId,
              },
              select: {
                id: true,
                requesterUserId: true,
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        if (
          !ticket.requesterUserId
        ) {
          return res
            .status(422)
            .json({
              error: {
                code:
                  "REQUESTER_REQUIRED",
                message:
                  "This Ticket does not have a requester user.",
                fieldErrors: [],
              },
            });
        }

        if (!req.file) {
          return res
            .status(422)
            .json({
              error: {
                code:
                  "ATTACHMENT_REQUIRED",
                message:
                  "Select a file to upload.",
                fieldErrors: [],
              },
            });
        }

        const activeAttachmentCount =
          await prisma.attachment.count(
            {
              where: {
                ticketId,
                isRemoved: false,
              },
            }
          );

        if (
          activeAttachmentCount >= 5
        ) {
          return res
            .status(422)
            .json({
              error: {
                code:
                  "ATTACHMENT_LIMIT_REACHED",
                message:
                  "A Ticket may contain no more than five active Attachments.",
                fieldErrors: [],
              },
            });
        }

        const storageKey =
          randomUUID();

        await attachmentStorage.save(
          storageKey,
          req.file.buffer,
          req.file.mimetype
        );

        try {
          const attachment =
            await prisma.attachment.create(
              {
                data: {
                  ticketId,
                  originalFilename:
                    req.file
                      .originalname,
                  storageKey,
                  mimeType:
                    req.file.mimetype,
                  sizeBytes:
                    req.file.size,

                  // Attachment schema requires
                  // the requester user id.
                  uploadedByRequesterId:
                    ticket.requesterUserId,
                },
              }
            );

          return res
            .status(201)
            .json({
              data: {
                id: attachment.id,
                ticketId:
                  attachment.ticketId,
                originalFilename:
                  attachment.originalFilename,
                mimeType:
                  attachment.mimeType,
                sizeBytes:
                  attachment.sizeBytes,
                createdAt:
                  attachment.createdAt,
              },
            });
        } catch (error) {
          await attachmentStorage
            .remove(storageKey)
            .catch(
              () =>
                undefined
            );

          throw error;
        }
      } catch (error) {
        console.error(
          "Failed to upload staff Attachment:",
          error
        );

        if (res.headersSent) {
          return;
        }

        return res
          .status(500)
          .json({
            error: {
              code:
                "STAFF_ATTACHMENT_UPLOAD_FAILED",
              message:
                "Unable to upload Attachment.",
              fieldErrors: [],
            },
          });
      }
    }
  );

  app.get(
    "/api/v1/staff/tickets/:ticketId/attachments/:attachmentId/download",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const prisma =
          getPrisma();

        const ticket =
          await prisma.ticket.findUnique(
            {
              where: {
                id: req.params
                  .ticketId,
              },
              select: {
                id: true,
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        const attachment =
          await prisma.attachment.findFirst(
            {
              where: {
                id: req.params
                  .attachmentId,
                ticketId: ticket.id,
                isRemoved: false,
              },
            }
          );

        if (!attachment) {
          return res
            .status(404)
            .json({
              error: {
                code:
                  "ATTACHMENT_NOT_FOUND",
                message:
                  "Attachment not found.",
                fieldErrors: [],
              },
            });
        }

        const storedFile =
          await attachmentStorage.get(
            attachment.storageKey
          );

        if (!storedFile) {
          return res
            .status(404)
            .json({
              error: {
                code:
                  "ATTACHMENT_FILE_NOT_FOUND",
                message:
                  "Attachment file not found.",
                fieldErrors: [],
              },
            });
        }

        const safeFilename =
          attachment.originalFilename.replace(
            /[\r\n"]/g,
            "_"
          );

        res.setHeader(
          "Content-Type",
          attachment.mimeType
        );

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeFilename}"`
        );

        return res
          .status(200)
          .send(
            storedFile.buffer
          );
      } catch (error) {
        console.error(
          "Failed to download staff Attachment:",
          error
        );

        if (res.headersSent) {
          return;
        }

        return res.status(500).json({
          error: {
            code:
              "STAFF_ATTACHMENT_DOWNLOAD_FAILED",
            message:
              "Unable to download Attachment.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.get(
    "/api/v1/staff/tickets/:ticketId",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const ticket =
          await getPrisma().ticket.findUnique(
            {
              where: {
                id: req.params
                  .ticketId,
              },
              include: {
                requester: true,
                requesterUser: true,
                assignedTo: true,
                category: true,
                relatedSystem: true,

                attachments: {
                  where: {
                    isRemoved: false,
                  },
                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },

                comments: {
                  include: {
                    author: true,
                  },
                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },

                internalNotes: {
                  include: {
                    author: true,
                  },
                  orderBy: {
                    createdAt:
                      "asc",
                  },
                },

                actions: {
                  include: {
                    actorUser: true,
                  },
                  orderBy: {
                    createdAt:
                      "desc",
                  },
                },
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        return res
          .status(200)
          .json({
            data: {
              id: ticket.id,

              ticketNo:
                ticket.ticketNo,

              requester: {
                id:
                  ticket
                    .requesterUser
                    ?.id ??
                  ticket.requester.id,

                displayName:
                  ticket
                    .requesterUser
                    ?.displayName ??
                  ticket.requester
                    .displayName,

                email:
                  ticket
                    .requesterUser
                    ?.email ??
                  ticket.requester
                    .email,
              },

              assignedTo:
                ticket.assignedTo
                  ? toActor(
                      ticket.assignedTo
                    )
                  : null,

              category: {
                id:
                  ticket.category.id,
                name:
                  ticket.category.name,
              },

              relatedSystem: {
                id:
                  ticket
                    .relatedSystem
                    .id,
                name:
                  ticket
                    .relatedSystem
                    .name,
              },

              summary:
                ticket.summary,

              description:
                ticket.description,

              requestedPriority:
                ticket.requestedPriority,

              itPriority:
                ticket.itPriority,

              status:
                ticket.status,

              attachments:
                ticket.attachments.map(
                  (attachment) => ({
                    id:
                      attachment.id,

                    ticketId:
                      attachment.ticketId,

                    originalFilename:
                      attachment.originalFilename,

                    mimeType:
                      attachment.mimeType,

                    sizeBytes:
                      attachment.sizeBytes,

                    createdAt:
                      attachment.createdAt,
                  })
                ),

              comments:
                ticket.comments.map(
                  (comment) => ({
                    id:
                      comment.id,

                    ticketId:
                      comment.ticketId,

                    body:
                      comment.body,

                    visibility:
                      "Public",

                    author:
                      toActor(
                        comment.author
                      ),

                    createdAt:
                      comment.createdAt,

                    updatedAt:
                      comment.updatedAt,
                  })
                ),

              internalNotes:
                ticket.internalNotes.map(
                  (note) => ({
                    id:
                      note.id,

                    ticketId:
                      note.ticketId,

                    body:
                      note.body,

                    visibility:
                      "Internal",

                    author:
                      toActor(
                        note.author
                      ),

                    createdAt:
                      note.createdAt,

                    updatedAt:
                      note.updatedAt,
                  })
                ),

              actions:
                ticket.actions.map(
                  (action) => ({
                    id:
                      action.id,

                    ticketId:
                      action.ticketId,

                    actionType:
                      action.actionType,

                    body:
                      action.body,

                    actor:
                      toActor(
                        action.actorUser
                      ),

                    createdAt:
                      action.createdAt,
                  })
                ),

              createdAt:
                ticket.createdAt,

              updatedAt:
                ticket.updatedAt,
            },
          });
      } catch (error) {
        console.error(
          "Failed to load staff Ticket:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "STAFF_TICKET_FAILED",
            message:
              "Unable to load staff Ticket.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.post(
    "/api/v1/staff/tickets/:ticketId/claim",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const prisma =
          getPrisma();

        const currentTicket =
          await prisma.ticket.findUnique(
            {
              where: {
                id:
                  req.params
                    .ticketId,
              },
              select: {
                id: true,
                assignedToUserId:
                  true,
              },
            }
          );

        if (!currentTicket) {
          return sendTicketNotFound(
            res
          );
        }

        if (
          currentTicket
            .assignedToUserId
        ) {
          return res.status(409).json({
            error: {
              code:
                "TICKET_ALREADY_ASSIGNED",
              message:
                "This Ticket is already assigned.",
              fieldErrors: [],
            },
          });
        }

        const claimedTicket =
          await prisma.$transaction(
            async (tx) => {
              const update =
                await tx.ticket.updateMany(
                  {
                    where: {
                      id:
                        currentTicket.id,
                      assignedToUserId:
                        null,
                    },
                    data: {
                      assignedToUserId:
                        staffUser.id,
                    },
                  }
                );

              if (
                update.count !== 1
              ) {
                return null;
              }

              await tx.ticketAction.create(
                {
                  data: {
                    ticketId:
                      currentTicket.id,
                    actorUserId:
                      staffUser.id,
                    actionType:
                      "TicketClaimed",
                    body: `${staffUser.displayName} claimed this Ticket.`,
                  },
                }
              );

              return tx.ticket.findUnique(
                {
                  where: {
                    id:
                      currentTicket.id,
                  },
                  include: {
                    assignedTo:
                      true,
                  },
                }
              );
            }
          );

        if (!claimedTicket) {
          return res.status(409).json({
            error: {
              code:
                "TICKET_ALREADY_ASSIGNED",
              message:
                "This Ticket is already assigned.",
              fieldErrors: [],
            },
          });
        }

        return res
          .status(200)
          .json({
            data: {
              id:
                claimedTicket.id,

              assignedTo:
                claimedTicket
                  .assignedTo
                  ? toActor(
                      claimedTicket
                        .assignedTo
                    )
                  : null,
            },
          });
      } catch (error) {
        console.error(
          "Failed to claim Ticket:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "TICKET_CLAIM_FAILED",
            message:
              "Unable to claim Ticket.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.patch(
    "/api/v1/staff/tickets/:ticketId/assignment",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const assignedToUserId =
          typeof req.body
            ?.assignedToUserId ===
          "string"
            ? req.body.assignedToUserId.trim()
            : "";

        if (!assignedToUserId) {
          return sendValidationError(
            res,
            "Assignment is invalid.",
            [
              {
                field:
                  "assignedToUserId",
                message:
                  "An active IT Staff user is required.",
              },
            ]
          );
        }

        const prisma =
          getPrisma();

        const [
          ticket,
          assignee,
        ] = await Promise.all([
          prisma.ticket.findUnique(
            {
              where: {
                id:
                  req.params
                    .ticketId,
              },
              include: {
                assignedTo:
                  true,
              },
            }
          ),

          prisma.user.findFirst({
            where: {
              id:
                assignedToUserId,
              isActive: true,
              roles: {
                has: "ITStaff",
              },
            },
            select: {
              id: true,
              displayName:
                true,
            },
          }),
        ]);

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        if (!assignee) {
          return sendValidationError(
            res,
            "Assignment is invalid.",
            [
              {
                field:
                  "assignedToUserId",
                message:
                  "Selected user must be an active IT Staff user.",
              },
            ]
          );
        }

        if (
          ticket.assignedToUserId ===
          assignee.id
        ) {
          return res
            .status(200)
            .json({
              data: {
                id:
                  ticket.id,
                assignedTo:
                  toActor(
                    assignee
                  ),
              },
            });
        }

        const previousAssignee =
          ticket.assignedTo
            ? ticket.assignedTo
                .displayName
            : "Unassigned";

        const updatedTicket =
          await prisma.$transaction(
            async (tx) => {
              const updated =
                await tx.ticket.update(
                  {
                    where: {
                      id:
                        ticket.id,
                    },
                    data: {
                      assignedToUserId:
                        assignee.id,
                    },
                    include: {
                      assignedTo:
                        true,
                    },
                  }
                );

              await tx.ticketAction.create(
                {
                  data: {
                    ticketId:
                      ticket.id,
                    actorUserId:
                      staffUser.id,
                    actionType:
                      "AssignmentChanged",
                    body: `Assignment changed from ${previousAssignee} to ${assignee.displayName}.`,
                  },
                }
              );

              return updated;
            }
          );

        return res
          .status(200)
          .json({
            data: {
              id:
                updatedTicket.id,

              assignedTo:
                updatedTicket
                  .assignedTo
                  ? toActor(
                      updatedTicket
                        .assignedTo
                    )
                  : null,
            },
          });
      } catch (error) {
        console.error(
          "Failed to update Ticket assignment:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "TICKET_ASSIGNMENT_FAILED",
            message:
              "Unable to update Ticket assignment.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.patch(
    "/api/v1/staff/tickets/:ticketId/it-priority",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const itPriority =
          typeof req.body
            ?.itPriority ===
          "string"
            ? req.body.itPriority.trim()
            : "";

        if (
          !isPriority(itPriority)
        ) {
          return sendValidationError(
            res,
            "IT Priority is invalid.",
            [
              {
                field:
                  "itPriority",
                message:
                  "IT Priority must be Low, Medium, High, or Urgent.",
              },
            ]
          );
        }

        const prisma =
          getPrisma();

        const ticket =
          await prisma.ticket.findUnique(
            {
              where: {
                id:
                  req.params
                    .ticketId,
              },
              select: {
                id: true,
                itPriority:
                  true,
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        if (
          ticket.itPriority ===
          itPriority
        ) {
          return res
            .status(200)
            .json({
              data: {
                id:
                  ticket.id,
                itPriority,
              },
            });
        }

        const updated =
          await prisma.$transaction(
            async (tx) => {
              const next =
                await tx.ticket.update(
                  {
                    where: {
                      id:
                        ticket.id,
                    },
                    data: {
                      itPriority,
                    },
                    select: {
                      id: true,
                      itPriority:
                        true,
                    },
                  }
                );

              await tx.ticketAction.create(
                {
                  data: {
                    ticketId:
                      ticket.id,
                    actorUserId:
                      staffUser.id,
                    actionType:
                      "ITPriorityChanged",
                    body: `IT Priority changed from ${ticket.itPriority ?? "Not set"} to ${itPriority}.`,
                  },
                }
              );

              return next;
            }
          );

        return res
          .status(200)
          .json({
            data: updated,
          });
      } catch (error) {
        console.error(
          "Failed to update IT Priority:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "IT_PRIORITY_UPDATE_FAILED",
            message:
              "Unable to update IT Priority.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.patch(
    "/api/v1/staff/tickets/:ticketId/status",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const status =
          typeof req.body
            ?.status ===
          "string"
            ? req.body.status.trim()
            : "";

        const reason =
          typeof req.body
            ?.reason ===
          "string"
            ? req.body.reason.trim()
            : "";

        if (
          !isTicketStatus(status)
        ) {
          return sendValidationError(
            res,
            "Status is invalid.",
            [
              {
                field:
                  "status",
                message:
                  "Status is invalid.",
              },
            ]
          );
        }

        if (
          reason.length > 500
        ) {
          return sendValidationError(
            res,
            "Status is invalid.",
            [
              {
                field:
                  "reason",
                message:
                  "Reason must contain at most 500 characters.",
              },
            ]
          );
        }

        const prisma =
          getPrisma();

        const ticket =
          await prisma.ticket.findUnique(
            {
              where: {
                id:
                  req.params
                    .ticketId,
              },
              select: {
                id: true,
                status:
                  true,
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        if (
          !allowedTransitions[
            ticket.status
          ].includes(status)
        ) {
          return sendValidationError(
            res,
            "Status transition is not allowed.",
            [
              {
                field:
                  "status",
                message: `Cannot change ${statusLabel(
                  ticket.status
                )} to ${statusLabel(
                  status
                )}.`,
              },
            ]
          );
        }

        const actionBody =
          `Status changed from ${statusLabel(
            ticket.status
          )} to ${statusLabel(
            status
          )}.` +
          (reason
            ? ` ${reason}`
            : "");

        const updated =
          await prisma.$transaction(
            async (tx) => {
              const next =
                await tx.ticket.update(
                  {
                    where: {
                      id:
                        ticket.id,
                    },
                    data: {
                      status,
                    },
                    select: {
                      id: true,
                      status:
                        true,
                    },
                  }
                );

              await tx.ticketAction.create(
                {
                  data: {
                    ticketId:
                      ticket.id,
                    actorUserId:
                      staffUser.id,
                    actionType:
                      "StatusChanged",
                    body:
                      actionBody,
                  },
                }
              );

              return next;
            }
          );

        return res
          .status(200)
          .json({
            data: updated,
          });
      } catch (error) {
        console.error(
          "Failed to update Ticket status:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "TICKET_STATUS_UPDATE_FAILED",
            message:
              "Unable to update Ticket status.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.post(
    "/api/v1/staff/tickets/:ticketId/actions",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const body =
          typeof req.body?.body ===
          "string"
            ? req.body.body.trim()
            : "";

        if (
          body.length < 1 ||
          body.length > 2000
        ) {
          return sendValidationError(
            res,
            "Action is invalid.",
            [
              {
                field:
                  "body",
                message:
                  "Action body must contain between 1 and 2000 characters.",
              },
            ]
          );
        }

        const prisma =
          getPrisma();

        const ticket =
          await prisma.ticket.findUnique(
            {
              where: {
                id:
                  req.params
                    .ticketId,
              },
              select: {
                id: true,
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        const action =
          await prisma.ticketAction.create(
            {
              data: {
                ticketId:
                  ticket.id,
                actorUserId:
                  staffUser.id,
                actionType:
                  "ActionTaken",
                body,
              },
              include: {
                actorUser:
                  true,
              },
            }
          );

        return res
          .status(201)
          .json({
            data: {
              id: action.id,
              ticketId:
                action.ticketId,
              actionType:
                action.actionType,
              body:
                action.body,
              actor:
                toActor(
                  action.actorUser
                ),
              createdAt:
                action.createdAt,
            },
          });
      } catch (error) {
        console.error(
          "Failed to create Ticket action:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "TICKET_ACTION_FAILED",
            message:
              "Unable to save the action.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.post(
    "/api/v1/staff/tickets/:ticketId/internal-notes",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const staffUser =
          await requireStaffUser(
            req,
            res
          );

        if (!staffUser) {
          return;
        }

        const body =
          typeof req.body?.body ===
          "string"
            ? req.body.body.trim()
            : "";

        if (
          body.length < 1 ||
          body.length > 2000
        ) {
          return sendValidationError(
            res,
            "One or more Internal Note fields are invalid.",
            [
              {
                field:
                  "body",
                message:
                  "Internal Note body must contain between 1 and 2000 characters.",
              },
            ]
          );
        }

        const prisma =
          getPrisma();

        const ticket =
          await prisma.ticket.findUnique(
            {
              where: {
                id:
                  req.params
                    .ticketId,
              },
              select: {
                id: true,
              },
            }
          );

        if (!ticket) {
          return sendTicketNotFound(
            res
          );
        }

        const note =
          await prisma.internalNote.create(
            {
              data: {
                ticketId:
                  ticket.id,
                authorId:
                  staffUser.id,
                body,
              },
              include: {
                author: true,
              },
            }
          );

        return res
          .status(201)
          .json({
            data: {
              id: note.id,
              ticketId:
                note.ticketId,
              body:
                note.body,
              visibility:
                "Internal",
              author:
                toActor(
                  note.author
                ),
              createdAt:
                note.createdAt,
              updatedAt:
                note.updatedAt,
            },
          });
      } catch (error) {
        console.error(
          "Failed to create Internal Note:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "INTERNAL_NOTE_FAILED",
            message:
              "Unable to create Internal Note.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.get(
    "/api/v1/tickets/:ticketId/comments",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const access =
          await authorizePublicCommentTicket(
            req,
            res,
            req.params.ticketId
          );

        if (!access) {
          return;
        }

        const comments =
          await getPrisma().ticketComment.findMany(
            {
              where: {
                ticketId:
                  access.ticket.id,
              },
              include: {
                author: true,
              },
              orderBy: {
                createdAt:
                  "asc",
              },
            }
          );

        return res
          .status(200)
          .json({
            data:
              comments.map(
                (comment) => ({
                  id:
                    comment.id,
                  ticketId:
                    comment.ticketId,
                  body:
                    comment.body,
                  visibility:
                    "Public",
                  author:
                    toActor(
                      comment.author
                    ),
                  createdAt:
                    comment.createdAt,
                  updatedAt:
                    comment.updatedAt,
                })
              ),
          });
      } catch (error) {
        console.error(
          "Failed to load Ticket comments:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "TICKET_COMMENTS_FAILED",
            message:
              "Unable to load Ticket comments.",
            fieldErrors: [],
          },
        });
      }
    }
  );

  app.post(
    "/api/v1/tickets/:ticketId/comments",
    async (
      req: Request,
      res: Response
    ) => {
      try {
        const access =
          await authorizePublicCommentTicket(
            req,
            res,
            req.params.ticketId
          );

        if (!access) {
          return;
        }

        const body =
          typeof req.body?.body ===
          "string"
            ? req.body.body.trim()
            : "";

        if (
          body.length < 1 ||
          body.length > 2000
        ) {
          return sendValidationError(
            res,
            "Public comment is invalid.",
            [
              {
                field:
                  "body",
                message:
                  "Public comment body must contain between 1 and 2000 characters.",
              },
            ]
          );
        }

        const comment =
          await getPrisma()
            .ticketComment.create(
              {
                data: {
                  ticketId:
                    access.ticket
                      .id,
                  authorId:
                    access.user.id,
                  body,
                },
                include: {
                  author: true,
                },
              }
            );

        return res
          .status(201)
          .json({
            data: {
              id: comment.id,
              ticketId:
                comment.ticketId,
              body:
                comment.body,
              visibility:
                "Public",
              author:
                toActor(
                  comment.author
                ),
              createdAt:
                comment.createdAt,
              updatedAt:
                comment.updatedAt,
            },
          });
      } catch (error) {
        console.error(
          "Failed to create Ticket comment:",
          error
        );

        return res.status(500).json({
          error: {
            code:
              "TICKET_COMMENT_FAILED",
            message:
              "Unable to create Ticket comment.",
            fieldErrors: [],
          },
        });
      }
    }
  );
}