import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { attachmentStorage } from "./attachments/storage.js";
import { attachmentUploadMiddleware } from "./attachments/upload.js";
import {
  getAuthenticatedUser,
  sendAuthenticationRequired,
  toSafeUser,
} from "./auth/http.js";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "./auth/password.js";
import {
  createSession,
  destroySession,
} from "./auth/session.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Shared authorization helpers
// ---------------------------------------------------------------------------
type AppRole = "Requester" | "ITStaff" | "Administrator";

function hasUserRole(
  user: { roles: unknown[] },
  role: AppRole
): boolean {
  return user.roles.some(
    (userRole) => String(userRole) === role
  );
}

async function requireRole(
  req: Request,
  res: Response,
  role: AppRole
) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    sendAuthenticationRequired(res);
    return null;
  }

  if (!hasUserRole(user, role)) {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message:
          "You do not have permission to use this feature.",
        fieldErrors: [],
      },
    });
  }

  return user;
}

// ---------------------------------------------------------------------------
// Shared Requester authentication / ownership helpers
// ---------------------------------------------------------------------------
async function getRequesterContext(
  req: Request,
  res: Response
) {
  const prisma = getPrisma();
  const authenticatedUser =
    await getAuthenticatedUser(req);

  if (!authenticatedUser) {
    sendAuthenticationRequired(res);
    return null;
  }

  if (
    !hasUserRole(
      authenticatedUser,
      "Requester"
    )
  ) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message:
          "You do not have permission to use this feature.",
        fieldErrors: [],
      },
    });

    return null;
  }

  const requester =
    await prisma.developmentRequester.findUnique({
      where: {
        id: authenticatedUser.id,
      },
    });

  if (!requester || !requester.isActive) {
    res.status(403).json({
      error: {
        code:
          "REQUESTER_PROFILE_REQUIRED",
        message:
          "A Requester profile is required for this feature.",
        fieldErrors: [],
      },
    });

    return null;
  }

  return {
    requesterId: requester.id,
    requesterUserId:
      authenticatedUser.id,
    requester,
    authenticatedUser,
  };
}

function requesterTicketWhere(
  ticketId: string,
  requesterUserId: string
): Prisma.TicketWhereInput {
  return {
    id: ticketId,
    requesterUserId,
  };
}

// ---------------------------------------------------------------------------
// Lab 3 - Authentication
// ---------------------------------------------------------------------------
app.post(
  "/api/v1/auth/login",
  async (req: Request, res: Response) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email
              .trim()
              .toLowerCase()
          : "";

      const password =
        typeof req.body?.password === "string"
          ? req.body.password
          : "";

      const fieldErrors: {
        field: string;
        message: string;
      }[] = [];

      if (!email) {
        fieldErrors.push({
          field: "email",
          message: "Email is required.",
        });
      }

      if (!password) {
        fieldErrors.push({
          field: "password",
          message: "Password is required.",
        });
      }

      if (fieldErrors.length > 0) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Email and password are required.",
            fieldErrors,
          },
        });
      }

      const prisma = getPrisma();

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      const validPassword =
        user && user.isActive
          ? await verifyPassword(
              password,
              user.passwordHash
            )
          : false;

      if (
        !user ||
        !user.isActive ||
        !validPassword
      ) {
        return res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              "Email or password is incorrect.",
            fieldErrors: [],
          },
        });
      }

      createSession(res, user.id);

      return res.status(200).json({
        data: {
          user: toSafeUser(user),
        },
      });
    } catch (error) {
      console.error(
        "Failed to sign in:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "AUTHENTICATION_FAILED",
          message:
            "Unable to sign in. Please try again.",
          fieldErrors: [],
        },
      });
    }
  }
);

app.post(
  "/api/v1/auth/logout",
  async (req: Request, res: Response) => {
    const user =
      await getAuthenticatedUser(req);

    if (!user) {
      return sendAuthenticationRequired(
        res
      );
    }

    destroySession(req, res);

    return res.status(204).send();
  }
);

app.get(
  "/api/v1/auth/me",
  async (req: Request, res: Response) => {
    const user =
      await getAuthenticatedUser(req);

    if (!user) {
      return sendAuthenticationRequired(
        res
      );
    }

    return res.status(200).json({
      data: {
        user: toSafeUser(user),
      },
    });
  }
);

app.post(
  "/api/v1/auth/change-password",
  async (req: Request, res: Response) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return sendAuthenticationRequired(
          res
        );
      }

      const currentPassword =
        typeof req.body?.currentPassword ===
        "string"
          ? req.body.currentPassword
          : "";

      const newPassword =
        typeof req.body?.newPassword ===
        "string"
          ? req.body.newPassword
          : "";

      const confirmPassword =
        typeof req.body?.confirmPassword ===
        "string"
          ? req.body.confirmPassword
          : "";

      const fieldErrors: {
        field: string;
        message: string;
      }[] = [];

      if (!currentPassword) {
        fieldErrors.push({
          field: "currentPassword",
          message:
            "Current password is required.",
        });
      }

      if (!newPassword) {
        fieldErrors.push({
          field: "newPassword",
          message:
            "New password is required.",
        });
      }

      if (
        newPassword !== confirmPassword
      ) {
        fieldErrors.push({
          field: "confirmPassword",
          message:
            "Password confirmation must match.",
        });
      }

      for (const message of validatePassword(
        newPassword
      )) {
        fieldErrors.push({
          field: "newPassword",
          message,
        });
      }

      if (fieldErrors.length > 0) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message:
              "One or more password fields are invalid.",
            fieldErrors,
          },
        });
      }

      const currentPasswordIsValid =
        await verifyPassword(
          currentPassword,
          user.passwordHash
        );

      if (!currentPasswordIsValid) {
        return res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              "Current password is incorrect.",
            fieldErrors: [],
          },
        });
      }

      const prisma = getPrisma();

      const updatedUser =
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            passwordHash:
              await hashPassword(
                newPassword
              ),
            passwordState: "Active",
          },
        });

      return res.status(200).json({
        data: {
          user: toSafeUser(
            updatedUser
          ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to change password:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "PASSWORD_CHANGE_FAILED",
          message:
            "Unable to change password. Please try again.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Staff authorization surfaces
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/staff/tickets",
  async (req: Request, res: Response) => {
    try {
      const staffUser =
        await requireRole(
          req,
          res,
          "ITStaff"
        );

      if (!staffUser) {
        return;
      }

      const prisma = getPrisma();

      const page =
        typeof req.query.page ===
        "string"
          ? Number(req.query.page)
          : 1;

      const pageSize =
        typeof req.query.pageSize ===
        "string"
          ? Number(req.query.pageSize)
          : 10;

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 50
      ) {
        return res.status(422).json({
          error: {
            code: "INVALID_PAGINATION",
            message:
              "Page or page size is invalid.",
            fieldErrors: [],
          },
        });
      }

      const totalItems =
        await prisma.ticket.count();

      const tickets =
        await prisma.ticket.findMany({
          include: {
            requester: true,
            category: true,
            relatedSystem: true,
            assignedTo: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          skip:
            (page - 1) *
            pageSize,
          take: pageSize,
        });

      return res.status(200).json({
        data: tickets.map((ticket) => ({
          id: ticket.id,
          ticketNo:
            ticket.ticketNo,

          requester: {
            id: ticket.requester.id,
            displayName:
              ticket.requester
                .displayName,
          },

          assignedTo:
            ticket.assignedTo
              ? toSafeUser(
                  ticket.assignedTo
                )
              : null,

          category: {
            id: ticket.category.id,
            name:
              ticket.category.name,
          },

          relatedSystem: {
            id:
              ticket.relatedSystem.id,
            name:
              ticket.relatedSystem.name,
          },

          summary:
            ticket.summary,
          requestedPriority:
            ticket.requestedPriority,
          status:
            ticket.status,
          createdAt:
            ticket.createdAt,
          updatedAt:
            ticket.updatedAt,
        })),

        meta: {
          page,
          pageSize,
          totalItems,
          totalPages:
            Math.ceil(
              totalItems /
                pageSize
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

app.get(
  "/api/v1/staff/tickets/:ticketId",
  async (req: Request, res: Response) => {
    try {
      const staffUser =
        await requireRole(
          req,
          res,
          "ITStaff"
        );

      if (!staffUser) {
        return;
      }

      const prisma = getPrisma();

      const ticket =
        await prisma.ticket.findUnique({
          where: {
            id: req.params.ticketId,
          },
          include: {
            requester: true,
            category: true,
            relatedSystem: true,
            assignedTo: true,
            attachments: {
              where: {
                isRemoved: false,
              },
            },
          },
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      return res.status(200).json({
        data: {
          id: ticket.id,
          ticketNo:
            ticket.ticketNo,

          requester: {
            id:
              ticket.requester.id,
            displayName:
              ticket.requester
                .displayName,
          },

          assignedTo:
            ticket.assignedTo
              ? toSafeUser(
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
              ticket.relatedSystem.id,
            name:
              ticket.relatedSystem.name,
          },

          summary:
            ticket.summary,
          description:
            ticket.description,
          requestedPriority:
            ticket.requestedPriority,
          status:
            ticket.status,

          attachments:
            ticket.attachments.map(
              (attachment) => ({
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
  "/api/v1/staff/tickets/:ticketId/internal-notes",
  async (req: Request, res: Response) => {
    try {
      const staffUser =
        await requireRole(
          req,
          res,
          "ITStaff"
        );

      if (!staffUser) {
        return;
      }

      const prisma = getPrisma();

      const ticket =
        await prisma.ticket.findUnique({
          where: {
            id: req.params.ticketId,
          },
          select: {
            id: true,
          },
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
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
        return res.status(422).json({
          error: {
            code:
              "VALIDATION_ERROR",
            message:
              "One or more Internal Note fields are invalid.",
            fieldErrors: [
              {
                field: "body",
                message:
                  "Internal Note body must contain between 1 and 2000 characters.",
              },
            ],
          },
        });
      }

      return res.status(201).json({
        data: {
          ticketId:
            ticket.id,
          body,
          visibility:
            "Internal",
          createdBy:
            toSafeUser(
              staffUser
            ),
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

// ---------------------------------------------------------------------------
// Lab 3 - Administrator authorization surfaces
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/admin/users",
  async (req: Request, res: Response) => {
    try {
      const adminUser =
        await requireRole(
          req,
          res,
          "Administrator"
        );

      if (!adminUser) {
        return;
      }

      const prisma = getPrisma();

      const page =
        typeof req.query.page ===
        "string"
          ? Number(req.query.page)
          : 1;

      const pageSize =
        typeof req.query.pageSize ===
        "string"
          ? Number(req.query.pageSize)
          : 10;

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(
          pageSize
        ) ||
        pageSize < 1 ||
        pageSize > 50
      ) {
        return res.status(422).json({
          error: {
            code:
              "INVALID_PAGINATION",
            message:
              "Page or page size is invalid.",
            fieldErrors: [],
          },
        });
      }

      const totalItems =
        await prisma.user.count();

      const users =
        await prisma.user.findMany({
          orderBy: {
            displayName:
              "asc",
          },
          skip:
            (page - 1) *
            pageSize,
          take: pageSize,
        });

      return res.status(200).json({
        data: users.map(
          (user) =>
            toSafeUser(user)
        ),

        meta: {
          page,
          pageSize,
          totalItems,
          totalPages:
            Math.ceil(
              totalItems /
                pageSize
            ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to load admin Users:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "ADMIN_USERS_FAILED",
          message:
            "Unable to load Users.",
          fieldErrors: [],
        },
      });
    }
  }
);

app.get(
  "/api/v1/admin/users/:userId",
  async (req: Request, res: Response) => {
    try {
      const adminUser =
        await requireRole(
          req,
          res,
          "Administrator"
        );

      if (!adminUser) {
        return;
      }

      const prisma = getPrisma();

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.params.userId,
          },
        });

      if (!user) {
        return res.status(404).json({
          error: {
            code:
              "USER_NOT_FOUND",
            message:
              "User not found.",
            fieldErrors: [],
          },
        });
      }

      return res.status(200).json({
        data:
          toSafeUser(user),
      });
    } catch (error) {
      console.error(
        "Failed to load admin User:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "ADMIN_USER_FAILED",
          message:
            "Unable to load User.",
          fieldErrors: [],
        },
      });
    }
  }
);

function sendAdminManagementNotImplemented(
  res: Response
) {
  return res.status(501).json({
    error: {
      code:
        "NOT_IMPLEMENTED",
      message:
        "Administrator user management is not implemented yet.",
      fieldErrors: [],
    },
  });
}

app.post(
  "/api/v1/admin/users",
  async (req: Request, res: Response) => {
    const adminUser =
      await requireRole(
        req,
        res,
        "Administrator"
      );

    if (!adminUser) {
      return;
    }

    return sendAdminManagementNotImplemented(
      res
    );
  }
);

app.patch(
  "/api/v1/admin/users/:userId",
  async (req: Request, res: Response) => {
    const adminUser =
      await requireRole(
        req,
        res,
        "Administrator"
      );

    if (!adminUser) {
      return;
    }

    return sendAdminManagementNotImplemented(
      res
    );
  }
);

app.patch(
  "/api/v1/admin/users/:userId/password",
  async (req: Request, res: Response) => {
    const adminUser =
      await requireRole(
        req,
        res,
        "Administrator"
      );

    if (!adminUser) {
      return;
    }

    return sendAdminManagementNotImplemented(
      res
    );
  }
);

// ---------------------------------------------------------------------------
// Lab 1 - API health check
// GET /api/health
// ---------------------------------------------------------------------------
app.get(
  "/api/health",
  (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "TokTickIT API",
    });
  }
);

// ---------------------------------------------------------------------------
// Lab 1 - Category list
// GET /api/categories
// ---------------------------------------------------------------------------
app.get(
  "/api/categories",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const categories =
        await prisma.category.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            id: "asc",
          },
        });

      return res
        .status(200)
        .json(categories);
    } catch (error) {
      console.error(
        "Failed to retrieve categories:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to load request categories",
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 2 - Active Development Requesters
// GET /api/v1/development-requesters
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/development-requesters",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesters =
        await prisma.developmentRequester.findMany(
          {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              displayName: true,
              email: true,
            },
            orderBy: {
              displayName: "asc",
            },
          }
        );

      return res.status(200).json({
        data: requesters,
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Development Requesters:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "REQUESTER_LIST_FAILED",
          message:
            "Unable to load Development Requesters.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 2 - Active Categories
// GET /api/v1/categories
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/categories",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const categories =
        await prisma.category.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            id: "asc",
          },
        });

      return res.status(200).json({
        data: categories,
      });
    } catch (error) {
      console.error(
        "Failed to retrieve categories:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "CATEGORY_LIST_FAILED",
          message:
            "Unable to load request categories.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 2 - Active Related Systems
// GET /api/v1/related-systems
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/related-systems",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const relatedSystems =
        await prisma.relatedSystem.findMany(
          {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              name: "asc",
            },
          }
        );

      return res.status(200).json({
        data: relatedSystems,
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Related Systems:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "RELATED_SYSTEM_LIST_FAILED",
          message:
            "Unable to load Related Systems.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Requester My Tickets
// GET /api/v1/tickets
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const search =
        typeof req.query.search ===
        "string"
          ? req.query.search.trim()
          : "";

      const categoryId =
        typeof req.query.categoryId ===
        "string"
          ? Number(
              req.query.categoryId
            )
          : undefined;

      const relatedSystemId =
        typeof req.query
          .relatedSystemId ===
        "string"
          ? req.query.relatedSystemId
          : undefined;

      const requestedPriority =
        typeof req.query
          .requestedPriority ===
        "string"
          ? req.query
              .requestedPriority
          : undefined;

      const status =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : undefined;

      const sort =
        typeof req.query.sort ===
        "string"
          ? req.query.sort
          : "updatedAt";

      const order =
        req.query.order === "asc"
          ? "asc"
          : "desc";

      const page =
        typeof req.query.page ===
        "string"
          ? Number(
              req.query.page
            )
          : 1;

      const pageSize =
        typeof req.query
          .pageSize === "string"
          ? Number(
              req.query.pageSize
            )
          : 10;

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(
          pageSize
        ) ||
        pageSize < 1 ||
        pageSize > 50
      ) {
        return res.status(422).json({
          error: {
            code:
              "INVALID_PAGINATION",
            message:
              "Page or page size is invalid.",
            fieldErrors: [],
          },
        });
      }

      const where:
        Prisma.TicketWhereInput = {
        requesterUserId:
          requesterContext.requesterUserId,

        ...(search
          ? {
              OR: [
                {
                  ticketNo: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  summary: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
                {
                  description: {
                    contains:
                      search,
                    mode:
                      "insensitive",
                  },
                },
              ],
            }
          : {}),

        ...(categoryId !==
          undefined &&
        !Number.isNaN(
          categoryId
        )
          ? {
              categoryId,
            }
          : {}),

        ...(relatedSystemId
          ? {
              relatedSystemId,
            }
          : {}),

        ...(requestedPriority
          ? {
              requestedPriority:
                requestedPriority as
                  | "Low"
                  | "Medium"
                  | "High"
                  | "Urgent",
            }
          : {}),

        ...(status
          ? {
              status:
                status as
                  | "New",
            }
          : {}),
      };

      const totalItems =
        await prisma.ticket.count({
          where,
        });

      const tickets =
        await prisma.ticket.findMany({
          where,
          include: {
            category: true,
            relatedSystem: true,
          },
          orderBy:
            sort === "ticketNo"
              ? [
                  {
                    ticketNo:
                      order,
                  },
                ]
              : sort ===
                  "createdAt"
                ? [
                    {
                      createdAt:
                        order,
                    },
                    {
                      ticketNo:
                        "desc",
                    },
                  ]
                : [
                    {
                      updatedAt:
                        order,
                    },
                    {
                      ticketNo:
                        "desc",
                    },
                  ],
        });

      const paginatedTickets =
        tickets.slice(
          (page - 1) *
            pageSize,
          page * pageSize
        );

      return res.status(200).json({
        data:
          paginatedTickets.map(
            (ticket) => ({
              id: ticket.id,
              ticketNo:
                ticket.ticketNo,
              summary:
                ticket.summary,

              category: {
                id:
                  ticket.category.id,
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
              status:
                ticket.status,
              createdAt:
                ticket.createdAt,
              updatedAt:
                ticket.updatedAt,
            })
          ),

        meta: {
          page,
          pageSize,
          totalItems,
          totalPages:
            totalItems === 0
              ? 0
              : Math.ceil(
                  totalItems /
                    pageSize
                ),
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve My Tickets:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "TICKET_LIST_FAILED",
          message:
            "Unable to load your Tickets.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Attachment Upload
// POST /api/v1/tickets/:ticketId/attachments
// ---------------------------------------------------------------------------
app.post(
  "/api/v1/tickets/:ticketId/attachments",
  attachmentUploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const ticketId =
        req.params.ticketId;

      const ticket =
        await prisma.ticket.findFirst({
          where:
            requesterTicketWhere(
              ticketId,
              requesterContext
                .requesterUserId
            ),
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      if (!req.file) {
        return res.status(422).json({
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
        return res.status(422).json({
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

                uploadedByRequesterId:
                  requesterContext
                    .requesterId,

                uploadedByUserId:
                  requesterContext
                    .requesterUserId,
              },
            }
          );

        return res.status(201).json({
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
            isRemoved:
              attachment.isRemoved,
            createdAt:
              attachment.createdAt,
          },
        });
      } catch (error) {
        await attachmentStorage.remove(
          storageKey
        );
        throw error;
      }
    } catch (error) {
      console.error(
        "Failed to upload Attachment:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "ATTACHMENT_UPLOAD_FAILED",
          message:
            "Unable to upload Attachment.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Attachment Metadata
// GET /api/v1/tickets/:ticketId/attachments
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets/:ticketId/attachments",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const ticketId =
        req.params.ticketId;

      const ticket =
        await prisma.ticket.findFirst({
          where:
            requesterTicketWhere(
              ticketId,
              requesterContext
                .requesterUserId
            ),
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      const attachments =
        await prisma.attachment.findMany(
          {
            where: {
              ticketId,
            },
            orderBy: {
              createdAt: "asc",
            },
          }
        );

      return res.status(200).json({
        data: attachments.map(
          (attachment) => ({
            id: attachment.id,
            ticketId:
              attachment.ticketId,
            originalFilename:
              attachment.originalFilename,
            mimeType:
              attachment.mimeType,
            sizeBytes:
              attachment.sizeBytes,
            isRemoved:
              attachment.isRemoved,
            removedAt:
              attachment.removedAt,
            removalReason:
              attachment.removalReason,
            createdAt:
              attachment.createdAt,
          })
        ),
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Attachments:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "ATTACHMENT_LIST_FAILED",
          message:
            "Unable to load Attachments.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Attachment Download
// GET /api/v1/tickets/:ticketId/attachments/:attachmentId/download
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets/:ticketId/attachments/:attachmentId/download",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const {
        ticketId,
        attachmentId,
      } = req.params;

      const ticket =
        await prisma.ticket.findFirst({
          where:
            requesterTicketWhere(
              ticketId,
              requesterContext
                .requesterUserId
            ),
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      const attachment =
        await prisma.attachment.findFirst(
          {
            where: {
              id: attachmentId,
              ticketId,
              isRemoved: false,
            },
          }
        );

      if (!attachment) {
        return res.status(404).json({
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
        return res.status(404).json({
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
        .send(storedFile.buffer);
    } catch (error) {
      console.error(
        "Failed to download Attachment:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "ATTACHMENT_DOWNLOAD_FAILED",
          message:
            "Unable to download Attachment.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Attachment Soft Removal
// DELETE /api/v1/tickets/:ticketId/attachments/:attachmentId
// ---------------------------------------------------------------------------
app.delete(
  "/api/v1/tickets/:ticketId/attachments/:attachmentId",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const confirmed =
        req.body?.confirmed;

      const reason =
        typeof req.body?.reason ===
        "string"
          ? req.body.reason.trim()
          : "";

      if (confirmed !== true) {
        return res.status(422).json({
          error: {
            code:
              "ATTACHMENT_REMOVAL_CONFIRMATION_REQUIRED",
            message:
              "Confirm Attachment removal before continuing.",
            fieldErrors: [],
          },
        });
      }

      if (!reason) {
        return res.status(422).json({
          error: {
            code:
              "ATTACHMENT_REMOVAL_REASON_REQUIRED",
            message:
              "A removal reason is required.",
            fieldErrors: [],
          },
        });
      }

      const {
        ticketId,
        attachmentId,
      } = req.params;

      const ticket =
        await prisma.ticket.findFirst({
          where:
            requesterTicketWhere(
              ticketId,
              requesterContext
                .requesterUserId
            ),
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      const attachment =
        await prisma.attachment.findFirst(
          {
            where: {
              id: attachmentId,
              ticketId,
              uploadedByUserId:
                requesterContext
                  .requesterUserId,
              isRemoved: false,
            },
          }
        );

      if (!attachment) {
        return res.status(404).json({
          error: {
            code:
              "ATTACHMENT_NOT_FOUND",
            message:
              "Attachment not found.",
            fieldErrors: [],
          },
        });
      }

      const removedAttachment =
        await prisma.attachment.update({
          where: {
            id: attachment.id,
          },
          data: {
            isRemoved: true,
            removedAt:
              new Date(),

            removedByRequesterId:
              requesterContext
                .requesterId,

            removedByUserId:
              requesterContext
                .requesterUserId,

            removalReason:
              reason,
          },
        });

      try {
        await attachmentStorage.remove(
          attachment.storageKey
        );
      } catch (storageError) {
        console.error(
          "Attachment storage cleanup failed:",
          storageError
        );
      }

      return res.status(200).json({
        data: {
          id:
            removedAttachment.id,
          ticketId:
            removedAttachment.ticketId,
          originalFilename:
            removedAttachment.originalFilename,
          mimeType:
            removedAttachment.mimeType,
          sizeBytes:
            removedAttachment.sizeBytes,
          isRemoved:
            removedAttachment.isRemoved,
          removedAt:
            removedAttachment.removedAt,
          removalReason:
            removedAttachment.removalReason,
          createdAt:
            removedAttachment.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Failed to remove Attachment:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "ATTACHMENT_REMOVAL_FAILED",
          message:
            "Unable to remove Attachment.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Requester Ticket Detail
// GET /api/v1/tickets/:id
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets/:id",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const ticket =
        await prisma.ticket.findFirst({
          where:
            requesterTicketWhere(
              req.params.id,
              requesterContext
                .requesterUserId
            ),
          include: {
            requester: true,
            category: true,
            relatedSystem: true,
          },
        });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code:
              "TICKET_NOT_FOUND",
            message:
              "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      return res.status(200).json({
        data: {
          id: ticket.id,
          ticketNo:
            ticket.ticketNo,

          requester: {
            id:
              ticket.requester.id,
            displayName:
              ticket.requester
                .displayName,
          },

          category: {
            id:
              ticket.category.id,
            name:
              ticket.category.name,
          },

          relatedSystem: {
            id:
              ticket.relatedSystem.id,
            name:
              ticket.relatedSystem.name,
          },

          summary:
            ticket.summary,
          description:
            ticket.description,
          requestedPriority:
            ticket.requestedPriority,
          status:
            ticket.status,
          createdAt:
            ticket.createdAt,
          updatedAt:
            ticket.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Ticket Detail:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "TICKET_DETAIL_FAILED",
          message:
            "Unable to load Ticket Detail.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Lab 3 - Create Ticket
// POST /api/v1/tickets
// ---------------------------------------------------------------------------
app.post(
  "/api/v1/tickets",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterContext =
        await getRequesterContext(
          req,
          res
        );

      if (!requesterContext) {
        return;
      }

      const {
        categoryId,
        relatedSystemId,
        summary,
        description,
        requestedPriority,
        clientRequestId,
      } = req.body;

      const trimmedSummary =
        typeof summary ===
        "string"
          ? summary.trim()
          : "";

      const trimmedDescription =
        typeof description ===
        "string"
          ? description.trim()
          : "";

      const allowedPriorities = [
        "Low",
        "Medium",
        "High",
        "Urgent",
      ];

      const fieldErrors: {
        field: string;
        message: string;
      }[] = [];

      if (
        trimmedSummary.length < 5 ||
        trimmedSummary.length > 120
      ) {
        fieldErrors.push({
          field: "summary",
          message:
            "Summary must contain between 5 and 120 characters.",
        });
      }

      if (
        trimmedDescription.length <
          10 ||
        trimmedDescription.length >
          2000
      ) {
        fieldErrors.push({
          field: "description",
          message:
            "Description must contain between 10 and 2000 characters.",
        });
      }

      if (
        !allowedPriorities.includes(
          requestedPriority
        )
      ) {
        fieldErrors.push({
          field:
            "requestedPriority",
          message:
            "Requested Priority is invalid.",
        });
      }

      if (
        !clientRequestId ||
        typeof clientRequestId !==
          "string"
      ) {
        fieldErrors.push({
          field:
            "clientRequestId",
          message:
            "Client request ID is required.",
        });
      }

      if (!Number.isInteger(categoryId)) {
        fieldErrors.push({
          field:
            "categoryId",
          message:
            "Category is required.",
        });
      }

      if (
        !relatedSystemId ||
        typeof relatedSystemId !==
          "string"
      ) {
        fieldErrors.push({
          field:
            "relatedSystemId",
          message:
            "Related System is required.",
        });
      }

      if (fieldErrors.length > 0) {
        return res.status(422).json({
          error: {
            code:
              "VALIDATION_ERROR",
            message:
              "One or more Ticket fields are invalid.",
            fieldErrors,
          },
        });
      }

      const category =
        await prisma.category.findFirst({
          where: {
            id: categoryId,
            isActive: true,
          },
        });

      if (!category) {
        return res.status(422).json({
          error: {
            code:
              "VALIDATION_ERROR",
            message:
              "One or more Ticket fields are invalid.",
            fieldErrors: [
              {
                field:
                  "categoryId",
                message:
                  "Selected Category is not available.",
              },
            ],
          },
        });
      }

      const relatedSystem =
        await prisma.relatedSystem.findFirst({
          where: {
            id: relatedSystemId,
            isActive: true,
          },
        });

      if (!relatedSystem) {
        return res.status(422).json({
          error: {
            code:
              "VALIDATION_ERROR",
            message:
              "One or more Ticket fields are invalid.",
            fieldErrors: [
              {
                field:
                  "relatedSystemId",
                message:
                  "Selected Related System is not available.",
              },
            ],
          },
        });
      }

      const existingTicket =
        await prisma.ticket.findUnique({
          where: {
            clientRequestId,
          },
          include: {
            requester: true,
            category: true,
            relatedSystem: true,
          },
        });

      if (existingTicket) {
        if (
          existingTicket
            .requesterUserId !==
          requesterContext
            .requesterUserId
        ) {
          return res.status(409).json({
            error: {
              code:
                "CLIENT_REQUEST_ID_CONFLICT",
              message:
                "This client request ID is already associated with another Requester.",
              fieldErrors: [],
            },
          });
        }

        return res.status(200).json({
          data: {
            id:
              existingTicket.id,
            ticketNo:
              existingTicket
                .ticketNo,

            requester: {
              id:
                existingTicket
                  .requester
                  .id,
              displayName:
                existingTicket
                  .requester
                  .displayName,
            },

            category: {
              id:
                existingTicket
                  .category
                  .id,
              name:
                existingTicket
                  .category
                  .name,
            },

            relatedSystem: {
              id:
                existingTicket
                  .relatedSystem
                  .id,
              name:
                existingTicket
                  .relatedSystem
                  .name,
            },

            summary:
              existingTicket
                .summary,
            description:
              existingTicket
                .description,
            requestedPriority:
              existingTicket
                .requestedPriority,
            status:
              existingTicket.status,
            createdAt:
              existingTicket
                .createdAt,
            updatedAt:
              existingTicket
                .updatedAt,
          },
        });
      }

      const currentYear =
        new Date().getUTCFullYear();

      const ticket =
        await prisma.$transaction(
          async (tx) => {
            const sequence =
              await tx.ticketNumberSequence.upsert(
                {
                  where: {
                    year:
                      currentYear,
                  },

                  update: {
                    lastNumber:
                      {
                        increment: 1,
                      },
                  },

                  create: {
                    year:
                      currentYear,
                    lastNumber:
                      1,
                  },
                }
              );

            const ticketNo =
              `TKT-${currentYear}-${String(
                sequence.lastNumber
              ).padStart(5, "0")}`;

            return tx.ticket.create({
              data: {
                ticketNo,

                // Lab 2 compatibility
                requesterId:
                  requesterContext
                    .requesterId,

                // Lab 3 authenticated ownership
                requesterUserId:
                  requesterContext
                    .requesterUserId,

                categoryId,
                relatedSystemId,
                summary:
                  trimmedSummary,
                description:
                  trimmedDescription,
                requestedPriority,
                status: "New",
                clientRequestId,
              },

              include: {
                requester: true,
                category: true,
                relatedSystem: true,
              },
            });
          }
        );

      return res.status(201).json({
        data: {
          id: ticket.id,
          ticketNo:
            ticket.ticketNo,

          requester: {
            id:
              ticket.requester.id,
            displayName:
              ticket.requester
                .displayName,
          },

          category: {
            id:
              ticket.category.id,
            name:
              ticket.category.name,
          },

          relatedSystem: {
            id:
              ticket.relatedSystem.id,
            name:
              ticket.relatedSystem.name,
          },

          summary:
            ticket.summary,
          description:
            ticket.description,
          requestedPriority:
            ticket.requestedPriority,
          status:
            ticket.status,
          createdAt:
            ticket.createdAt,
          updatedAt:
            ticket.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Failed to create Ticket:",
        error
      );

      return res.status(500).json({
        error: {
          code:
            "INTERNAL_ERROR",
          message:
            "TokTickIT could not create the Ticket. Please try again.",
          fieldErrors: [],
        },
      });
    }
  }
);

export default app;