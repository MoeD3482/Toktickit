import {
  useEffect,
  useState,
} from "react";

import {
  DevelopmentRequester,
  downloadTicketAttachment,
  getTicketAttachments,
  getTicketDetail,
  removeTicketAttachment,
  TicketAttachment,
  TicketDetail,
  uploadTicketAttachment,
} from "../api.js";

import AttachmentSection from "./AttachmentSection.js";

interface RequesterTicketDetailProps {
  requester: DevelopmentRequester;
  ticketId: string;
  onBack: () => void;
}

interface FailedUpload {
  file: File;
  filename: string;
  message: string;
}

export default function RequesterTicketDetail({
  requester,
  ticketId,
  onBack,
}: RequesterTicketDetailProps) {
  const [ticket, setTicket] =
    useState<TicketDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    attachments,
    setAttachments,
  ] = useState<TicketAttachment[]>([]);

  const [
    attachmentsLoading,
    setAttachmentsLoading,
  ] = useState(true);

  const [
    attachmentError,
    setAttachmentError,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    failedUpload,
    setFailedUpload,
  ] = useState<FailedUpload | null>(
    null
  );

  const [
    attachmentSectionKey,
    setAttachmentSectionKey,
  ] = useState(0);

  /*
   * Load Ticket Detail.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      try {
        setLoading(true);
        setErrorMessage("");

        const result =
          await getTicketDetail(
            requester.id,
            ticketId
          );

        if (!cancelled) {
          setTicket(result);
        }
      } catch {
        if (!cancelled) {
          setTicket(null);

          setErrorMessage(
            "Unable to load Ticket detail. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      cancelled = true;
    };
  }, [
    requester.id,
    ticketId,
  ]);

  /*
   * Load Attachment metadata separately.
   *
   * Attachment failure must not cause the
   * Ticket itself to disappear.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAttachments() {
      try {
        setAttachmentsLoading(true);
        setAttachmentError("");

        const result =
          await getTicketAttachments(
            requester.id,
            ticketId
          );

        if (!cancelled) {
          setAttachments(result);
        }
      } catch {
        if (!cancelled) {
          setAttachments([]);

          setAttachmentError(
            "Unable to load Attachments."
          );
        }
      } finally {
        if (!cancelled) {
          setAttachmentsLoading(false);
        }
      }
    }

    loadAttachments();

    return () => {
      cancelled = true;
    };
  }, [
    requester.id,
    ticketId,
  ]);

  async function handleUpload(
    file: File
  ) {
    try {
      setUploading(true);
      setAttachmentError("");

      const uploaded =
        await uploadTicketAttachment(
          requester.id,
          ticketId,
          file
        );

      setAttachments(
        (current) => [
          ...current,
          uploaded,
        ]
      );

      setFailedUpload(null);

      /*
       * Remount AttachmentSection so the
       * successful selected file is cleared.
       */
      setAttachmentSectionKey(
        (current) =>
          current + 1
      );
    } catch {
      setFailedUpload({
        file,
        filename: file.name,
        message:
          "Attachment upload failed.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleRetryUpload() {
    if (!failedUpload) {
      return;
    }

    await handleUpload(
      failedUpload.file
    );
  }

  async function handleRemove(
    attachmentId: string,
    reason: string
  ) {
    try {
      setAttachmentError("");

      const removed =
        await removeTicketAttachment(
          requester.id,
          ticketId,
          attachmentId,
          reason
        );

      setAttachments(
        (current) =>
          current.map(
            (attachment) =>
              attachment.id ===
              removed.id
                ? removed
                : attachment
          )
      );
    } catch {
      setAttachmentError(
        "Unable to remove Attachment. Please try again."
      );

      throw new Error(
        "Attachment removal failed."
      );
    }
  }

  async function handleDownload(
    attachmentId: string,
    filename: string
  ) {
    try {
      setAttachmentError("");

      const blob =
        await downloadTicketAttachment(
          requester.id,
          ticketId,
          attachmentId
        );

      const objectUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = objectUrl;
      link.download = filename;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        objectUrl
      );
    } catch {
      setAttachmentError(
        "Unable to download Attachment."
      );
    }
  }

  if (loading) {
    return (
      <div className="card shadow-sm">
        <div className="card-body p-4 text-center">
          Loading Ticket detail...
        </div>
      </div>
    );
  }

  if (
    errorMessage ||
    !ticket
  ) {
    return (
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <button
            type="button"
            className="btn btn-outline-success mb-3"
            onClick={onBack}
          >
            Back to My Tickets
          </button>

          <div className="alert alert-danger mb-0">
            {errorMessage ||
              "Unable to load Ticket detail. Please try again."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">
                Ticket Detail
              </h2>

              <p className="text-muted mb-0">
                {ticket.ticketNo}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-success"
              onClick={onBack}
            >
              Back to My Tickets
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Ticket Number
              </label>

              <input
                className="form-control"
                value={
                  ticket.ticketNo
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Requester
              </label>

              <input
                className="form-control"
                value={
                  ticket.requester
                    .displayName
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Category
              </label>

              <input
                className="form-control"
                value={
                  ticket.category.name
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Related System
              </label>

              <input
                className="form-control"
                value={
                  ticket.relatedSystem
                    .name
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Requested Priority
              </label>

              <input
                className="form-control"
                value={
                  ticket.requestedPriority
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Status
              </label>

              <input
                className="form-control"
                value={
                  ticket.status
                }
                readOnly
              />
            </div>

            <div className="col-12">
              <label className="form-label">
                Summary
              </label>

              <input
                className="form-control"
                value={
                  ticket.summary
                }
                readOnly
              />
            </div>

            <div className="col-12">
              <label className="form-label">
                Description
              </label>

              <textarea
                className="form-control"
                rows={5}
                value={
                  ticket.description
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Ticket Date
              </label>

              <input
                className="form-control"
                value={new Date(
                  ticket.createdAt
                ).toLocaleString()}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Last Updated
              </label>

              <input
                className="form-control"
                value={new Date(
                  ticket.updatedAt
                ).toLocaleString()}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {attachmentError && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {attachmentError}
        </div>
      )}

      {attachmentsLoading ? (
        <div className="card shadow-sm">
          <div className="card-body p-4 text-center">
            Loading Attachments...
          </div>
        </div>
      ) : (
        <AttachmentSection
          key={
            attachmentSectionKey
          }
          requesterId={
            requester.id
          }
          ticketId={
            ticketId
          }
          attachments={
            attachments
          }
          uploading={
            uploading
          }
          failedAttachment={
            failedUpload
              ? {
                  filename:
                    failedUpload.filename,
                  message:
                    failedUpload.message,
                }
              : undefined
          }
          onUpload={
            handleUpload
          }
          onRetryUpload={
            handleRetryUpload
          }
          onDownload={
            handleDownload
          }
          onRemove={
            handleRemove
          }
        />
      )}
    </div>
  );
}