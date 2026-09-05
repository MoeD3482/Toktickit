import { useEffect, useState } from "react";
import {
  DevelopmentRequester,
  getTicketDetail,
  TicketDetail,
} from "../api.js";

interface RequesterTicketDetailProps {
  requester: DevelopmentRequester;
  ticketId: string;
  onBack: () => void;
}

export default function RequesterTicketDetail({
  requester,
  ticketId,
  onBack,
}: RequesterTicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setErrorMessage("");

        const result = await getTicketDetail(
          requester.id,
          ticketId
        );

        setTicket(result);
      } catch {
        setTicket(null);
        setErrorMessage(
          "Unable to load Ticket detail. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [requester.id, ticketId]);

  if (loading) {
    return (
      <div className="card shadow-sm">
        <div className="card-body p-4 text-center">
          Loading Ticket detail...
        </div>
      </div>
    );
  }

  if (errorMessage || !ticket) {
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
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4">
          <div>
            <h2 className="h4 mb-1">Ticket Detail</h2>

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
              value={ticket.ticketNo}
              readOnly
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Requester
            </label>

            <input
              className="form-control"
              value={ticket.requester.displayName}
              readOnly
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Category
            </label>

            <input
              className="form-control"
              value={ticket.category.name}
              readOnly
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Related System
            </label>

            <input
              className="form-control"
              value={ticket.relatedSystem.name}
              readOnly
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Requested Priority
            </label>

            <input
              className="form-control"
              value={ticket.requestedPriority}
              readOnly
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Status
            </label>

            <input
              className="form-control"
              value={ticket.status}
              readOnly
            />
          </div>

          <div className="col-12">
            <label className="form-label">
              Summary
            </label>

            <input
              className="form-control"
              value={ticket.summary}
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
              value={ticket.description}
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
  );
}