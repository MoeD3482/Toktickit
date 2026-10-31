import { useEffect, useState } from "react";

import {
  ApiRequestError,
  MyTicketsQuery,
  RequesterDashboard as RequesterDashboardData,
  RequesterDashboardTicket,
  getRequesterDashboard,
} from "../api.js";

interface RequesterDashboardProps {
  onShowTickets: (
    query: Pick<
      MyTicketsQuery,
      "status" | "updatedWithinDays"
    >,
    label: string
  ) => void;
  onSelectTicket: (ticketId: string) => void;
}

const openStatuses = [
  "New",
  "Open",
  "InProgress",
  "WaitingForRequester",
  "Reopened",
] as const;

function statusLabel(status: string) {
  return status.replace(/([A-Z])/g, " $1").trim();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "Urgent":
      return "text-bg-danger";
    case "High":
      return "text-bg-warning";
    case "Medium":
      return "text-bg-success";
    default:
      return "bg-light text-dark border";
  }
}

function TicketList({
  heading,
  description,
  tickets,
  emptyMessage,
  onSelectTicket,
}: {
  heading: string;
  description: string;
  tickets: RequesterDashboardTicket[];
  emptyMessage: string;
  onSelectTicket: (ticketId: string) => void;
}) {
  return (
    <section className="card shadow-sm h-100" aria-labelledby={`${heading}-heading`}>
      <div className="card-body p-4">
        <h2 id={`${heading}-heading`} className="h5 mb-1">
          {heading}
        </h2>
        <p className="text-muted small mb-3">{description}</p>

        {tickets.length === 0 ? (
          <p className="text-muted mb-0">{emptyMessage}</p>
        ) : (
          <ul className="list-group list-group-flush">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="list-group-item px-0">
                <button
                  type="button"
                  className="btn btn-link text-start text-decoration-none p-0 w-100"
                  onClick={() => onSelectTicket(ticket.id)}
                  aria-label={`Open Ticket ${ticket.ticketNo}: ${ticket.summary}`}
                >
                  <span className="d-flex flex-column flex-sm-row justify-content-between gap-2">
                    <span>
                      <span className="d-block fw-semibold text-success">
                        {ticket.ticketNo}
                      </span>
                      <span className="d-block text-body text-break">
                        {ticket.summary}
                      </span>
                      <span className="d-block small text-muted mt-1">
                        Updated {formatDateTime(ticket.updatedAt)}
                      </span>
                    </span>
                    <span className="d-flex flex-wrap align-content-start gap-1">
                      <span className="badge bg-success-subtle text-success border border-success">
                        {statusLabel(ticket.status)}
                      </span>
                      <span className={`badge ${priorityBadgeClass(ticket.requestedPriority)}`}>
                        {ticket.requestedPriority}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function RequesterDashboard({
  onShowTickets,
  onSelectTicket,
}: RequesterDashboardProps) {
  const [dashboard, setDashboard] =
    useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage("");
        const result = await getRequesterDashboard();

        if (!cancelled) {
          setDashboard(result);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboard(null);
          setErrorMessage(
            error instanceof ApiRequestError &&
              (error.status === 401 || error.status === 403)
              ? "You are not allowed to view the Requester Dashboard."
              : "Unable to load the Requester Dashboard. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="card shadow-sm">
        <div className="card-body p-4 text-center" role="status">
          <span className="spinner-border spinner-border-sm text-success me-2" aria-hidden="true" />
          Loading Requester Dashboard...
        </div>
      </div>
    );
  }

  if (errorMessage || !dashboard) {
    return (
      <div className="alert alert-danger" role="alert">
        {errorMessage || "Unable to load the Requester Dashboard. Please try again."}
      </div>
    );
  }

  const hasTickets =
    dashboard.openTicketCount > 0 ||
    dashboard.recentlyResolvedCount > 0 ||
    dashboard.recentTickets.length > 0;

  const cards = [
    {
      label: "Open Tickets",
      value: dashboard.openTicketCount,
      description: "New, active, waiting, or reopened Tickets.",
      query: { status: [...openStatuses] },
      destination: "open Tickets",
    },
    {
      label: "Waiting for You",
      value: dashboard.waitingForRequesterCount,
      description: "Tickets that need your response.",
      query: { status: "WaitingForRequester" as const },
      destination: "Tickets waiting for you",
    },
    {
      label: "Recently Updated",
      value: dashboard.recentlyUpdatedCount,
      description: "Up to five updates from the last 30 days.",
      query: { updatedWithinDays: 30 },
      destination: "recently updated Tickets",
    },
    {
      label: "Recently Resolved",
      value: dashboard.recentlyResolvedCount,
      description: "Resolved or closed in the last 30 days.",
      query: {
        status: ["Resolved", "Closed"] as const,
        updatedWithinDays: 30,
      },
      destination: "recently resolved Tickets",
    },
  ];

  return (
    <section aria-labelledby="requester-dashboard-heading">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h2 id="requester-dashboard-heading" className="h4 mb-1">
            Requester Dashboard
          </h2>
          <p className="text-muted mb-0">
            A concise view of your Tickets and updates.
          </p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="col-12 col-sm-6 col-xl-3">
            <button
              type="button"
              className="card shadow-sm h-100 w-100 text-start border-success-subtle dashboard-metric-card"
              onClick={() => onShowTickets(card.query, card.destination)}
              aria-label={`View ${card.destination}: ${card.value}`}
            >
              <span className="card-body d-block p-4">
                <span className="d-block text-muted small mb-2">{card.label}</span>
                <span className="d-block display-6 fw-semibold text-success">{card.value}</span>
                <span className="d-block small text-body mt-2">{card.description}</span>
              </span>
            </button>
          </div>
        ))}
      </div>

      {!hasTickets && (
        <div className="alert alert-info" role="status">
          No Tickets to show yet. Create a Ticket when you need help.
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <TicketList
            heading="Recent Tickets"
            description="The five most recently updated Tickets from the last 30 days."
            tickets={dashboard.recentTickets}
            emptyMessage="No Tickets have been updated in the last 30 days."
            onSelectTicket={onSelectTicket}
          />
        </div>
        <div className="col-12 col-lg-6">
          <TicketList
            heading="Attention Required"
            description="Tickets currently waiting for your response."
            tickets={dashboard.attentionRequiredTickets}
            emptyMessage="No Tickets are waiting for your response."
            onSelectTicket={onSelectTicket}
          />
        </div>
      </div>
    </section>
  );
}
