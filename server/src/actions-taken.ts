
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Express, Response } from "express";

import {
  getAuthenticatedUser,
  sendAuthenticationRequired,
  sendForbidden,
} from "./auth/http.js";

import { getPrisma } from "./prisma.js";

// =========================================================
// Shared Types and Helpers
// =========================================================

const ACTION_TAKEN_INCLUDE = {
  performedBy: {
    select: {
      id: true,
      displayName: true,
    },
  },
} as const;

type ActionTakenCreateData = {
  ticketId: string;
  performedByUserId: string;
  actionAt: Date;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
};

type ActionTakenComparable = {
  ticketId: string;
  performedByUserId: string;
  actionAt: Date;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
};

function hasRole(
  user: { roles: unknown[] },
  role: "Requester" | "ITStaff" | "Administrator",
): boolean {
  return user.roles.some(
    (userRole) => String(userRole) === role,
  );
}

function sendValidationError(
  res: Response,
  message: string,
  fieldErrors: {
    field: string;
    message: string;
  }[],
) {
  return res.status(422).json({
    error: {
      code: "VALIDATION_ERROR",
      message,
      fieldErrors,
    },
  });
}

/**
 * Generates a deterministic UUID-shaped ID.
 *
 * The key is scoped by Ticket and authenticated performer.
 * The same key, Ticket and performer always produce the same ID.
 */
function createIdempotentActionId(
  ticketId: string,
  userId: string,
  idempotencyKey: string,
): string {
  const hex = createHash("sha256")
    .update(
      `toktickit:actions-taken:${ticketId}:${userId}:${idempotencyKey}`,
    )
    .digest("hex")
    .slice(0, 32)
    .split("");

  // UUID version 5 and RFC variant bits.
  hex[12] = "5";

  hex[16] = (
    (Number.parseInt(hex[16], 16) & 0x3) | 0x8
  ).toString(16);

  const value = hex.join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20, 32),
  ].join("-");
}

function isSameActionRequest(
  existing: ActionTakenComparable,
  requested: ActionTakenCreateData,
): boolean {
  return (
    existing.ticketId === requested.ticketId &&
    existing.performedByUserId ===
      requested.performedByUserId &&
    existing.actionAt.getTime() ===
      requested.actionAt.getTime() &&
    existing.description === requested.description &&
    existing.result === requested.result &&
    existing.followUpRequired ===
      requested.followUpRequired &&
    existing.followUpNote === requested.followUpNote &&
    existing.attachmentNotes === requested.attachmentNotes
  );
}

function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

// =========================================================
// Actions Taken Routes
// =========================================================

export function registerActionsTakenRoutes(app: Express) {
  // =======================================================
  // GET: List Actions Taken
  // =======================================================

  app.get(
    "/api/v1/tickets/:ticketId/actions-taken",
    async (req, res) => {
      try {
        // Authentication
        const user = await getAuthenticatedUser(req);

        if (!user) {
          sendAuthenticationRequired(res);
          return;
        }

        // Authorization
        const canAccessStaffTickets =
          hasRole(user, "ITStaff") ||
          hasRole(user, "Administrator");

        const isRequester = hasRole(user, "Requester");

        if (!canAccessStaffTickets && !isRequester) {
          sendForbidden(res);
          return;
        }

        const prisma = getPrisma();

        // Verify Ticket existence.
        const ticket = await prisma.ticket.findUnique({
          where: {
            id: req.params.ticketId,
          },
          select: {
            id: true,
            requesterUserId: true,
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

        // Requesters can read their own Tickets only.
        if (
          !canAccessStaffTickets &&
          ticket.requesterUserId !== user.id
        ) {
          return res.status(404).json({
            error: {
              code: "TICKET_NOT_FOUND",
              message: "Ticket not found.",
              fieldErrors: [],
            },
          });
        }

        const actions = await prisma.actionTaken.findMany({
          where: {
            ticketId: ticket.id,
          },
          orderBy: [
            { actionAt: "desc" },
            { createdAt: "desc" },
          ],
          include: ACTION_TAKEN_INCLUDE,
        });

        return res.status(200).json({
          data: actions,
        });
      } catch (error) {
        console.error(
          "Failed to list Actions Taken:",
          error,
        );

        return res.status(500).json({
          error: {
            code: "ACTIONS_TAKEN_FAILED",
            message: "Unable to retrieve Actions Taken.",
            fieldErrors: [],
          },
        });
      }
    },
  );

  // =======================================================
  // POST: Create Action Taken
  // =======================================================

  app.post(
    "/api/v1/tickets/:ticketId/actions-taken",
    async (req, res) => {
      try {
        // Authentication
        const user = await getAuthenticatedUser(req);

        if (!user) {
          sendAuthenticationRequired(res);
          return;
        }

        // Only IT Staff and Administrators can create.
        const canCreate =
          hasRole(user, "ITStaff") ||
          hasRole(user, "Administrator");

        if (!canCreate) {
          sendForbidden(res);
          return;
        }

        // Idempotency key
        const idempotencyKey =
          req.get("Idempotency-Key")?.trim() ?? "";

        // Request fields
        const body = req.body ?? {};

        const rawActionAt = body.actionAt;
        const rawDescription = body.description;
        const rawResult = body.result;
        const rawFollowUpRequired =
          body.followUpRequired;
        const rawFollowUpNote = body.followUpNote;
        const rawAttachmentNotes =
          body.attachmentNotes;

        const fieldErrors: {
          field: string;
          message: string;
        }[] = [];

        // Parse values
        const actionAt =
          typeof rawActionAt === "string"
            ? new Date(rawActionAt)
            : null;

        const description =
          typeof rawDescription === "string"
            ? rawDescription.trim()
            : "";

        const result =
          typeof rawResult === "string"
            ? rawResult.trim()
            : "";

        const followUpRequired =
          rawFollowUpRequired === undefined
            ? false
            : rawFollowUpRequired;

        const followUpNote =
          typeof rawFollowUpNote === "string"
            ? rawFollowUpNote.trim()
            : "";

        const attachmentNotes =
          typeof rawAttachmentNotes === "string"
            ? rawAttachmentNotes.trim()
            : null;

        // Idempotency validation
        if (
          idempotencyKey.length < 1 ||
          idempotencyKey.length > 128
        ) {
          fieldErrors.push({
            field: "idempotencyKey",
            message:
              "A valid Idempotency-Key header is required (maximum 128 characters).",
          });
        }

        // Action date validation
        if (
          !actionAt ||
          Number.isNaN(actionAt.getTime())
        ) {
          fieldErrors.push({
            field: "actionAt",
            message:
              "A valid action date and time is required.",
          });
        }

        // Description validation
        if (
          description.length < 1 ||
          description.length > 4000
        ) {
          fieldErrors.push({
            field: "description",
            message:
              "Description must contain between 1 and 4000 characters.",
          });
        }

        // Result validation
        if (
          result.length < 1 ||
          result.length > 4000
        ) {
          fieldErrors.push({
            field: "result",
            message:
              "Result must contain between 1 and 4000 characters.",
          });
        }

        // Follow-up Required validation
        if (typeof followUpRequired !== "boolean") {
          fieldErrors.push({
            field: "followUpRequired",
            message:
              "Follow-up Required must be true or false.",
          });
        }

        // Follow-up Note validation
        if (
          followUpRequired === true &&
          followUpNote.length === 0
        ) {
          fieldErrors.push({
            field: "followUpNote",
            message:
              "Follow-up Note is required when follow-up is required.",
          });
        }

        if (
          followUpNote.length > 2000 ||
          (rawFollowUpNote !== undefined &&
            rawFollowUpNote !== null &&
            typeof rawFollowUpNote !== "string")
        ) {
          fieldErrors.push({
            field: "followUpNote",
            message:
              "Follow-up Note is invalid or too long.",
          });
        }

        // Attachment Notes validation
        if (
          attachmentNotes !== null &&
          attachmentNotes.length > 2000
        ) {
          fieldErrors.push({
            field: "attachmentNotes",
            message:
              "Attachment Notes must not exceed 2000 characters.",
          });
        }

        if (
          rawAttachmentNotes !== undefined &&
          rawAttachmentNotes !== null &&
          typeof rawAttachmentNotes !== "string"
        ) {
          fieldErrors.push({
            field: "attachmentNotes",
            message:
              "Attachment Notes must be text or null.",
          });
        }

        if (fieldErrors.length > 0) {
          return sendValidationError(
            res,
            "Action Taken is invalid.",
            fieldErrors,
          );
        }

        const prisma = getPrisma();

        // Verify Ticket existence.
        const ticket = await prisma.ticket.findUnique({
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
              code: "TICKET_NOT_FOUND",
              message: "Ticket not found.",
              fieldErrors: [],
            },
          });
        }

        // Performer is always taken from authentication.
        const actionData: ActionTakenCreateData = {
          ticketId: ticket.id,
          performedByUserId: user.id,
          actionAt: actionAt!,
          description,
          result,
          followUpRequired,
          followUpNote: followUpNote || null,
          attachmentNotes,
        };

        // Generate deterministic ID for this request.
        const actionId = createIdempotentActionId(
          ticket.id,
          user.id,
          idempotencyKey,
        );

        // Check for a previous submission.
        const previousAction =
          await prisma.actionTaken.findUnique({
            where: {
              id: actionId,
            },
            include: ACTION_TAKEN_INCLUDE,
          });

        if (previousAction) {
          if (
            !isSameActionRequest(
              previousAction,
              actionData,
            )
          ) {
            return res.status(409).json({
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message:
                  "This Idempotency-Key was already used for a different request.",
                fieldErrors: [],
              },
            });
          }

          res.setHeader(
            "Idempotency-Replayed",
            "true",
          );

          return res.status(200).json({
            data: previousAction,
          });
        }

        // Create a new ActionTaken.
        try {
          const action = await prisma.actionTaken.create({
            data: {
              id: actionId,
              ...actionData,
            },
            include: ACTION_TAKEN_INCLUDE,
          });

          return res.status(201).json({
            data: action,
          });
        } catch (error) {
          // Handle concurrent duplicate submissions.
          if (!isUniqueConstraintError(error)) {
            throw error;
          }

          const concurrentAction =
            await prisma.actionTaken.findUnique({
              where: {
                id: actionId,
              },
              include: ACTION_TAKEN_INCLUDE,
            });

          if (!concurrentAction) {
            throw error;
          }

          if (
            !isSameActionRequest(
              concurrentAction,
              actionData,
            )
          ) {
            return res.status(409).json({
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message:
                  "This Idempotency-Key was already used for a different request.",
                fieldErrors: [],
              },
            });
          }

          res.setHeader(
            "Idempotency-Replayed",
            "true",
          );

          return res.status(200).json({
            data: concurrentAction,
          });
        }
      } catch (error) {
        console.error(
          "Failed to create Action Taken:",
          error,
        );

        return res.status(500).json({
          error: {
            code: "ACTIONS_TAKEN_FAILED",
            message: "Unable to create Action Taken.",
            fieldErrors: [],
          },
        });
      }
    },
  );

  // =======================================================
  // PATCH: Update Action Taken
  // =======================================================

  app.patch(
    "/api/v1/tickets/:ticketId/actions-taken/:actionId",
    async (req, res) => {
      try {
        // Authentication
        const user = await getAuthenticatedUser(req);

        if (!user) {
          sendAuthenticationRequired(res);
          return;
        }

        // Only IT Staff and Administrators can update.
        const canUpdate =
          hasRole(user, "ITStaff") ||
          hasRole(user, "Administrator");

        if (!canUpdate) {
          sendForbidden(res);
          return;
        }

        const prisma = getPrisma();

        const ticketId = req.params.ticketId;
        const actionId = req.params.actionId;

        // Verify Ticket.
        const ticket = await prisma.ticket.findUnique({
          where: {
            id: ticketId,
          },
          select: {
            id: true,
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

        // Verify ActionTaken belongs to this Ticket.
        const existing = await prisma.actionTaken.findFirst({
          where: {
            id: actionId,
            ticketId: ticket.id,
          },
        });

        if (!existing) {
          return res.status(404).json({
            error: {
              code: "ACTION_TAKEN_NOT_FOUND",
              message: "Action Taken not found.",
              fieldErrors: [],
            },
          });
        }

        // Optimistic concurrency validation.
        const expectedRaw = req.body?.expectedUpdatedAt;

        const expectedUpdatedAt =
          typeof expectedRaw === "string"
            ? new Date(expectedRaw)
            : null;

        if (
          !expectedUpdatedAt ||
          Number.isNaN(expectedUpdatedAt.getTime())
        ) {
          return sendValidationError(
            res,
            "A valid expectedUpdatedAt value is required.",
            [
              {
                field: "expectedUpdatedAt",
                message:
                  "Send the updatedAt value from the latest Action Taken response.",
              },
            ],
          );
        }

        if (
          expectedUpdatedAt.getTime() !==
          existing.updatedAt.getTime()
        ) {
          return res.status(409).json({
            error: {
              code: "STALE_ACTION_TAKEN",
              message:
                "This Action Taken has changed. Reload it before updating.",
              fieldErrors: [],
            },
          });
        }

        const body = req.body ?? {};

        const fieldErrors: {
          field: string;
          message: string;
        }[] = [];

        const data: {
          actionAt?: Date;
          description?: string;
          result?: string;
          followUpRequired?: boolean;
          followUpNote?: string | null;
          attachmentNotes?: string | null;
        } = {};

        // Action Date/Time
        if (body.actionAt !== undefined) {
          if (typeof body.actionAt !== "string") {
            fieldErrors.push({
              field: "actionAt",
              message:
                "Action date and time must be text.",
            });
          } else {
            const date = new Date(body.actionAt);

            if (Number.isNaN(date.getTime())) {
              fieldErrors.push({
                field: "actionAt",
                message:
                  "A valid action date and time is required.",
              });
            } else {
              data.actionAt = date;
            }
          }
        }

        // Description and Result
        for (
          const field of ["description", "result"] as const
        ) {
          if (body[field] === undefined) {
            continue;
          }

          if (typeof body[field] !== "string") {
            fieldErrors.push({
              field,
              message: `${field} must be text.`,
            });

            continue;
          }

          const value = body[field].trim();

          if (value.length < 1 || value.length > 4000) {
            fieldErrors.push({
              field,
              message:
                `${field} must contain between 1 and 4000 characters.`,
            });

            continue;
          }

          data[field] = value;
        }

        // Follow-up Required
        if (body.followUpRequired !== undefined) {
          if (
            typeof body.followUpRequired !== "boolean"
          ) {
            fieldErrors.push({
              field: "followUpRequired",
              message:
                "Follow-up Required must be true or false.",
            });
          } else {
            data.followUpRequired =
              body.followUpRequired;
          }
        }

        // Follow-up Note and Attachment Notes
        for (
          const field of [
            "followUpNote",
            "attachmentNotes",
          ] as const
        ) {
          if (body[field] === undefined) {
            continue;
          }

          const value = body[field];

          if (
            value !== null &&
            typeof value !== "string"
          ) {
            fieldErrors.push({
              field,
              message: `${field} must be text or null.`,
            });

            continue;
          }

          const trimmed =
            typeof value === "string"
              ? value.trim()
              : null;

          if (
            trimmed !== null &&
            trimmed.length > 2000
          ) {
            fieldErrors.push({
              field,
              message:
                `${field} must not exceed 2000 characters.`,
            });

            continue;
          }

          data[field] =
            trimmed === "" ? null : trimmed;
        }

        // At least one editable field is required.
        if (Object.keys(data).length === 0) {
          fieldErrors.push({
            field: "body",
            message:
              "Provide at least one field to update.",
          });
        }

        // Validate final follow-up state.
        const nextFollowUpRequired =
          data.followUpRequired ??
          existing.followUpRequired;

        const nextFollowUpNote =
          data.followUpNote !== undefined
            ? data.followUpNote
            : existing.followUpNote;

        if (
          nextFollowUpRequired &&
          !nextFollowUpNote?.trim()
        ) {
          fieldErrors.push({
            field: "followUpNote",
            message:
              "Follow-up Note is required when follow-up is required.",
          });
        }

        if (fieldErrors.length > 0) {
          return sendValidationError(
            res,
            "Action Taken update is invalid.",
            fieldErrors,
          );
        }

        // Atomic stale-update protection.
        const update = await prisma.actionTaken.updateMany({
          where: {
            id: actionId,
            ticketId: ticket.id,
            updatedAt: expectedUpdatedAt,
          },
          data,
        });

        if (update.count !== 1) {
          return res.status(409).json({
            error: {
              code: "STALE_ACTION_TAKEN",
              message:
                "This Action Taken has changed. Reload it before updating.",
              fieldErrors: [],
            },
          });
        }

        const updatedAction =
          await prisma.actionTaken.findUnique({
            where: {
              id: actionId,
            },
            include: ACTION_TAKEN_INCLUDE,
          });

        if (!updatedAction) {
          return res.status(404).json({
            error: {
              code: "ACTION_TAKEN_NOT_FOUND",
              message: "Action Taken not found.",
              fieldErrors: [],
            },
          });
        }

        return res.status(200).json({
          data: updatedAction,
        });
      } catch (error) {
        console.error(
          "Failed to update Action Taken:",
          error,
        );

        return res.status(500).json({
          error: {
            code: "ACTIONS_TAKEN_FAILED",
            message: "Unable to update Action Taken.",
            fieldErrors: [],
          },
        });
      }
    },
  );
}
