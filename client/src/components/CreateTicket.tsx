import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Category,
  CreatedTicket,
  DevelopmentRequester,
  RelatedSystem,
  RequestedPriority,
  createTicket,
  getActiveCategories,
  getRelatedSystems,
  uploadTicketAttachment,
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

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
];

const MAX_ATTACHMENT_SIZE =
  5 * 1024 * 1024;

const MAX_ATTACHMENTS = 5;

export default function CreateTicket({
  requester,
}: CreateTicketProps) {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    relatedSystems,
    setRelatedSystems,
  ] = useState<RelatedSystem[]>([]);

  const [categoryId, setCategoryId] =
    useState("");

  const [
    relatedSystemId,
    setRelatedSystemId,
  ] = useState("");

  const [summary, setSummary] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    requestedPriority,
    setRequestedPriority,
  ] = useState<
    RequestedPriority | ""
  >("");

  const [
    clientRequestId,
    setClientRequestId,
  ] = useState(
    () => crypto.randomUUID()
  );

  const [
    errors,
    setErrors,
  ] = useState<FormErrors>({});

  const [
    loadingReferenceData,
    setLoadingReferenceData,
  ] = useState(true);

  const [
    referenceError,
    setReferenceError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const [
    createdTicket,
    setCreatedTicket,
  ] =
    useState<CreatedTicket | null>(
      null
    );

  const [
    selectedAttachments,
    setSelectedAttachments,
  ] = useState<File[]>([]);

  const [
    attachmentSelectionError,
    setAttachmentSelectionError,
  ] = useState("");

  const [
    uploadingAttachments,
    setUploadingAttachments,
  ] = useState(false);

  const [
    attachmentUploadMessage,
    setAttachmentUploadMessage,
  ] = useState("");

  const [
    failedAttachmentNames,
    setFailedAttachmentNames,
  ] = useState<string[]>([]);

  const [
    attachmentInputKey,
    setAttachmentInputKey,
  ] = useState(0);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoadingReferenceData(
          true
        );

        setReferenceError("");

        const [
          categoryData,
          relatedSystemData,
        ] = await Promise.all([
          getActiveCategories(),
          getRelatedSystems(),
        ]);

        setCategories(
          categoryData
        );

        setRelatedSystems(
          relatedSystemData
        );
      } catch {
        setReferenceError(
          "Unable to load Ticket reference data. Please try again."
        );
      } finally {
        setLoadingReferenceData(
          false
        );
      }
    }

    loadReferenceData();
  }, []);

  function validateForm(): boolean {
    const nextErrors: FormErrors =
      {};

    const trimmedSummary =
      summary.trim();

    const trimmedDescription =
      description.trim();

    if (!categoryId) {
      nextErrors.categoryId =
        "Category is required.";
    }

    if (!relatedSystemId) {
      nextErrors.relatedSystemId =
        "Related System is required.";
    }

    if (!requestedPriority) {
      nextErrors.requestedPriority =
        "Requested Priority is required.";
    }

    if (
      trimmedSummary.length < 5 ||
      trimmedSummary.length > 120
    ) {
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

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  }

  function isValidAttachment(
    file: File
  ): boolean {
    const filename =
      file.name.toLowerCase();

    const validExtension =
      ALLOWED_ATTACHMENT_EXTENSIONS.some(
        (extension) =>
          filename.endsWith(
            extension
          )
      );

    const validMimeType =
      ALLOWED_ATTACHMENT_MIME_TYPES.has(
        file.type
      );

    return (
      validExtension &&
      validMimeType
    );
  }

  function handleAttachmentChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setAttachmentSelectionError(
      ""
    );

    setAttachmentUploadMessage(
      ""
    );

    const files = Array.from(
      event.target.files ?? []
    );

    if (files.length === 0) {
      setSelectedAttachments(
        []
      );

      return;
    }

    if (
      files.length >
      MAX_ATTACHMENTS
    ) {
      setSelectedAttachments(
        []
      );

      setAttachmentSelectionError(
        "A maximum of 5 Attachments may be selected."
      );

      return;
    }

    const invalidTypeFile =
      files.find(
        (file) =>
          !isValidAttachment(file)
      );

    if (invalidTypeFile) {
      setSelectedAttachments(
        []
      );

      setAttachmentSelectionError(
        `Invalid Attachment "${invalidTypeFile.name}". Only JPG, JPEG, PNG, WEBP, and PDF Attachments are allowed.`
      );

      return;
    }

    const oversizedFile =
      files.find(
        (file) =>
          file.size >
          MAX_ATTACHMENT_SIZE
      );

    if (oversizedFile) {
      setSelectedAttachments(
        []
      );

      setAttachmentSelectionError(
        `Attachment "${oversizedFile.name}" must not exceed 5 MB.`
      );

      return;
    }

    setSelectedAttachments(
      files
    );
  }

  function removeSelectedAttachment(
    indexToRemove: number
  ) {
    setSelectedAttachments(
      (current) =>
        current.filter(
          (_file, index) =>
            index !== indexToRemove
        )
    );

    setAttachmentSelectionError(
      ""
    );
  }

  async function uploadSelectedAttachments(
    ticket: CreatedTicket
  ) {
    if (
      selectedAttachments.length ===
      0
    ) {
      return;
    }

    setUploadingAttachments(
      true
    );

    setAttachmentUploadMessage(
      ""
    );

    setFailedAttachmentNames(
      []
    );

    const failedFiles: string[] =
      [];

    for (
      const file of
      selectedAttachments
    ) {
      try {
        await uploadTicketAttachment(
          requester.id,
          ticket.id,
          file
        );
      } catch {
        failedFiles.push(
          file.name
        );
      }
    }

    if (
      failedFiles.length === 0
    ) {
      setAttachmentUploadMessage(
        selectedAttachments.length ===
          1
          ? "Attachment uploaded successfully."
          : "Attachments uploaded successfully."
      );

      setSelectedAttachments(
        []
      );

      setAttachmentInputKey(
        (current) =>
          current + 1
      );
    } else {
      setFailedAttachmentNames(
        failedFiles
      );

      setAttachmentUploadMessage(
        "The Ticket was created successfully, but one or more Attachments failed to upload. The Ticket remains created. You can retry the failed Attachment from Ticket Detail."
      );
    }

    setUploadingAttachments(
      false
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitError("");
    setCreatedTicket(null);

    setAttachmentUploadMessage(
      ""
    );

    setFailedAttachmentNames(
      []
    );

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const ticket =
        await createTicket(
          requester.id,
          {
            categoryId:
              Number(categoryId),

            relatedSystemId,

            summary:
              summary.trim(),

            description:
              description.trim(),

            requestedPriority:
              requestedPriority as RequestedPriority,

            clientRequestId,
          }
        );

      setCreatedTicket(ticket);

      setClientRequestId(
        crypto.randomUUID()
      );

      await uploadSelectedAttachments(
        ticket
      );
    } catch {
      setSubmitError(
        "Unable to create Ticket. Your entered information has been kept. Please try again."
      );
    } finally {
      setSubmitting(false);

      setUploadingAttachments(
        false
      );
    }
  }

  function formatFileSize(
    size: number
  ) {
    if (
      size >=
      1024 * 1024
    ) {
      return `${(
        size /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  const busy =
    submitting ||
    uploadingAttachments;

  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
          <div>
            <h2 className="h4 mb-1">
              Create Ticket
            </h2>

            <p className="text-muted mb-0">
              Submit a new IT support
              request.
            </p>
          </div>

          <span className="badge bg-success-subtle text-success border border-success px-3 py-2">
  Current Requester · {requester.displayName}
</span>
        </div>

        {referenceError && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {referenceError}
          </div>
        )}

        {createdTicket && (
          <div
            className="alert alert-success"
            role="status"
          >
            <div className="fw-bold">
              Ticket created successfully.
            </div>

            <div className="mt-2">
              Ticket Number:{" "}
              <strong>
                {
                  createdTicket.ticketNo
                }
              </strong>
            </div>

            <div className="small mt-1">
              Your Ticket is now
              available from My Tickets.
            </div>
          </div>
        )}

        {submitError && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {submitError}
          </div>
        )}

        {attachmentUploadMessage &&
          failedAttachmentNames.length ===
            0 && (
            <div
              className="alert alert-success"
              role="status"
            >
              {
                attachmentUploadMessage
              }
            </div>
          )}

        {failedAttachmentNames.length >
          0 && (
          <div
            className="alert alert-warning"
            role="alert"
          >
            <div className="fw-semibold mb-2">
              Attachment upload
              incomplete
            </div>

            <div>
              {
                attachmentUploadMessage
              }
            </div>

            <div className="mt-2 fw-semibold">
              Failed:
            </div>

            <ul className="mb-0">
              {failedAttachmentNames.map(
                (filename) => (
                  <li key={filename}>
                    {filename}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <section className="zen-section p-3 p-md-4 mb-4">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <h3 className="h6 mb-0">
                Request Information
              </h3>

              <span className="badge bg-light text-dark border">
                Read-only
              </span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="ticketNumber"
                >
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
                <label
                  className="form-label"
                  htmlFor="ticketDate"
                >
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
                <label
                  className="form-label"
                  htmlFor="requester"
                >
                  Requester
                </label>

                <input
                  id="requester"
                  className="form-control"
                  value={
                    requester.displayName
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="status"
                >
                  Current Status
                </label>

                <input
                  id="status"
                  className="form-control"
                  value="New"
                  readOnly
                />
              </div>
            </div>
          </section>

          <section className="zen-section p-3 p-md-4 mb-4">
            <div className="mb-3">
              <h3 className="h6 mb-1">
                Ticket Details
              </h3>

              <p className="text-muted small mb-0">
                Fields marked with{" "}
                <span className="text-danger">
                  *
                </span>{" "}
                are required.
              </p>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="category"
                >
                  Category{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <select
                  id="category"
                  className={`form-select ${
                    errors.categoryId
                      ? "is-invalid"
                      : ""
                  }`}
                  value={categoryId}
                  disabled={
                    loadingReferenceData ||
                    busy ||
                    Boolean(
                      createdTicket
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select a Category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>

                {errors.categoryId && (
                  <div className="invalid-feedback">
                    {
                      errors.categoryId
                    }
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="relatedSystem"
                >
                  Related System{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <select
                  id="relatedSystem"
                  className={`form-select ${
                    errors.relatedSystemId
                      ? "is-invalid"
                      : ""
                  }`}
                  value={
                    relatedSystemId
                  }
                  disabled={
                    loadingReferenceData ||
                    busy ||
                    Boolean(
                      createdTicket
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    setRelatedSystemId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select a Related
                    System
                  </option>

                  {relatedSystems.map(
                    (system) => (
                      <option
                        key={
                          system.id
                        }
                        value={
                          system.id
                        }
                      >
                        {
                          system.name
                        }
                      </option>
                    )
                  )}
                </select>

                {errors.relatedSystemId && (
                  <div className="invalid-feedback">
                    {
                      errors.relatedSystemId
                    }
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label
                  className="form-label"
                  htmlFor="requestedPriority"
                >
                  Requested Priority{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <select
                  id="requestedPriority"
                  className={`form-select ${
                    errors.requestedPriority
                      ? "is-invalid"
                      : ""
                  }`}
                  value={
                    requestedPriority
                  }
                  disabled={
                    busy ||
                    Boolean(
                      createdTicket
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    setRequestedPriority(
                      event.target
                        .value as
                        | RequestedPriority
                        | ""
                    )
                  }
                >
                  <option value="">
                    Select Priority
                  </option>

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Urgent">
                    Urgent
                  </option>
                </select>

                {errors.requestedPriority && (
                  <div className="invalid-feedback">
                    {
                      errors.requestedPriority
                    }
                  </div>
                )}
              </div>

              <div className="col-12">
                <label
                  className="form-label"
                  htmlFor="summary"
                >
                  Ticket Summary{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <input
                  id="summary"
                  className={`form-control ${
                    errors.summary
                      ? "is-invalid"
                      : ""
                  }`}
                  value={summary}
                  maxLength={120}
                  placeholder="Briefly describe the issue"
                  disabled={
                    busy ||
                    Boolean(
                      createdTicket
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    setSummary(
                      event.target.value
                    )
                  }
                />

                {errors.summary && (
                  <div className="invalid-feedback">
                    {
                      errors.summary
                    }
                  </div>
                )}

                <div className="form-text text-end">
                  {summary.length}/120
                  characters
                </div>
              </div>

              <div className="col-12">
                <label
                  className="form-label"
                  htmlFor="description"
                >
                  Description{" "}
                  <span className="text-danger">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  className={`form-control ${
                    errors.description
                      ? "is-invalid"
                      : ""
                  }`}
                  rows={6}
                  value={
                    description
                  }
                  maxLength={2000}
                  placeholder="Describe the problem, what happened, and any useful details."
                  disabled={
                    busy ||
                    Boolean(
                      createdTicket
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target.value
                    )
                  }
                />

                {errors.description && (
                  <div className="invalid-feedback">
                    {
                      errors.description
                    }
                  </div>
                )}

                <div className="form-text text-end">
                  {
                    description.length
                  }
                  /2000 characters
                </div>
              </div>
            </div>
          </section>

          <section className="zen-section p-3 p-md-4">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
              <div>
                <h3 className="h6 mb-1">
                  Attachments
                </h3>

                <p className="text-muted small mb-0">
                  Optional supporting
                  evidence.
                </p>
              </div>

              <span className="badge bg-success-subtle text-success border border-success">
                {
                  selectedAttachments.length
                }{" "}
                / 5 Selected
              </span>
            </div>

            <input
              key={
                attachmentInputKey
              }
              id="ticketAttachments"
              type="file"
              className={`form-control ${
                attachmentSelectionError
                  ? "is-invalid"
                  : ""
              }`}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              multiple
              disabled={
                busy ||
                Boolean(
                  createdTicket
                )
              }
              onChange={
                handleAttachmentChange
              }
            />

            <div className="form-text">
              Optional. JPG, JPEG,
              PNG, WEBP, or PDF.
              Maximum 5 MB per file
              and up to 5
              Attachments.
            </div>

            {attachmentSelectionError && (
              <div className="invalid-feedback d-block">
                {
                  attachmentSelectionError
                }
              </div>
            )}

            {selectedAttachments.length >
              0 && (
              <div className="mt-3">
                <div className="fw-semibold mb-2">
                  Selected
                  Attachments
                </div>

                <div className="list-group">
                  {selectedAttachments.map(
                    (
                      file,
                      index
                    ) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3"
                      >
                        <div>
                          <div className="fw-semibold">
                            {
                              file.name
                            }
                          </div>

                          <small className="text-muted">
                            {formatFileSize(
                              file.size
                            )}
                          </small>
                        </div>

                        {!createdTicket && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            aria-label={`Remove selected ${file.name}`}
                            disabled={
                              busy
                            }
                            onClick={() =>
                              removeSelectedAttachment(
                                index
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {uploadingAttachments && (
              <div
                className="alert alert-light border mt-3 mb-0"
                role="status"
              >
                <span
                  className="spinner-border spinner-border-sm text-success me-2"
                  aria-hidden="true"
                />

                Uploading
                Attachments...
              </div>
            )}
          </section>

          {loadingReferenceData && (
            <div
              className="alert alert-light border mt-4 mb-0"
              role="status"
            >
              <span
                className="spinner-border spinner-border-sm text-success me-2"
                aria-hidden="true"
              />

              Loading Ticket
              reference data...
            </div>
          )}

          <div className="d-flex flex-column flex-sm-row justify-content-end mt-4">
            <button
              type="submit"
              className="btn btn-success px-4"
              disabled={
                busy ||
                loadingReferenceData ||
                Boolean(
                  referenceError
                ) ||
                Boolean(
                  createdTicket
                )
              }
            >
              {submitting
                ? "Submitting..."
                : uploadingAttachments
                  ? "Uploading Attachments..."
                  : createdTicket
                    ? "Ticket Created"
                    : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}