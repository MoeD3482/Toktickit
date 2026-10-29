import { useEffect, useState } from "react";

import {
  getRequesterDashboard,
  RequesterDashboard as RequesterDashboardData,
  RequesterDashboardTicket,
} from "../api.js";

interface RequesterDashboardProps {
  onSelectTicket: (ticketId: string) => void;
  onViewAllTickets: () => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function TicketList({
  tickets,
  onSelectTicket,
  emptyMessage,
}: {
  tickets: RequesterDashboardTicket[];
  onSelectTicket: (ticketId: string) => void;
  emptyMessage: string;
}) {
  if (tickets.length === 0) {
    return <p className="text-muted mb-0">{emptyMessage}</p>;
  }

  return (
    <div className="list-group">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          className="list-group-item list-group-item-action text-start"
          onClick={() => onSelectTicket(ticket.id)}
        >
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-1">
            <strong>{ticket.ticketNo}</strong>
            <span className="badge text-bg-secondary">
              {ticket.status}
            </span>
          </div>

          <div className="mb-1">{ticket.summary}</div>

          <div className="small text-muted">
            {ticket.category.name} · {ticket.relatedSystem.name}
          </div>

          <div className="small text-muted mt-1">
            Updated: {formatDate(ticket.updatedAt)}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function RequesterDashboard({
  onSelectTicket,
  onViewAllTickets,
}: RequesterDashboardProps) {
  const [dashboard, setDashboard] =
    useState<RequesterDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await getRequesterDashboard();
      setDashboard(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Requester Dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <section aria-busy="true">
        <h2 className="h4 mb-3">Requester Dashboard</h2>
        <p role="status">Loading your dashboard...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section>
        <h2 className="h4 mb-3">Requester Dashboard</h2>

        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          onClick={() => void loadDashboard()}
        >
          Try Again
        </button>
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  const metrics = [
    {
      label: "Open Tickets",
      value: dashboard.openTicketCount,
    },
    {
      label: "Waiting for You",
      value: dashboard.waitingForRequesterCount,
    },
    {
      label: "Recently Updated",
      value: dashboard.recentlyUpdatedCount,
    },
    {
      label: "Recently Resolved",
      value: dashboard.recentlyResolvedCount,
    },
  ];

  return (
    <main>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h2 className="h4 mb-1">Requester Dashboard</h2>
          <p className="text-muted mb-0">
            Check the status and recent updates of your tickets.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          onClick={() => void loadDashboard()}
        >
          Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        {metrics.map((metric) => (
          <div className="col-12 col-sm-6 col-xl-3" key={metric.label}>
            <button
              type="button"
              className="card h-100 w-100 text-start shadow-sm"
              onClick={onViewAllTickets}
              aria-label={`${metric.label}: ${metric.value}. View My Tickets`}
            >
              <div className="card-body">
                <div className="text-muted small mb-2">
                  {metric.label}
                </div>

                <div className="display-6 fw-semibold">
                  {metric.value}
                </div>

                <div className="small text-success mt-2">
                  View My Tickets →
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <section className="card h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">Recently Updated Tickets</h3>

              <TicketList
                tickets={dashboard.recentTickets}
                onSelectTicket={onSelectTicket}
                emptyMessage="No recently updated tickets."
              />
            </div>
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <section className="card h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">Waiting for Your Response</h3>

              <TicketList
                tickets={dashboard.attentionRequiredTickets}
                onSelectTicket={onSelectTicket}
                emptyMessage="No tickets are waiting for your response."
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}