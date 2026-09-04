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

export default app;