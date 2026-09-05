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

  return (
    <section
      className="card p-3"
      data-requester-id={
        requesterId
      }
      data-ticket-id={
        ticketId
      }
    >
      <h2 className="h5 mb-3">
        Attachments
      </h2>

      <div className="mb-3">
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
          disabled={uploading}
        />

        <div className="form-text">
          Allowed: JPG, JPEG, PNG,
          WEBP, PDF. Maximum size:
          5 MB.
        </div>

        {error && (
          <div className="invalid-feedback d-block">
            {error}
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="mb-3">
          <div className="mb-2">
            <strong>
              Selected file:
            </strong>{" "}
            {selectedFile.name}
          </div>

          {onUpload && (
            <button
              type="button"
              className="btn btn-success btn-sm"
              disabled={uploading}
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
      )}

      {failedAttachment && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          <div className="fw-semibold">
            {
              failedAttachment.filename
            }
          </div>

          <div className="mb-2">
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

      {attachments.length > 0 && (
        <div className="mt-2">
          <h3 className="h6">
            Existing Attachments
          </h3>

          <div className="list-group">
            {attachments.map(
              (attachment) => (
                <div
                  key={
                    attachment.id
                  }
                  className="list-group-item"
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                      <div>
                        {
                          attachment.originalFilename
                        }
                      </div>

                      <small className="text-muted">
                        {
                          attachment.mimeType
                        }
                      </small>

                      {attachment.isRemoved && (
                        <div className="mt-1">
                          <span className="badge text-bg-secondary">
                            Removed
                          </span>
                        </div>
                      )}

                      {attachment.isRemoved &&
                        attachment.removalReason && (
                          <div className="small text-muted mt-1">
                            Reason:{" "}
                            {
                              attachment.removalReason
                            }
                          </div>
                        )}
                    </div>

                    {!attachment.isRemoved && (
                      <div className="d-flex gap-2">
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
                    <div className="mt-3 border-top pt-3">
                      <label
                        htmlFor={`removal-reason-${attachment.id}`}
                        className="form-label"
                      >
                        Removal Reason
                      </label>

                      <textarea
                        id={`removal-reason-${attachment.id}`}
                        className="form-control"
                        value={
                          removalReason
                        }
                        onChange={(
                          event
                        ) =>
                          setRemovalReason(
                            event.target.value
                          )
                        }
                      />

                      <div className="d-flex gap-2 mt-2">
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
                          className="btn btn-secondary btn-sm"
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
        </div>
      )}
    </section>
  );
}