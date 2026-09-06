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

  function getPriorityBadgeClass(
    priority: string
  ) {
    switch (priority) {
      case "Urgent":
        return "text-bg-danger";

      case "High":
        return "text-bg-warning";

      case "Medium":
        return "text-bg-success";

      case "Low":
      default:
        return "bg-light text-dark border";
    }
  }

  if (loading) {
    return (
      <div className="card shadow-sm">
        <div
          className="card-body p-4 text-center"
          role="status"
        >
          <div
            className="spinner-border spinner-border-sm text-success me-2"
            aria-hidden="true"
          />

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
            ← Back to My Tickets
          </button>

          <div
            className="alert alert-danger mb-0"
            role="alert"
          >
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
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <h2 className="h4 mb-0">
                  Ticket Detail
                </h2>

                <span className="badge bg-success-subtle text-success border border-success">
                  {ticket.status}
                </span>

                <span
                  className={`badge ${getPriorityBadgeClass(
                    ticket.requestedPriority
                  )}`}
                >
                  {
                    ticket.requestedPriority
                  }
                </span>
              </div>

              <p className="text-muted mb-0">
                Ticket Number:{" "}
                <strong>
                  {ticket.ticketNo}
                </strong>
              </p>
            </div>

            <button
  type="button"
  className="btn btn-outline-success"
  aria-label="Back to My Tickets"
  onClick={onBack}
>
  ← Back to My Tickets
</button>
          </div>

          <div className="zen-section p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
              <h3 className="h6 mb-0">
                Ticket Information
              </h3>

              <span className="badge bg-light text-dark border">
                Read-only
              </span>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label
                  htmlFor="detailTicketNumber"
                  className="form-label"
                >
                  Ticket Number
                </label>

                <input
                  id="detailTicketNumber"
                  className="form-control"
                  value={
                    ticket.ticketNo
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailRequester"
                  className="form-label"
                >
                  Requester
                </label>

                <input
                  id="detailRequester"
                  className="form-control"
                  value={
                    ticket.requester
                      .displayName
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailCategory"
                  className="form-label"
                >
                  Category
                </label>

                <input
                  id="detailCategory"
                  className="form-control"
                  value={
                    ticket.category.name
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailRelatedSystem"
                  className="form-label"
                >
                  Related System
                </label>

                <input
                  id="detailRelatedSystem"
                  className="form-control"
                  value={
                    ticket.relatedSystem
                      .name
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailPriority"
                  className="form-label"
                >
                  Requested Priority
                </label>

                <input
                  id="detailPriority"
                  className="form-control"
                  value={
                    ticket.requestedPriority
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailStatus"
                  className="form-label"
                >
                  Status
                </label>

                <input
                  id="detailStatus"
                  className="form-control"
                  value={
                    ticket.status
                  }
                  readOnly
                />
              </div>

              <div className="col-12">
                <label
                  htmlFor="detailSummary"
                  className="form-label"
                >
                  Summary
                </label>

                <input
                  id="detailSummary"
                  className="form-control"
                  value={
                    ticket.summary
                  }
                  readOnly
                />
              </div>

              <div className="col-12">
                <label
                  htmlFor="detailDescription"
                  className="form-label"
                >
                  Description
                </label>

                <textarea
                  id="detailDescription"
                  className="form-control"
                  rows={5}
                  value={
                    ticket.description
                  }
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailCreatedAt"
                  className="form-label"
                >
                  Ticket Date
                </label>

                <input
                  id="detailCreatedAt"
                  className="form-control"
                  value={new Date(
                    ticket.createdAt
                  ).toLocaleString()}
                  readOnly
                />
              </div>

              <div className="col-md-6">
                <label
                  htmlFor="detailUpdatedAt"
                  className="form-label"
                >
                  Last Updated
                </label>

                <input
                  id="detailUpdatedAt"
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
          <div
            className="card-body p-4 text-center"
            role="status"
          >
            <div
              className="spinner-border spinner-border-sm text-success me-2"
              aria-hidden="true"
            />

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