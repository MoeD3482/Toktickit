import type { Express } from "express";
import {
  getAuthenticatedUser,
  sendAuthenticationRequired,
  sendForbidden,
} from "./auth/http.js";
import { getPrisma } from "./prisma.js";

function hasRole(
  user: { roles: unknown[] },
  role: "Requester" | "ITStaff" | "Administrator",
): boolean {
  return user.roles.some(
    (userRole) => String(userRole) === role,
  );
}

export function registerActionsTakenRoutes(app: Express) {
  app.get(
    "/api/v1/tickets/:ticketId/actions-taken",
    async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
          sendAuthenticationRequired(res);
          return;
        }

        const canAccessStaffTickets =
          hasRole(user, "ITStaff") ||
          hasRole(user, "Administrator");

        const isRequester = hasRole(user, "Requester");

        if (!canAccessStaffTickets && !isRequester) {
          sendForbidden(res);
          return;
        }

        const prisma = getPrisma();

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

        // Requesters may only read their own Tickets.
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
          include: {
            performedBy: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
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
    app.post
    (
    "/api/v1/tickets/:ticketId/actions-taken",
    async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
          sendAuthenticationRequired(res);
          return;
        }

        const canCreate =
          hasRole(user, "ITStaff") ||
          hasRole(user, "Administrator");

        if (!canCreate) {
          sendForbidden(res);
          return;
        }

        const rawActionAt = req.body?.actionAt;
        const rawDescription = req.body?.description;
        const rawResult = req.body?.result;
        const rawFollowUpRequired =
          req.body?.followUpRequired;
        const rawFollowUpNote = req.body?.followUpNote;
        const rawAttachmentNotes =
          req.body?.attachmentNotes;

        const fieldErrors: {
          field: string;
          message: string;
        }[] = [];

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

        if (
          !actionAt ||
          Number.isNaN(actionAt.getTime())
        ) {
          fieldErrors.push({
            field: "actionAt",
            message: "A valid action date and time is required.",
          });
        }

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

        if (result.length < 1 || result.length > 4000) {
          fieldErrors.push({
            field: "result",
            message:
              "Result must contain between 1 and 4000 characters.",
          });
        }

        if (typeof followUpRequired !== "boolean") {
          fieldErrors.push({
            field: "followUpRequired",
            message: "Follow-up Required must be true or false.",
          });
        }

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
            message: "Follow-up Note is invalid or too long.",
          });
        }

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
            message: "Attachment Notes must be text or null.",
          });
        }

        if (fieldErrors.length > 0) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Action Taken is invalid.",
              fieldErrors,
            },
          });
        }

        const prisma = getPrisma();

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

        const action = await prisma.actionTaken.create({
          data: {
            ticketId: ticket.id,
            performedByUserId: user.id,
            actionAt: actionAt!,
            description,
            result,
            followUpRequired,
            followUpNote: followUpNote || null,
            attachmentNotes,
          },
          include: {
            performedBy: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        });

        return res.status(201).json({
          data: action,
        });
      } catch (error) {
        console.error("Failed to create Action Taken:", error);

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
    app.patch(
    "/api/v1/tickets/:ticketId/actions-taken/:actionId",
    async (req, res) => {
      try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
          sendAuthenticationRequired(res);
          return;
        }

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

        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { id: true },
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

        const expectedRaw = req.body?.expectedUpdatedAt;
        const expectedUpdatedAt =
          typeof expectedRaw === "string"
            ? new Date(expectedRaw)
            : null;

        if (
          !expectedUpdatedAt ||
          Number.isNaN(expectedUpdatedAt.getTime())
        ) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "A valid expectedUpdatedAt value is required.",
              fieldErrors: [
                {
                  field: "expectedUpdatedAt",
                  message:
                    "Send the updatedAt value from the latest Action Taken response.",
                },
              ],
            },
          });
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

        if (body.actionAt !== undefined) {
          if (typeof body.actionAt !== "string") {
            fieldErrors.push({
              field: "actionAt",
              message: "Action date and time must be text.",
            });
          } else {
            const date = new Date(body.actionAt);

            if (Number.isNaN(date.getTime())) {
              fieldErrors.push({
                field: "actionAt",
                message: "A valid action date and time is required.",
              });
            } else {
              data.actionAt = date;
            }
          }
        }

        for (const field of ["description", "result"] as const) {
          if (body[field] === undefined) continue;

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
              message: `${field} must contain between 1 and 4000 characters.`,
            });
            continue;
          }

          data[field] = value;
        }

        if (body.followUpRequired !== undefined) {
          if (typeof body.followUpRequired !== "boolean") {
            fieldErrors.push({
              field: "followUpRequired",
              message: "Follow-up Required must be true or false.",
            });
          } else {
            data.followUpRequired = body.followUpRequired;
          }
        }

        for (
          const field of ["followUpNote", "attachmentNotes"] as const
        ) {
          if (body[field] === undefined) continue;

          const value = body[field];

          if (value !== null && typeof value !== "string") {
            fieldErrors.push({
              field,
              message: `${field} must be text or null.`,
            });
            continue;
          }

          const trimmed =
            typeof value === "string" ? value.trim() : null;

          const maxLength = 2000;

          if (trimmed !== null && trimmed.length > maxLength) {
            fieldErrors.push({
              field,
              message: `${field} must not exceed ${maxLength} characters.`,
            });
            continue;
          }

          data[field] =
            trimmed === "" ? null : trimmed;
        }

        if (Object.keys(data).length === 0) {
          fieldErrors.push({
            field: "body",
            message: "Provide at least one field to update.",
          });
        }

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
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Action Taken update is invalid.",
              fieldErrors,
            },
          });
        }

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
            where: { id: actionId },
            include: {
              performedBy: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
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
        console.error("Failed to update Action Taken:", error);

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