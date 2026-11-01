
import { useEffect, useState } from "react";

import {
  ApiRequestError,
  getStaffDashboard,
  ITPriority,
  StaffDashboard as StaffDashboardData,
  StaffDashboardTicket,
  StaffTicketQuery,
  TicketStatus,
} from "../api.js";

interface StaffDashboardProps {
  currentUserId: string;
  onShowQueue: (
    query: Pick<
      StaffTicketQuery,
      "status" | "itPriority" | "assignedToUserId"
    >,
    label: string
  ) => void;
  onSelectTicket: (ticketId: string) => void;
}

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

function TicketList({
  heading,
  description,
  tickets,
  emptyMessage,
  onSelectTicket,
}: {
  heading: string;
  description: string;
  tickets: StaffDashboardTicket[];
  emptyMessage: string;
  onSelectTicket: (ticketId: string) => void;
}) {
  return (
    <section className="card shadow-sm h-100">
      <div className="card-body p-4">
        <h3 className="h5 mb-1">{heading}</h3>
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
                        {statusLabel(ticket.status)} · Updated{" "}
                        {formatDateTime(ticket.updatedAt)}
                      </span>
                    </span>

                    <span className="d-flex flex-wrap align-content-start gap-1">
                      {ticket.itPriority && (
                        <span className="badge bg-warning-subtle text-dark border">
                          {ticket.itPriority}
                        </span>
                      )}
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

export default function StaffDashboard({
  currentUserId,
  onShowQueue,
  onSelectTicket,
}: StaffDashboardProps) {
  const [dashboard, setDashboard] =
    useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage("");

        const result = await getStaffDashboard();

        if (!cancelled) {
          setDashboard(result);
        }
      } catch (error) {
        if (!cancelled) {
          setDashboard(null);
          setErrorMessage(
            error instanceof ApiRequestError &&
              (error.status === 401 || error.status === 403)
              ? "You are not allowed to view the Staff Dashboard."
              : "Unable to load the Staff Dashboard. Please try again."
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
          <span
            className="spinner-border spinner-border-sm text-success me-2"
            aria-hidden="true"
          />
          Loading Staff Dashboard...
        </div>
      </div>
    );
  }

  if (errorMessage || !dashboard) {
    return (
      <div className="alert alert-danger" role="alert">
        {errorMessage || "Unable to load the Staff Dashboard. Please try again."}
      </div>
    );
  }

  const cards = [
    {
      label: "Unassigned Tickets",
      value: dashboard.unassignedTicketCount,
      description: "Tickets waiting for staff assignment.",
      query: { assignedToUserId: "unassigned" },
    },
    {
  label: "My Tickets",
  value: dashboard.ownedByCurrentUserCount,
  description: "Active Tickets assigned to you.",
  query: { assignedToUserId: currentUserId },
},
  ];

  const statuses: TicketStatus[] = [
    "New",
    "Open",
    "InProgress",
    "WaitingForRequester",
    "Reopened",
  ];

  const priorities: ITPriority[] = [
    "Urgent",
    "High",
    "Medium",
    "Low",
  ];

  return (
    <section aria-labelledby="staff-dashboard-heading">
      <div className="mb-4">
        <h2 id="staff-dashboard-heading" className="h4 mb-1">
          Staff Dashboard
        </h2>
        <p className="text-muted mb-0">
          Overview of ticket assignments, workload, and urgent issues.
        </p>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="col-12 col-sm-6">
            <button
              type="button"
              className="card shadow-sm h-100 w-100 text-start border-success-subtle dashboard-metric-card"
              onClick={() =>
                onShowQueue(
                  card.query,
                  card.label
                )
              }
            >
              <span className="card-body d-block p-4">
                <span className="d-block text-muted small mb-2">
                  {card.label}
                </span>
                <span className="d-block display-6 fw-semibold text-success">
                  {card.value}
                </span>
                <span className="d-block small text-body mt-2">
                  {card.description}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <section className="card shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h5 mb-3">Tickets by Status</h3>
              <div className="list-group list-group-flush">
                {statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center px-0"
                    onClick={() =>
                      onShowQueue(
                        { status },
                        `${statusLabel(status)} Tickets`
                      )
                    }
                  >
                    {statusLabel(status)}
                    <span className="badge bg-success rounded-pill">
                      {dashboard.statusCounts[status] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="col-12 col-lg-6">
          <section className="card shadow-sm h-100">
            <div className="card-body p-4">
              <h3 className="h5 mb-3">Tickets by IT Priority</h3>
              <div className="list-group list-group-flush">
                {priorities.map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center px-0"
                    onClick={() =>
                      onShowQueue(
                        { itPriority: priority },
                        `${priority} Priority Tickets`
                      )
                    }
                  >
                    {priority}
                    <span className="badge bg-success rounded-pill">
                      {dashboard.priorityCounts[priority] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <TicketList
            heading="Recently Updated"
            description="The five most recently updated Tickets."
            tickets={dashboard.recentTickets}
            emptyMessage="No recently updated Tickets."
            onSelectTicket={onSelectTicket}
          />
        </div>

        <div className="col-12 col-lg-6">
          <TicketList
            heading="Urgent Tickets"
            description="Active Tickets marked as Urgent."
            tickets={dashboard.urgentTickets}
            emptyMessage="No urgent Tickets at the moment."
            onSelectTicket={onSelectTicket}
          />
        </div>
      </div>
    </section>
  );
}
