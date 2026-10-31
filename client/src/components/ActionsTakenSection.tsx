
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  ActionTaken,
  ActionTakenInput,
  ApiRequestError,
  createTicketActionTaken,
  getTicketActionsTaken,
  updateTicketActionTaken,
} from "../api.js";

interface ActionsTakenSectionProps {
  ticketId: string;
  editable: boolean;
}

interface ActionFormState {
  actionAt: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
}

function createIdempotencyKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function currentLocalDateTime() {
  const date = new Date();
  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 16);
}

function toLocalDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return currentLocalDateTime();
  }

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 16);
}

function emptyForm(): ActionFormState {
  return {
    actionAt: currentLocalDateTime(),
    description: "",
    result: "",
    followUpRequired: false,
    followUpNote: "",
    attachmentNotes: "",
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    return (
      error.fieldErrors[0]?.message ??
      error.message
    );
  }

  return error instanceof Error
    ? error.message
    : "Unable to process Action Taken.";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function ActionsTakenSection({
  ticketId,
  editable,
}: ActionsTakenSectionProps) {
  const [actions, setActions] =
    useState<ActionTaken[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [forbidden, setForbidden] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingAction, setEditingAction] =
    useState<ActionTaken | null>(null);

  const [form, setForm] =
    useState<ActionFormState>(emptyForm);

  // Keep the same key after a recoverable create failure.
  // A new key is generated only after a successful create.
  const [idempotencyKey, setIdempotencyKey] =
    useState(createIdempotencyKey);

  const loadActions = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setErrorMessage("");
        setForbidden(false);

        const result =
          await getTicketActionsTaken(ticketId);

        setActions(result);
      } catch (error) {
        if (
          error instanceof ApiRequestError &&
          error.status === 403
        ) {
          setForbidden(true);
        } else {
          setErrorMessage(
            getErrorMessage(error)
          );
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [ticketId]
  );

  useEffect(() => {
    void loadActions();

    return () => {
      setActions([]);
    };
  }, [loadActions]);

  function resetForm() {
    setForm(emptyForm());
    setEditingAction(null);
    setShowForm(false);
    setIdempotencyKey(
      createIdempotencyKey()
    );
  }

  function startCreate() {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingAction(null);
    setForm(emptyForm());
    setIdempotencyKey(
      createIdempotencyKey()
    );
    setShowForm(true);
  }

  function startEdit(action: ActionTaken) {
    setErrorMessage("");
    setSuccessMessage("");

    setEditingAction(action);

    setForm({
      actionAt: toLocalDateTime(
        action.actionAt
      ),
      description: action.description,
      result: action.result,
      followUpRequired:
        action.followUpRequired,
      followUpNote:
        action.followUpNote ?? "",
      attachmentNotes:
        action.attachmentNotes ?? "",
    });

    setShowForm(true);
  }

  function updateField<K extends keyof ActionFormState>(
    field: K,
    value: ActionFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!form.actionAt) {
      setErrorMessage(
        "Action Date/Time is required."
      );
      return;
    }

    if (!form.description.trim()) {
      setErrorMessage(
        "Action Description is required."
      );
      return;
    }

    if (!form.result.trim()) {
      setErrorMessage(
        "Result is required."
      );
      return;
    }

    if (
      form.followUpRequired &&
      !form.followUpNote.trim()
    ) {
      setErrorMessage(
        "Follow-up Note is required when Follow-up Required is selected."
      );
      return;
    }

    const actionDate = new Date(
      form.actionAt
    );

    if (Number.isNaN(actionDate.getTime())) {
      setErrorMessage(
        "Enter a valid Action Date/Time."
      );
      return;
    }

    const input: ActionTakenInput = {
      actionAt: actionDate.toISOString(),
      description: form.description.trim(),
      result: form.result.trim(),
      followUpRequired:
        form.followUpRequired,
      followUpNote:
        form.followUpRequired
          ? form.followUpNote.trim()
          : null,
      attachmentNotes:
        form.attachmentNotes.trim() || null,
    };

    try {
      setSaving(true);

      if (editingAction) {
        await updateTicketActionTaken(
          ticketId,
          editingAction.id,
          {
            ...input,
            expectedUpdatedAt:
              editingAction.updatedAt,
          }
        );

        resetForm();

        setSuccessMessage(
          "Action Taken updated successfully."
        );
      } else {
        await createTicketActionTaken(
          ticketId,
          input,
          idempotencyKey
        );

        resetForm();

        setSuccessMessage(
          "Action Taken recorded successfully."
        );
      }

      await loadActions(false);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.status === 403
      ) {
        setForbidden(true);
      } else {
        // Do not clear form fields or idempotency key
        // on a recoverable failure.
        setErrorMessage(
          getErrorMessage(error)
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="zen-section p-3 mb-4"
      aria-labelledby="actions-taken-title"
    >
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
        <div>
          <h3
            id="actions-taken-title"
            className="h5 mb-1"
          >
            Actions Taken
          </h3>

          <p className="small text-muted mb-0">
            Work records and follow-up information
          </p>
        </div>

        {editable && !forbidden && (
          <button
            type="button"
            className="btn btn-success"
            onClick={startCreate}
            disabled={saving}
          >
            Add Action Taken
          </button>
        )}
      </div>

      {errorMessage && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {forbidden && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          You are not allowed to view Actions Taken.
        </div>
      )}

      {editable && showForm && !forbidden && (
        <form
          className="border rounded p-3 mb-4"
          onSubmit={handleSubmit}
        >
          <h4 className="h6 mb-3">
            {editingAction
              ? "Edit Action Taken"
              : "New Action Taken"}
          </h4>

          <div className="mb-3">
            <label
              htmlFor="action-taken-date"
              className="form-label"
            >
              Action Date/Time
            </label>

            <input
              id="action-taken-date"
              type="datetime-local"
              className="form-control"
              value={form.actionAt}
              onChange={(event) =>
                updateField(
                  "actionAt",
                  event.target.value
                )
              }
              required
              disabled={saving}
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="action-taken-description"
              className="form-label"
            >
              Action Description
            </label>

            <textarea
              id="action-taken-description"
              className="form-control"
              rows={3}
              maxLength={4000}
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              required
              disabled={saving}
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="action-taken-result"
              className="form-label"
            >
              Result
            </label>

            <textarea
              id="action-taken-result"
              className="form-control"
              rows={3}
              maxLength={4000}
              value={form.result}
              onChange={(event) =>
                updateField(
                  "result",
                  event.target.value
                )
              }
              required
              disabled={saving}
            />
          </div>

          <div className="form-check mb-3">
            <input
              id="action-taken-follow-up"
              type="checkbox"
              className="form-check-input"
              checked={form.followUpRequired}
              onChange={(event) =>
                updateField(
                  "followUpRequired",
                  event.target.checked
                )
              }
              disabled={saving}
            />

            <label
              htmlFor="action-taken-follow-up"
              className="form-check-label"
            >
              Follow-Up Required
            </label>
          </div>

          {form.followUpRequired && (
            <div className="mb-3">
              <label
                htmlFor="action-taken-follow-up-note"
                className="form-label"
              >
                Follow-up Note{" "}
                <span className="text-danger">
                  *
                </span>
              </label>

              <textarea
                id="action-taken-follow-up-note"
                className="form-control"
                rows={2}
                maxLength={2000}
                value={form.followUpNote}
                onChange={(event) =>
                  updateField(
                    "followUpNote",
                    event.target.value
                  )
                }
                required
                aria-required="true"
                disabled={saving}
              />
            </div>
          )}

          <div className="mb-3">
            <label
              htmlFor="action-taken-attachment-notes"
              className="form-label"
            >
              Attachment Notes
            </label>

            <textarea
              id="action-taken-attachment-notes"
              className="form-control"
              rows={2}
              maxLength={2000}
              value={form.attachmentNotes}
              onChange={(event) =>
                updateField(
                  "attachmentNotes",
                  event.target.value
                )
              }
              disabled={saving}
            />

            <div className="form-text">
              Describe any relevant file or image.
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2">
            <button
              type="submit"
              className="btn btn-success"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingAction
                  ? "Save Changes"
                  : "Record Action"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={saving}
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          className="text-center py-4"
          role="status"
        >
          <span
            className="spinner-border spinner-border-sm text-success me-2"
            aria-hidden="true"
          />
          Loading Actions Taken...
        </div>
      ) : !forbidden && actions.length === 0 ? (
        <div className="text-center text-muted border rounded p-4">
          No Actions Taken have been recorded.
        </div>
      ) : (
        !forbidden && (
          <div className="d-flex flex-column gap-3">
            {actions.map((action) => (
              <article
                key={action.id}
                className="border rounded p-3"
              >
                <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mb-3">
                  <div>
                    <div className="fw-semibold">
                      {action.performedBy.displayName}
                    </div>

                    <div className="small text-muted">
                      {formatDateTime(action.actionAt)}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 align-items-start">
                    {action.followUpRequired ? (
                      <span className="badge text-bg-warning">
                        Follow-up Required
                      </span>
                    ) : (
                      <span className="badge text-bg-success">
                        No Follow-up
                      </span>
                    )}

                    {editable && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        disabled={saving}
                        onClick={() =>
                          startEdit(action)
                        }
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="small fw-semibold text-muted">
                    Action Description
                  </div>

                  <p className="mb-0 text-break">
                    {action.description}
                  </p>
                </div>

                <div className="mb-2">
                  <div className="small fw-semibold text-muted">
                    Result
                  </div>

                  <p className="mb-0 text-break">
                    {action.result}
                  </p>
                </div>

                {action.followUpRequired && (
                  <div className="mb-2">
                    <div className="small fw-semibold text-muted">
                      Follow-up Note
                    </div>

                    <p className="mb-0 text-break">
                      {action.followUpNote}
                    </p>
                  </div>
                )}

                {action.attachmentNotes && (
                  <div>
                    <div className="small fw-semibold text-muted">
                      Attachment Notes
                    </div>

                    <p className="mb-0 text-break">
                      {action.attachmentNotes}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      )}
    </section>
  );
}
