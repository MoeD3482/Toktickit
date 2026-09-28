import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  addPublicComment,
  addStaffAction,
  addStaffInternalNote,
  ApiRequestError,
  claimStaffTicket,
  downloadStaffTicketAttachment,
  getStaffAssignees,
  getStaffTicketDetail,
  ITPriority,
  StaffAssignee,
  StaffTicketDetail as StaffTicket,
  TicketStatus,
  updateStaffAssignment,
  updateStaffITPriority,
  updateStaffStatus,
} from "../api.js";

interface StaffTicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

const priorities: ITPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

const transitions: Record<TicketStatus, TicketStatus[]> = {
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

function statusLabel(status: TicketStatus) {
  return status
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function dateTime(value: string) {
  return new Date(value).toLocaleString();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return error.fieldErrors[0]?.message ?? error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function StaffTicketDetail({
  ticketId,
  onBack,
}: StaffTicketDetailProps) {
  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [assigneeId, setAssigneeId] = useState("");
  const [itPriority, setITPriority] = useState<ITPriority>("Medium");
  const [nextStatus, setNextStatus] = useState<TicketStatus | "">("");
  const [statusReason, setStatusReason] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [actionBody, setActionBody] = useState("");

  async function loadTicket(syncControls = false) {
    try {
      setLoading(true);
      setErrorMessage("");
      setForbidden(false);

      const [nextTicket, nextAssignees] = await Promise.all([
        getStaffTicketDetail(ticketId),
        getStaffAssignees(),
      ]);

      setTicket(nextTicket);
      setAssignees(nextAssignees);
      if (syncControls) {
        setAssigneeId(nextTicket.assignedTo?.id ?? "");
        setITPriority(nextTicket.itPriority ?? "Medium");
        setNextStatus("");
        setStatusReason("");
      }
    } catch (error) {
      setTicket(null);

      if (
        error instanceof ApiRequestError &&
        error.status === 403
      ) {
        setForbidden(true);
      } else {
        setErrorMessage(
          getErrorMessage(error, "Unable to load Ticket detail.")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTicket(true);
  }, [ticketId]);

  async function save(
    operation: string,
    success: string,
    callback: () => Promise<void>
  ) {
    try {
      setSaving(operation);
      setErrorMessage("");
      setSuccessMessage("");
      await callback();
      setSuccessMessage(success);
      await loadTicket();
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.status === 403
      ) {
        setForbidden(true);
      } else {
        setErrorMessage(getErrorMessage(error, "Unable to save changes."));
      }
    } finally {
      setSaving("");
    }
  }

  function handleAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!assigneeId) {
      setErrorMessage("Select an active IT Staff user.");
      return;
    }

    void save("assignment", "Assignment saved.", async () => {
      const updated = await updateStaffAssignment(ticketId, assigneeId);
      setAssigneeId(updated.assignedTo?.id ?? "");
    });
  }

  function handlePriority(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("priority", "IT Priority saved.", async () => {
      await updateStaffITPriority(ticketId, itPriority);
    });
  }

  function handleStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nextStatus) {
      setErrorMessage("Choose a permitted next status.");
      return;
    }

    void save("status", "Status updated.", async () => {
      await updateStaffStatus(ticketId, nextStatus, statusReason);
      setNextStatus("");
      setStatusReason("");
    });
  }

  function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("comment", "Public comment added.", async () => {
      await addPublicComment(ticketId, commentBody);
      setCommentBody("");
    });
  }

  function handleNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("note", "Internal note added.", async () => {
      await addStaffInternalNote(ticketId, noteBody);
      setNoteBody("");
    });
  }

  function handleAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("action", "Action recorded.", async () => {
      await addStaffAction(ticketId, actionBody);
      setActionBody("");
    });
  }

  async function handleClaim() {
    await save("claim", "Ticket claimed.", async () => {
      const claimed = await claimStaffTicket(ticketId);
      setAssigneeId(claimed.assignedTo?.id ?? "");
    });
  }

  async function handleDownload(
    attachmentId: string,
    filename: string
  ) {
    try {
      setSaving(`download-${attachmentId}`);
      setErrorMessage("");

      const blob = await downloadStaffTicketAttachment(
        ticketId,
        attachmentId
      );
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Unable to download Attachment.")
      );
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return (
      <div className="alert alert-light border text-center py-4" role="status">
        <span
          className="spinner-border spinner-border-sm text-success me-2"
          aria-hidden="true"
        />
        Loading Ticket detail...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="alert alert-danger" role="alert">
        You are not allowed to manage this Ticket.
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="alert alert-danger" role="alert">
        {errorMessage || "Ticket could not be found."}
      </div>
    );
  }

  const permittedStatuses = transitions[ticket.status];

  return (
    <section aria-labelledby="staff-ticket-title">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <button
            type="button"
            className="btn btn-link p-0 mb-2 text-decoration-none"
            onClick={onBack}
          >
            Back to Staff Queue
          </button>
          <h2 id="staff-ticket-title" className="h4 mb-1">
            {ticket.ticketNo}
          </h2>
          <p className="text-muted mb-0">{ticket.summary}</p>
        </div>
        <span className="badge bg-success-subtle text-success-emphasis align-self-md-start">
          {statusLabel(ticket.status)}
        </span>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" role="status">
          {successMessage}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <section className="zen-section p-3 mb-4" aria-labelledby="requester-fields-title">
            <h3 id="requester-fields-title" className="h5 mb-3">
              Requester Information
            </h3>
            <dl className="row mb-0">
              <dt className="col-sm-4">Requester</dt>
              <dd className="col-sm-8">
                {ticket.requester.displayName}
                <div className="text-muted small text-break">
                  {ticket.requester.email}
                </div>
              </dd>
              <dt className="col-sm-4">Category</dt>
              <dd className="col-sm-8">{ticket.category.name}</dd>
              <dt className="col-sm-4">Related System</dt>
              <dd className="col-sm-8">{ticket.relatedSystem.name}</dd>
              <dt className="col-sm-4">Requested Priority</dt>
              <dd className="col-sm-8">{ticket.requestedPriority}</dd>
              <dt className="col-sm-4">Description</dt>
              <dd className="col-sm-8 text-break">{ticket.description}</dd>
              <dt className="col-sm-4">Created</dt>
              <dd className="col-sm-8 mb-0">{dateTime(ticket.createdAt)}</dd>
            </dl>
          </section>

          <section className="zen-section p-3 mb-4" aria-labelledby="comments-title">
            <h3 id="comments-title" className="h5 mb-3">Public Comments</h3>
            {ticket.comments.length === 0 ? (
              <p className="text-muted">No public comments yet.</p>
            ) : (
              <div className="list-group list-group-flush mb-3">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{comment.author.displayName}</strong>
                      <span className="small text-muted">{dateTime(comment.createdAt)}</span>
                    </div>
                    <div className="text-break mt-1">{comment.body}</div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleComment}>
              <label htmlFor="public-comment" className="form-label">
                Add public comment
              </label>
              <textarea
                id="public-comment"
                className="form-control mb-2"
                rows={3}
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                maxLength={2000}
                required
              />
              <button type="submit" className="btn btn-success" disabled={saving !== ""}>
                {saving === "comment" ? "Saving..." : "Add Comment"}
              </button>
            </form>
          </section>

          <section className="zen-section p-3 mb-4" aria-labelledby="attachments-title">
            <h3 id="attachments-title" className="h5 mb-3">Attachments</h3>
            {ticket.attachments.length === 0 ? (
              <p className="text-muted mb-0">No active Attachments.</p>
            ) : (
              <div className="list-group list-group-flush">
                {ticket.attachments.map((attachment) => (
                  <div key={attachment.id} className="list-group-item px-0 d-flex flex-column flex-sm-row justify-content-between gap-2">
                    <div className="text-break">
                      <strong>{attachment.originalFilename}</strong>
                      <div className="small text-muted">
                        {attachment.mimeType} · {Math.ceil(attachment.sizeBytes / 1024)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-success align-self-sm-center"
                      disabled={saving !== ""}
                      onClick={() => void handleDownload(attachment.id, attachment.originalFilename)}
                    >
                      {saving === `download-${attachment.id}` ? "Downloading..." : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-lg-5">
          <section className="zen-section p-3 mb-4 border-success" aria-labelledby="staff-controls-title">
            <h3 id="staff-controls-title" className="h5 mb-3">Staff Controls</h3>

            <form onSubmit={handleAssignment} className="mb-4 pb-4 border-bottom">
              <label htmlFor="staff-detail-assignee" className="form-label">Assignment</label>
              <select
                id="staff-detail-assignee"
                className="form-select mb-2"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
              >
                <option value="">Select IT Staff</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>{assignee.displayName}</option>
                ))}
              </select>
              {!ticket.assignedTo && (
                <button type="button" className="btn btn-outline-success me-2" disabled={saving !== ""} onClick={() => void handleClaim()}>
                  {saving === "claim" ? "Claiming..." : "Claim Ticket"}
                </button>
              )}
              <button type="submit" className="btn btn-success" disabled={saving !== ""}>
                {saving === "assignment" ? "Saving..." : "Save Assignment"}
              </button>
            </form>

            <form onSubmit={handlePriority} className="mb-4 pb-4 border-bottom">
              <label htmlFor="staff-detail-priority" className="form-label">IT Priority</label>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <select
                  id="staff-detail-priority"
                  className="form-select"
                  value={itPriority}
                  onChange={(event) => setITPriority(event.target.value as ITPriority)}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-success text-nowrap" disabled={saving !== ""}>
                  {saving === "priority" ? "Saving..." : "Save"}
                </button>
              </div>
            </form>

            <form onSubmit={handleStatus}>
              <label htmlFor="staff-detail-status" className="form-label">Next Status</label>
              <select
                id="staff-detail-status"
                className="form-select mb-2"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as TicketStatus | "")}
                disabled={permittedStatuses.length === 0}
              >
                <option value="">{permittedStatuses.length === 0 ? "No permitted transition" : "Choose next status"}</option>
                {permittedStatuses.map((item) => (
                  <option key={item} value={item}>{statusLabel(item)}</option>
                ))}
              </select>
              <label htmlFor="staff-detail-reason" className="form-label">Transition note</label>
              <textarea
                id="staff-detail-reason"
                className="form-control mb-2"
                rows={2}
                maxLength={500}
                value={statusReason}
                onChange={(event) => setStatusReason(event.target.value)}
                disabled={permittedStatuses.length === 0}
              />
              <button type="submit" className="btn btn-success" disabled={saving !== "" || permittedStatuses.length === 0}>
                {saving === "status" ? "Saving..." : "Update Status"}
              </button>
            </form>
          </section>

          <section className="zen-section p-3 mb-4" aria-labelledby="internal-notes-title">
            <h3 id="internal-notes-title" className="h5 mb-1">Internal Notes</h3>
            <p className="small text-muted">Visible to IT Staff only. Requesters cannot see these notes.</p>
            {ticket.internalNotes.length === 0 ? (
              <p className="text-muted">No internal notes yet.</p>
            ) : (
              <div className="list-group list-group-flush mb-3">
                {ticket.internalNotes.map((note) => (
                  <div key={note.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{note.author.displayName}</strong>
                      <span className="small text-muted">{dateTime(note.createdAt)}</span>
                    </div>
                    <div className="text-break mt-1">{note.body}</div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleNote}>
              <label htmlFor="internal-note" className="form-label">Add internal note</label>
              <textarea id="internal-note" className="form-control mb-2" rows={3} maxLength={2000} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} required />
              <button type="submit" className="btn btn-success" disabled={saving !== ""}>
                {saving === "note" ? "Saving..." : "Add Internal Note"}
              </button>
            </form>
          </section>

          <section className="zen-section p-3" aria-labelledby="actions-title">
            <h3 id="actions-title" className="h5 mb-3">Actions and History</h3>
            {ticket.actions.length === 0 ? (
              <p className="text-muted">No actions recorded yet.</p>
            ) : (
              <div className="list-group list-group-flush mb-3">
                {ticket.actions.map((action) => (
                  <div key={action.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{action.actionType.replace(/([A-Z])/g, " $1").trim()}</strong>
                      <span className="small text-muted">{dateTime(action.createdAt)}</span>
                    </div>
                    <div className="small text-muted">{action.actor.displayName}</div>
                    <div className="text-break mt-1">{action.body}</div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAction}>
              <label htmlFor="action-taken" className="form-label">Record action taken</label>
              <textarea id="action-taken" className="form-control mb-2" rows={3} maxLength={2000} value={actionBody} onChange={(event) => setActionBody(event.target.value)} required />
              <button type="submit" className="btn btn-success" disabled={saving !== ""}>
                {saving === "action" ? "Saving..." : "Record Action"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </section>
  );
}
