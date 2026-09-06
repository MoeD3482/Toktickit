import {
  useState,
  type ChangeEvent,
} from "react";

type Attachment = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  isRemoved: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
};

type FailedAttachment = {
  filename: string;
  message: string;
};

type AttachmentSectionProps = {
  requesterId: string;
  ticketId: string;

  attachments?: Attachment[];

  failedAttachment?: FailedAttachment;

  onUpload?: (
    file: File
  ) => void | Promise<void>;

  onDownload?: (
    attachmentId: string,
    filename: string
  ) => void | Promise<void>;

  onRemove?: (
    attachmentId: string,
    reason: string
  ) => void | Promise<void>;

  onRetryUpload?: () => void | Promise<void>;

  uploading?: boolean;
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
];

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

export default function AttachmentSection({
  requesterId,
  ticketId,
  attachments = [],
  failedAttachment,
  onUpload,
  onDownload,
  onRemove,
  onRetryUpload,
  uploading = false,
}: AttachmentSectionProps) {
  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    removingAttachmentId,
    setRemovingAttachmentId,
  ] = useState<string | null>(null);

  const [
    removalReason,
    setRemovalReason,
  ] = useState("");

  function formatFileSize(
    sizeBytes: number
  ) {
    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    }

    if (
      sizeBytes <
      1024 * 1024
    ) {
      return `${(
        sizeBytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      sizeBytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ?? null;

    setSelectedFile(null);
    setError("");

    if (!file) {
      return;
    }

    const filename =
      file.name.toLowerCase();

    const validExtension =
      ALLOWED_EXTENSIONS.some(
        (extension) =>
          filename.endsWith(extension)
      );

    const validMimeType =
      ALLOWED_MIME_TYPES.has(
        file.type
      );

    if (
      !validExtension ||
      !validMimeType
    ) {
      setError(
        "Only JPG, JPEG, PNG, WEBP, and PDF Attachments are allowed."
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "Attachment must not exceed 5 MB."
      );

      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (
      !selectedFile ||
      !onUpload
    ) {
      return;
    }

    await onUpload(
      selectedFile
    );
  }

  function startRemoval(
    attachmentId: string
  ) {
    setRemovingAttachmentId(
      attachmentId
    );

    setRemovalReason("");
  }

  function cancelRemoval() {
    setRemovingAttachmentId(
      null
    );

    setRemovalReason("");
  }

  async function confirmRemoval() {
    const reason =
      removalReason.trim();

    if (
      !removingAttachmentId ||
      reason.length === 0
    ) {
      return;
    }

    await onRemove?.(
      removingAttachmentId,
      reason
    );

    setRemovingAttachmentId(
      null
    );

    setRemovalReason("");
  }

  const activeAttachmentCount =
    attachments.filter(
      (attachment) =>
        !attachment.isRemoved
    ).length;

  return (
    <section
      className="card shadow-sm"
      data-requester-id={
        requesterId
      }
      data-ticket-id={
        ticketId
      }
    >
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4">
          <div>
            <h2 className="h5 mb-1">
              Attachments
            </h2>

            <p className="text-muted mb-0">
              Add supporting evidence
              for this Ticket.
            </p>
          </div>

          <span className="badge bg-success-subtle text-success border border-success px-3 py-2">
            {activeAttachmentCount} / 5
            Active
          </span>
        </div>

        <div className="zen-section p-3 mb-4">
          <label
            htmlFor="attachment-file"
            className="form-label"
          >
            Choose Attachment
          </label>

          <input
            id="attachment-file"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className={`form-control ${
              error
                ? "is-invalid"
                : ""
            }`}
            onChange={
              handleFileChange
            }
            disabled={
              uploading ||
              activeAttachmentCount >=
                5
            }
          />

          <div className="form-text">
            Allowed: JPG, JPEG,
            PNG, WEBP, PDF.
            Maximum size: 5 MB.
            Maximum 5 active
            Attachments per Ticket.
          </div>

          {activeAttachmentCount >=
            5 && (
            <div className="alert alert-warning mt-3 mb-0">
              The maximum of 5
              active Attachments has
              been reached.
            </div>
          )}

          {error && (
            <div className="invalid-feedback d-block">
              {error}
            </div>
          )}

          {selectedFile && (
            <div className="mt-3 p-3 rounded border bg-light">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <div className="fw-semibold">
                    Selected file
                  </div>

                  <div>
                    {
                      selectedFile.name
                    }
                  </div>

                  <div className="small text-muted">
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </div>
                </div>

                {onUpload && (
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={
                      uploading
                    }
                    onClick={
                      handleUpload
                    }
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload Attachment"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {failedAttachment && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            <div className="fw-semibold mb-1">
  Upload Error
</div>

            <div className="fw-semibold">
              {
                failedAttachment.filename
              }
            </div>

            <div className="mb-3">
              {
                failedAttachment.message
              }
            </div>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              aria-label={`Retry ${failedAttachment.filename}`}
              onClick={() =>
                onRetryUpload?.()
              }
            >
              Retry Upload
            </button>
          </div>
        )}

        <div>
          <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
            <h3 className="h6 mb-0">
              Existing Attachments
            </h3>

            <span className="text-muted small">
              {attachments.length} Total
            </span>
          </div>

          {attachments.length ===
          0 ? (
            <div className="alert alert-light border text-center mb-0">
              <div className="fw-semibold mb-1">
                No Attachments yet.
              </div>

              <div className="small text-muted">
                Supporting files
                uploaded to this
                Ticket will appear
                here.
              </div>
            </div>
          ) : (
            <div className="list-group">
              {attachments.map(
                (attachment) => (
                  <div
                    key={
                      attachment.id
                    }
                    className={`list-group-item p-3 ${
                      attachment.isRemoved
                        ? "bg-light"
                        : ""
                    }`}
                  >
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="fw-semibold">
                            {
                              attachment.originalFilename
                            }
                          </span>

                          {attachment.isRemoved && (
                            <span className="badge text-bg-secondary">
                              Removed
                            </span>
                          )}
                        </div>

                        <div className="small text-muted mt-1">
                          {
                            attachment.mimeType
                          }{" "}
                          ·{" "}
                          {formatFileSize(
                            attachment.sizeBytes
                          )}
                        </div>

                        {attachment.isRemoved &&
                          attachment.removalReason && (
                            <div className="small text-muted mt-2">
                              <strong>
                                Reason:
                              </strong>{" "}
                              {
                                attachment.removalReason
                              }
                            </div>
                          )}

                        {attachment.isRemoved &&
                          attachment.removedAt && (
                            <div className="small text-muted mt-1">
                              Removed:{" "}
                              {new Date(
                                attachment.removedAt
                              ).toLocaleString()}
                            </div>
                          )}
                      </div>

                      {!attachment.isRemoved && (
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          {onDownload && (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              aria-label={`Download ${attachment.originalFilename}`}
                              onClick={() =>
                                onDownload(
                                  attachment.id,
                                  attachment.originalFilename
                                )
                              }
                            >
                              Download
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            aria-label={`Remove ${attachment.originalFilename}`}
                            onClick={() =>
                              startRemoval(
                                attachment.id
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {removingAttachmentId ===
                      attachment.id && (
                      <div className="mt-3 pt-3 border-top">
                        <div className="alert alert-warning py-2">
                          Removing this
                          Attachment keeps
                          its metadata for
                          audit purposes,
                          but the file will
                          no longer be
                          available for
                          download.
                        </div>

                        <label
                          htmlFor={`removal-reason-${attachment.id}`}
                          className="form-label"
                        >
                          Removal Reason
                        </label>

                        <textarea
                          id={`removal-reason-${attachment.id}`}
                          className="form-control"
                          rows={3}
                          placeholder="Explain why this Attachment should be removed"
                          value={
                            removalReason
                          }
                          onChange={(
                            event
                          ) =>
                            setRemovalReason(
                              event.target
                                .value
                            )
                          }
                        />

                        <div className="form-text">
                          A reason is
                          required before
                          removal.
                        </div>

                        <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={
                              removalReason
                                .trim()
                                .length ===
                              0
                            }
                            onClick={
                              confirmRemoval
                            }
                          >
                            Confirm Removal
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={
                              cancelRemoval
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}