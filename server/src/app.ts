import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { attachmentStorage } from "./attachments/storage.js";
import { attachmentUploadMiddleware } from "./attachments/upload.js";

export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Lab 1 - API health check
// GET /api/health
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// ---------------------------------------------------------------------------
// Lab 1 - Category list
// GET /api/categories
// Keep this endpoint for Lab 1 compatibility.
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json(categories);
  } catch (error) {
    console.error("Failed to retrieve categories:", error);

    res.status(500).json({
      error: "Unable to load request categories",
    });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 - Active Development Requesters
// GET /api/v1/development-requesters
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/development-requesters",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesters = await prisma.developmentRequester.findMany({
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
      });

      res.status(200).json({
        data: requesters,
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Development Requesters:",
        error
      );

      res.status(500).json({
        error: {
          code: "REQUESTER_LIST_FAILED",
          message: "Unable to load Development Requesters.",
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
app.get("/api/v1/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const categories = await prisma.category.findMany({
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

    res.status(200).json({
      data: categories,
    });
  } catch (error) {
    console.error("Failed to retrieve categories:", error);

    res.status(500).json({
      error: {
        code: "CATEGORY_LIST_FAILED",
        message: "Unable to load request categories.",
        fieldErrors: [],
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 - Active Related Systems
// GET /api/v1/related-systems
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/related-systems",
  async (_req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const relatedSystems = await prisma.relatedSystem.findMany({
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
      });

      res.status(200).json({
        data: relatedSystems,
      });
    } catch (error) {
      console.error("Failed to retrieve Related Systems:", error);

      res.status(500).json({
        error: {
          code: "RELATED_SYSTEM_LIST_FAILED",
          message: "Unable to load Related Systems.",
          fieldErrors: [],
        },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Lab 2 - My Tickets
// GET /api/v1/tickets
// Supports ownership, search, filters, sorting and pagination.
// ---------------------------------------------------------------------------
app.get("/api/v1/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const requesterId = req.header("X-Development-Requester-Id");

    if (!requesterId) {
      return res.status(422).json({
        error: {
          code: "DEVELOPMENT_REQUESTER_REQUIRED",
          message:
            "Select a Development Requester before using this feature.",
          fieldErrors: [],
        },
      });
    }

    const requester = await prisma.developmentRequester.findFirst({
      where: {
        id: requesterId,
        isActive: true,
      },
    });

    if (!requester) {
      return res.status(422).json({
        error: {
          code: "DEVELOPMENT_REQUESTER_INVALID",
          message:
            "The selected Development Requester is not available.",
          fieldErrors: [],
        },
      });
    }

    // Search
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    // Filters
    const categoryId =
      typeof req.query.categoryId === "string"
        ? Number(req.query.categoryId)
        : undefined;

    const relatedSystemId =
      typeof req.query.relatedSystemId === "string"
        ? req.query.relatedSystemId
        : undefined;

    const requestedPriority =
      typeof req.query.requestedPriority === "string"
        ? req.query.requestedPriority
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    // Sorting
    const sort =
      typeof req.query.sort === "string"
        ? req.query.sort
        : "updatedAt";

    const order =
      req.query.order === "asc" ? "asc" : "desc";

    // Pagination
    const page =
      typeof req.query.page === "string"
        ? Number(req.query.page)
        : 1;

    const pageSize =
      typeof req.query.pageSize === "string"
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
          message: "Page or page size is invalid.",
          fieldErrors: [],
        },
      });
    }

    const where: Prisma.TicketWhereInput = {
      requesterId,

      ...(search
        ? {
            OR: [
              {
                ticketNo: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                summary: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),

      ...(categoryId !== undefined &&
      !Number.isNaN(categoryId)
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
            requestedPriority: requestedPriority as
              | "Low"
              | "Medium"
              | "High"
              | "Urgent",
          }
        : {}),

      ...(status
        ? {
            status: status as "New",
          }
        : {}),
    };

    const totalItems = await prisma.ticket.count({
      where,
    });

    const tickets = await prisma.ticket.findMany({
      where,

      include: {
        category: true,
        relatedSystem: true,
      },

      orderBy:
        sort === "ticketNo"
          ? [
              {
                ticketNo: order,
              },
            ]
          : sort === "createdAt"
            ? [
                {
                  createdAt: order,
                },
                {
                  ticketNo: "desc",
                },
              ]
            : [
                {
                  updatedAt: order,
                },
                {
                  ticketNo: "desc",
                },
              ],

      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      data: tickets.map((ticket) => ({
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        summary: ticket.summary,

        category: {
          id: ticket.category.id,
          name: ticket.category.name,
        },

        relatedSystem: {
          id: ticket.relatedSystem.id,
          name: ticket.relatedSystem.name,
        },

        requestedPriority: ticket.requestedPriority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })),

      meta: {
        page,
        pageSize,
        totalItems,
        totalPages:
          totalItems === 0
            ? 0
            : Math.ceil(totalItems / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve My Tickets:", error);

    return res.status(500).json({
      error: {
        code: "TICKET_LIST_FAILED",
        message: "Unable to load your Tickets.",
        fieldErrors: [],
      },
    });
  }
});
// ---------------------------------------------------------------------------
// Lab 2 - Attachment Upload
// POST /api/v1/tickets/:ticketId/attachments
// ---------------------------------------------------------------------------
app.post(
  "/api/v1/tickets/:ticketId/attachments",
  attachmentUploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterId = req.header(
        "X-Development-Requester-Id"
      );

      if (!requesterId) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_REQUIRED",
            message:
              "Select a Development Requester before using this feature.",
            fieldErrors: [],
          },
        });
      }

      const requester =
        await prisma.developmentRequester.findFirst({
          where: {
            id: requesterId,
            isActive: true,
          },
        });

      if (!requester) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_INVALID",
            message:
              "The selected Development Requester is not available.",
            fieldErrors: [],
          },
        });
      }

      const ticketId = req.params.ticketId;

      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          requesterId,
        },
      });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      if (!req.file) {
        return res.status(422).json({
          error: {
            code: "ATTACHMENT_REQUIRED",
            message: "Select a file to upload.",
            fieldErrors: [],
          },
        });
      }

      const activeAttachmentCount =
        await prisma.attachment.count({
          where: {
            ticketId,
            isRemoved: false,
          },
        });

      if (activeAttachmentCount >= 5) {
        return res.status(422).json({
          error: {
            code: "ATTACHMENT_LIMIT_REACHED",
            message:
              "A Ticket may contain no more than five active Attachments.",
            fieldErrors: [],
          },
        });
      }

      const storageKey = randomUUID();

      await attachmentStorage.save(
        storageKey,
        req.file.buffer,
        req.file.mimetype
      );

      try {
        const attachment =
          await prisma.attachment.create({
            data: {
              ticketId,
              originalFilename:
                req.file.originalname,
              storageKey,
              mimeType: req.file.mimetype,
              sizeBytes: req.file.size,
              uploadedByRequesterId:
                requesterId,
            },
          });

        return res.status(201).json({
          data: {
            id: attachment.id,
            ticketId: attachment.ticketId,
            originalFilename:
              attachment.originalFilename,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            isRemoved: attachment.isRemoved,
            createdAt: attachment.createdAt,
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
          code: "ATTACHMENT_UPLOAD_FAILED",
          message:
            "Unable to upload Attachment.",
          fieldErrors: [],
        },
      });
    }
  }
);
// ---------------------------------------------------------------------------
// Lab 2 - Attachment Metadata
// GET /api/v1/tickets/:ticketId/attachments
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets/:ticketId/attachments",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterId = req.header(
        "X-Development-Requester-Id"
      );

      if (!requesterId) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_REQUIRED",
            message:
              "Select a Development Requester before using this feature.",
            fieldErrors: [],
          },
        });
      }

      const requester =
        await prisma.developmentRequester.findFirst({
          where: {
            id: requesterId,
            isActive: true,
          },
        });

      if (!requester) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_INVALID",
            message:
              "The selected Development Requester is not available.",
            fieldErrors: [],
          },
        });
      }

      const ticketId = req.params.ticketId;

      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          requesterId,
        },
      });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      const attachments =
        await prisma.attachment.findMany({
          where: {
            ticketId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      return res.status(200).json({
        data: attachments.map((attachment) => ({
          id: attachment.id,
          ticketId: attachment.ticketId,
          originalFilename:
            attachment.originalFilename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          isRemoved: attachment.isRemoved,
          removedAt: attachment.removedAt,
          removalReason:
            attachment.removalReason,
          createdAt: attachment.createdAt,
        })),
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Attachments:",
        error
      );

      return res.status(500).json({
        error: {
          code: "ATTACHMENT_LIST_FAILED",
          message:
            "Unable to load Attachments.",
          fieldErrors: [],
        },
      });
    }
  }
);
// ---------------------------------------------------------------------------
// Lab 2 - Attachment Download
// GET /api/v1/tickets/:ticketId/attachments/:attachmentId/download
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets/:ticketId/attachments/:attachmentId/download",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterId = req.header(
        "X-Development-Requester-Id"
      );

      if (!requesterId) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_REQUIRED",
            message:
              "Select a Development Requester before using this feature.",
            fieldErrors: [],
          },
        });
      }

      const requester =
        await prisma.developmentRequester.findFirst({
          where: {
            id: requesterId,
            isActive: true,
          },
        });

      if (!requester) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_INVALID",
            message:
              "The selected Development Requester is not available.",
            fieldErrors: [],
          },
        });
      }

      const { ticketId, attachmentId } = req.params;

      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          requesterId,
        },
      });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      const attachment =
        await prisma.attachment.findFirst({
          where: {
            id: attachmentId,
            ticketId,
            isRemoved: false,
          },
        });

      if (!attachment) {
        return res.status(404).json({
          error: {
            code: "ATTACHMENT_NOT_FOUND",
            message: "Attachment not found.",
            fieldErrors: [],
          },
        });
      }

      const storedFile = await attachmentStorage.get(
        attachment.storageKey
      );

      if (!storedFile) {
        return res.status(404).json({
          error: {
            code: "ATTACHMENT_FILE_NOT_FOUND",
            message: "Attachment file not found.",
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

      return res.status(200).send(storedFile.buffer);
    } catch (error) {
      console.error(
        "Failed to download Attachment:",
        error
      );

      return res.status(500).json({
        error: {
          code: "ATTACHMENT_DOWNLOAD_FAILED",
          message:
            "Unable to download Attachment.",
          fieldErrors: [],
        },
      });
    }
  }
);
// ---------------------------------------------------------------------------
// Lab 2 - Attachment Soft Removal
// DELETE /api/v1/tickets/:ticketId/attachments/:attachmentId
// ---------------------------------------------------------------------------
app.delete(
  "/api/v1/tickets/:ticketId/attachments/:attachmentId",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterId = req.header(
        "X-Development-Requester-Id"
      );

      if (!requesterId) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_REQUIRED",
            message:
              "Select a Development Requester before using this feature.",
            fieldErrors: [],
          },
        });
      }

      const requester =
        await prisma.developmentRequester.findFirst({
          where: {
            id: requesterId,
            isActive: true,
          },
        });

      if (!requester) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_INVALID",
            message:
              "The selected Development Requester is not available.",
            fieldErrors: [],
          },
        });
      }

      const confirmed = req.body?.confirmed;
      const reason =
        typeof req.body?.reason === "string"
          ? req.body.reason.trim()
          : "";

      if (confirmed !== true) {
        return res.status(422).json({
          error: {
            code: "ATTACHMENT_REMOVAL_CONFIRMATION_REQUIRED",
            message:
              "Confirm Attachment removal before continuing.",
            fieldErrors: [],
          },
        });
      }

      if (!reason) {
        return res.status(422).json({
          error: {
            code: "ATTACHMENT_REMOVAL_REASON_REQUIRED",
            message:
              "A removal reason is required.",
            fieldErrors: [],
          },
        });
      }

      const { ticketId, attachmentId } = req.params;

      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          requesterId,
        },
      });

      if (!ticket) {
        return res.status(404).json({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      const attachment =
        await prisma.attachment.findFirst({
          where: {
            id: attachmentId,
            ticketId,
            uploadedByRequesterId: requesterId,
            isRemoved: false,
          },
        });

      if (!attachment) {
        return res.status(404).json({
          error: {
            code: "ATTACHMENT_NOT_FOUND",
            message: "Attachment not found.",
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
            removedAt: new Date(),
            removedByRequesterId: requesterId,
            removalReason: reason,
          },
        });

      // Storage deletion happens after metadata is soft-removed.
      // If storage deletion fails, the Attachment remains hidden.
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
          id: removedAttachment.id,
          ticketId: removedAttachment.ticketId,
          originalFilename:
            removedAttachment.originalFilename,
          mimeType: removedAttachment.mimeType,
          sizeBytes: removedAttachment.sizeBytes,
          isRemoved: removedAttachment.isRemoved,
          removedAt: removedAttachment.removedAt,
          removalReason:
            removedAttachment.removalReason,
          createdAt: removedAttachment.createdAt,
        },
      });
    } catch (error) {
      console.error(
        "Failed to remove Attachment:",
        error
      );

      return res.status(500).json({
        error: {
          code: "ATTACHMENT_REMOVAL_FAILED",
          message:
            "Unable to remove Attachment.",
          fieldErrors: [],
        },
      });
    }
  }
);
// ---------------------------------------------------------------------------
// Lab 2 - Requester Ticket Detail
// GET /api/v1/tickets/:id
// ---------------------------------------------------------------------------
app.get(
  "/api/v1/tickets/:id",
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();

      const requesterId = req.header(
        "X-Development-Requester-Id"
      );

      if (!requesterId) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_REQUIRED",
            message:
              "Select a Development Requester before using this feature.",
            fieldErrors: [],
          },
        });
      }

      const requester =
        await prisma.developmentRequester.findFirst({
          where: {
            id: requesterId,
            isActive: true,
          },
        });

      if (!requester) {
        return res.status(422).json({
          error: {
            code: "DEVELOPMENT_REQUESTER_INVALID",
            message:
              "The selected Development Requester is not available.",
            fieldErrors: [],
          },
        });
      }

      const ticket = await prisma.ticket.findFirst({
        where: {
          id: req.params.id,
          requesterId,
        },
        include: {
          requester: true,
          category: true,
          relatedSystem: true,
        },
      });

      // Do not reveal whether another Requester's Ticket exists.
      if (!ticket) {
        return res.status(404).json({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
            fieldErrors: [],
          },
        });
      }

      return res.status(200).json({
        data: {
          id: ticket.id,
          ticketNo: ticket.ticketNo,

          requester: {
            id: ticket.requester.id,
            displayName: ticket.requester.displayName,
          },

          category: {
            id: ticket.category.id,
            name: ticket.category.name,
          },

          relatedSystem: {
            id: ticket.relatedSystem.id,
            name: ticket.relatedSystem.name,
          },

          summary: ticket.summary,
          description: ticket.description,
          requestedPriority: ticket.requestedPriority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Failed to retrieve Ticket Detail:",
        error
      );

      return res.status(500).json({
        error: {
          code: "TICKET_DETAIL_FAILED",
          message: "Unable to load Ticket Detail.",
          fieldErrors: [],
        },
      });
    }
  }
);
// ---------------------------------------------------------------------------
// Lab 2 - Create Ticket
// POST /api/v1/tickets
// ---------------------------------------------------------------------------
app.post("/api/v1/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();

    const requesterId = req.header("X-Development-Requester-Id");

    if (!requesterId) {
      return res.status(422).json({
        error: {
          code: "DEVELOPMENT_REQUESTER_REQUIRED",
          message:
            "Select a Development Requester before using this feature.",
          fieldErrors: [],
        },
      });
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
      typeof summary === "string" ? summary.trim() : "";

    const trimmedDescription =
      typeof description === "string"
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
      trimmedDescription.length < 10 ||
      trimmedDescription.length > 2000
    ) {
      fieldErrors.push({
        field: "description",
        message:
          "Description must contain between 10 and 2000 characters.",
      });
    }

    if (!allowedPriorities.includes(requestedPriority)) {
      fieldErrors.push({
        field: "requestedPriority",
        message: "Requested Priority is invalid.",
      });
    }

    if (
      !clientRequestId ||
      typeof clientRequestId !== "string"
    ) {
      fieldErrors.push({
        field: "clientRequestId",
        message: "Client request ID is required.",
      });
    }

    if (!Number.isInteger(categoryId)) {
      fieldErrors.push({
        field: "categoryId",
        message: "Category is required.",
      });
    }

    if (
      !relatedSystemId ||
      typeof relatedSystemId !== "string"
    ) {
      fieldErrors.push({
        field: "relatedSystemId",
        message: "Related System is required.",
      });
    }

    if (fieldErrors.length > 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "One or more Ticket fields are invalid.",
          fieldErrors,
        },
      });
    }

    const requester =
      await prisma.developmentRequester.findFirst({
        where: {
          id: requesterId,
          isActive: true,
        },
      });

    if (!requester) {
      return res.status(422).json({
        error: {
          code: "DEVELOPMENT_REQUESTER_INVALID",
          message:
            "The selected Development Requester is not available.",
          fieldErrors: [],
        },
      });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
      },
    });

    if (!category) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "One or more Ticket fields are invalid.",
          fieldErrors: [
            {
              field: "categoryId",
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
          code: "VALIDATION_ERROR",
          message: "One or more Ticket fields are invalid.",
          fieldErrors: [
            {
              field: "relatedSystemId",
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
      if (existingTicket.requesterId !== requesterId) {
        return res.status(409).json({
          error: {
            code: "CLIENT_REQUEST_ID_CONFLICT",
            message:
              "This client request ID is already associated with another Requester.",
            fieldErrors: [],
          },
        });
      }

      return res.status(200).json({
        data: {
          id: existingTicket.id,
          ticketNo: existingTicket.ticketNo,

          requester: {
            id: existingTicket.requester.id,
            displayName:
              existingTicket.requester.displayName,
          },

          category: {
            id: existingTicket.category.id,
            name: existingTicket.category.name,
          },

          relatedSystem: {
            id: existingTicket.relatedSystem.id,
            name: existingTicket.relatedSystem.name,
          },

          summary: existingTicket.summary,
          description: existingTicket.description,
          requestedPriority:
            existingTicket.requestedPriority,
          status: existingTicket.status,
          createdAt: existingTicket.createdAt,
          updatedAt: existingTicket.updatedAt,
        },
      });
    }

    const currentYear = new Date().getUTCFullYear();

    const ticket = await prisma.$transaction(
      async (tx) => {
        const sequence =
          await tx.ticketNumberSequence.upsert({
            where: {
              year: currentYear,
            },

            update: {
              lastNumber: {
                increment: 1,
              },
            },

            create: {
              year: currentYear,
              lastNumber: 1,
            },
          });

        const ticketNo = `TKT-${currentYear}-${String(
          sequence.lastNumber
        ).padStart(5, "0")}`;

        return tx.ticket.create({
          data: {
            ticketNo,
            requesterId,
            categoryId,
            relatedSystemId,
            summary: trimmedSummary,
            description: trimmedDescription,
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
        ticketNo: ticket.ticketNo,

        requester: {
          id: ticket.requester.id,
          displayName: ticket.requester.displayName,
        },

        category: {
          id: ticket.category.id,
          name: ticket.category.name,
        },

        relatedSystem: {
          id: ticket.relatedSystem.id,
          name: ticket.relatedSystem.name,
        },

        summary: ticket.summary,
        description: ticket.description,
        requestedPriority: ticket.requestedPriority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to create Ticket:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message:
          "TokTickIT could not create the Ticket. Please try again.",
        fieldErrors: [],
      },
    });
  }
});

export default app;
