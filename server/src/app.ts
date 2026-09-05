import express, { Request, Response } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

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
      console.error("Failed to retrieve Development Requesters:", error);

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
app.get("/api/v1/related-systems", async (_req: Request, res: Response) => {
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
});

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
          message: "Select a Development Requester before using this feature.",
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
      typeof description === "string" ? description.trim() : "";

    const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

    const fieldErrors: { field: string; message: string }[] = [];

    if (trimmedSummary.length < 5 || trimmedSummary.length > 120) {
      fieldErrors.push({
        field: "summary",
        message: "Summary must contain between 5 and 120 characters.",
      });
    }

    if (
      trimmedDescription.length < 10 ||
      trimmedDescription.length > 2000
    ) {
      fieldErrors.push({
        field: "description",
        message: "Description must contain between 10 and 2000 characters.",
      });
    }

    if (!allowedPriorities.includes(requestedPriority)) {
      fieldErrors.push({
        field: "requestedPriority",
        message: "Requested Priority is invalid.",
      });
    }

    if (!clientRequestId || typeof clientRequestId !== "string") {
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

    if (!relatedSystemId || typeof relatedSystemId !== "string") {
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
          message: "The selected Development Requester is not available.",
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
              message: "Selected Category is not available.",
            },
          ],
        },
      });
    }

    const relatedSystem = await prisma.relatedSystem.findFirst({
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
              message: "Selected Related System is not available.",
            },
          ],
        },
      });
    }

    const existingTicket = await prisma.ticket.findUnique({
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
        displayName: existingTicket.requester.displayName,
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
      requestedPriority: existingTicket.requestedPriority,
      status: existingTicket.status,
      createdAt: existingTicket.createdAt,
      updatedAt: existingTicket.updatedAt,
    },
  });
}

    const currentYear = new Date().getUTCFullYear();

    const ticket = await prisma.$transaction(async (tx) => {
      const sequence = await tx.ticketNumberSequence.upsert({
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
    });

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
        message: "TokTickIT could not create the Ticket. Please try again.",
        fieldErrors: [],
      },
    });
  }
});

export default app;