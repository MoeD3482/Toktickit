import { FormEvent, useEffect, useState } from "react";
import {
  Category,
  CreatedTicket,
  DevelopmentRequester,
  RelatedSystem,
  RequestedPriority,
  createTicket,
  getActiveCategories,
  getRelatedSystems,
} from "../api.js";

interface CreateTicketProps {
  requester: DevelopmentRequester;
}

interface FormErrors {
  categoryId?: string;
  relatedSystemId?: string;
  summary?: string;
  description?: string;
  requestedPriority?: string;
}

export default function CreateTicket({
  requester,
}: CreateTicketProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [requestedPriority, setRequestedPriority] = useState<
    RequestedPriority | ""
  >("");

  const [clientRequestId, setClientRequestId] = useState(
    () => crypto.randomUUID()
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [referenceError, setReferenceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdTicket, setCreatedTicket] =
    useState<CreatedTicket | null>(null);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoadingReferenceData(true);
        setReferenceError("");

        const [categoryData, relatedSystemData] = await Promise.all([
          getActiveCategories(),
          getRelatedSystems(),
        ]);

        setCategories(categoryData);
        setRelatedSystems(relatedSystemData);
      } catch {
        setReferenceError(
          "Unable to load Ticket reference data. Please try again."
        );
      } finally {
        setLoadingReferenceData(false);
      }
    }

    loadReferenceData();
  }, []);

  function validateForm(): boolean {
    const nextErrors: FormErrors = {};

    const trimmedSummary = summary.trim();
    const trimmedDescription = description.trim();

    if (!categoryId) {
      nextErrors.categoryId = "Category is required.";
    }

    if (!relatedSystemId) {
      nextErrors.relatedSystemId = "Related System is required.";
    }

    if (!requestedPriority) {
      nextErrors.requestedPriority = "Requested Priority is required.";
    }

    if (trimmedSummary.length < 5 || trimmedSummary.length > 120) {
      nextErrors.summary =
        "Summary must contain between 5 and 120 characters.";
    }

    if (
      trimmedDescription.length < 10 ||
      trimmedDescription.length > 2000
    ) {
      nextErrors.description =
        "Description must contain between 10 and 2000 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError("");
    setCreatedTicket(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const ticket = await createTicket(requester.id, {
        categoryId: Number(categoryId),
        relatedSystemId,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: requestedPriority as RequestedPriority,
        clientRequestId,
      });

      setCreatedTicket(ticket);

      // Only generate a new request ID after successful creation.
      setClientRequestId(crypto.randomUUID());
    } catch {
      setSubmitError(
        "Unable to create Ticket. Your entered information has been kept. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <h2 className="h4 mb-4">Create Ticket</h2>

        {referenceError && (
          <div className="alert alert-danger">
            {referenceError}
          </div>
        )}

        {createdTicket && (
          <div className="alert alert-success">
            <strong>Ticket created successfully.</strong>
            <div className="mt-2">
              Ticket Number:{" "}
              <strong>{createdTicket.ticketNo}</strong>
            </div>
          </div>
        )}

        {submitError && (
          <div className="alert alert-danger">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="ticketNumber">
                Ticket Number
              </label>

              <input
                id="ticketNumber"
                className="form-control"
                value={
                  createdTicket?.ticketNo ??
                  "Generated after submission"
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="ticketDate">
                Ticket Date
              </label>

              <input
                id="ticketDate"
                className="form-control"
                value={
                  createdTicket
                    ? new Date(
                        createdTicket.createdAt
                      ).toLocaleString()
                    : "Generated after submission"
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="requester">
                Requester
              </label>

              <input
                id="requester"
                className="form-control"
                value={requester.displayName}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="status">
                Current Status
              </label>

              <input
                id="status"
                className="form-control"
                value="New"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="category">
                Category <span className="text-danger">*</span>
              </label>

              <select
                id="category"
                className={`form-select ${
                  errors.categoryId ? "is-invalid" : ""
                }`}
                value={categoryId}
                disabled={loadingReferenceData || submitting}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
              >
                <option value="">Select a Category</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {errors.categoryId && (
                <div className="invalid-feedback">
                  {errors.categoryId}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="relatedSystem"
              >
                Related System{" "}
                <span className="text-danger">*</span>
              </label>

              <select
                id="relatedSystem"
                className={`form-select ${
                  errors.relatedSystemId ? "is-invalid" : ""
                }`}
                value={relatedSystemId}
                disabled={loadingReferenceData || submitting}
                onChange={(event) =>
                  setRelatedSystemId(event.target.value)
                }
              >
                <option value="">Select a Related System</option>

                {relatedSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>

              {errors.relatedSystemId && (
                <div className="invalid-feedback">
                  {errors.relatedSystemId}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="requestedPriority"
              >
                Requested Priority{" "}
                <span className="text-danger">*</span>
              </label>

              <select
                id="requestedPriority"
                className={`form-select ${
                  errors.requestedPriority ? "is-invalid" : ""
                }`}
                value={requestedPriority}
                disabled={submitting}
                onChange={(event) =>
                  setRequestedPriority(
                    event.target.value as RequestedPriority | ""
                  )
                }
              >
                <option value="">Select Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>

              {errors.requestedPriority && (
                <div className="invalid-feedback">
                  {errors.requestedPriority}
                </div>
              )}
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="summary">
                Ticket Summary{" "}
                <span className="text-danger">*</span>
              </label>

              <input
                id="summary"
                className={`form-control ${
                  errors.summary ? "is-invalid" : ""
                }`}
                value={summary}
                maxLength={120}
                disabled={submitting}
                onChange={(event) =>
                  setSummary(event.target.value)
                }
              />

              {errors.summary && (
                <div className="invalid-feedback">
                  {errors.summary}
                </div>
              )}

              <div className="form-text">
                {summary.length}/120 characters
              </div>
            </div>

            <div className="col-12">
              <label
                className="form-label"
                htmlFor="description"
              >
                Description{" "}
                <span className="text-danger">*</span>
              </label>

              <textarea
                id="description"
                className={`form-control ${
                  errors.description ? "is-invalid" : ""
                }`}
                rows={6}
                value={description}
                maxLength={2000}
                disabled={submitting}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
              />

              {errors.description && (
                <div className="invalid-feedback">
                  {errors.description}
                </div>
              )}

              <div className="form-text">
                {description.length}/2000 characters
              </div>
            </div>

            <div className="col-12">
              <div className="border rounded p-3 bg-light">
                <strong>Attachments</strong>
                <p className="mb-0 mt-1 text-muted">
                  Attachment upload will be implemented in the
                  Attachment Lifecycle feature.
                </p>
              </div>
            </div>
          </div>

          {loadingReferenceData && (
            <p className="mt-3 mb-0">
              Loading Ticket reference data...
            </p>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button
              type="submit"
              className="btn btn-success"
              disabled={
                submitting ||
                loadingReferenceData ||
                Boolean(referenceError)
              }
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}