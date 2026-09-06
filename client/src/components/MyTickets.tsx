import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Category,
  DevelopmentRequester,
  getActiveCategories,
  getMyTickets,
  getRelatedSystems,
  RelatedSystem,
  RequestedPriority,
  TicketListItem,
  TicketListMeta,
} from "../api.js";

interface MyTicketsProps {
  requester: DevelopmentRequester;
  onSelectTicket?: (
    ticketId: string
  ) => void;
}

export default function MyTickets({
  requester,
  onSelectTicket = () => {},
}: MyTicketsProps) {
  const [tickets, setTickets] =
    useState<TicketListItem[]>([]);

  const [meta, setMeta] =
    useState<TicketListMeta>({
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [
    relatedSystems,
    setRelatedSystems,
  ] = useState<RelatedSystem[]>([]);

  const [search, setSearch] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [
    relatedSystemId,
    setRelatedSystemId,
  ] = useState("");

  const [
    requestedPriority,
    setRequestedPriority,
  ] = useState<
    RequestedPriority | ""
  >("");

  const [status, setStatus] =
    useState<"New" | "">("");

  const [sort, setSort] = useState<
    | "ticketNo"
    | "createdAt"
    | "updatedAt"
  >("updatedAt");

  const [order, setOrder] =
    useState<"asc" | "desc">(
      "desc"
    );

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryId !== "" ||
    relatedSystemId !== "" ||
    requestedPriority !== "" ||
    status !== "";

  async function loadTickets(
    page = 1
  ) {
    try {
      setLoading(true);
      setErrorMessage("");

      const result =
        await getMyTickets(
          requester.id,
          {
            search:
              search.trim() ||
              undefined,

            categoryId:
              categoryId
                ? Number(
                    categoryId
                  )
                : undefined,

            relatedSystemId:
              relatedSystemId ||
              undefined,

            requestedPriority:
              requestedPriority ||
              undefined,

            status:
              status || undefined,

            sort,
            order,
            page,
            pageSize: 10,
          }
        );

      setTickets(result.data);
      setMeta(result.meta);
    } catch {
      setTickets([]);

      setErrorMessage(
        "Unable to load your Tickets. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [
          categoryData,
          relatedSystemData,
        ] =
          await Promise.all([
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
        // Ticket list can still
        // display if reference
        // data loading fails.
      }
    }

    loadReferenceData();
  }, []);

  useEffect(() => {
    loadTickets(1);
  }, [requester.id]);

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    loadTickets(1);
  }

  function handleClearFilters() {
    setSearch("");
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("");
    setStatus("");

    setSort("updatedAt");
    setOrder("desc");

    setTimeout(() => {
      loadTickets(1);
    }, 0);
  }

  function getPriorityBadgeClass(
    priority: RequestedPriority
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

  return (
    <>
      <style>{`
        .ticket-grid {
          border: 1px solid #d7e5dd;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .ticket-grid-header,
        .ticket-grid-row {
          display: grid;
          grid-template-columns:
            1.25fr
            2.2fr
            1.45fr
            1.45fr
            0.85fr
            0.75fr
            1.4fr;
          gap: 0;
          align-items: center;
        }

        .ticket-grid-header {
          background: #eaf6ef;
          color: #006b3c;
          font-weight: 700;
        }

        .ticket-grid-header > div,
        .ticket-grid-cell {
          padding: 0.75rem 0.65rem;
          min-width: 0;
        }

        .ticket-grid-row {
          border-top: 1px solid #d7e5dd;
          background: #ffffff;
        }

        .ticket-grid-row:hover {
          background: #f8fbf9;
        }

        .ticket-grid-cell {
          overflow-wrap: anywhere;
        }

        @media (max-width: 767.98px) {
          .ticket-grid {
            border: 0;
            border-radius: 0;
            overflow: visible;
          }

          .ticket-grid-header {
            display: none;
          }

          .ticket-grid-row {
            display: block;
            border: 1px solid #d7e5dd;
            border-radius: 0.65rem;
            margin-bottom: 1rem;
            padding: 0.45rem 0.8rem;
            background: #ffffff;
          }

          .ticket-grid-row:hover {
            background: #ffffff;
          }

          .ticket-grid-cell {
            display: grid;
            grid-template-columns:
              minmax(105px, 38%)
              minmax(0, 1fr);
            gap: 0.75rem;
            align-items: start;
            padding: 0.55rem 0;
            border-bottom: 1px solid #edf3ef;
            overflow-wrap: anywhere;
          }

          .ticket-grid-cell:last-child {
            border-bottom: 0;
          }

          .ticket-grid-cell::before {
            content: attr(data-label);
            font-weight: 700;
            color: #006b3c;
            line-height: 1.35;
          }

          .ticket-number-button {
            text-align: left;
            white-space: normal;
            overflow-wrap: anywhere;
          }
        }

        @media (max-width: 420px) {
          .ticket-grid-cell {
            grid-template-columns: 1fr;
            gap: 0.2rem;
          }
        }
      `}</style>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
            <div>
              <h2 className="h4 mb-1">
                My Tickets
              </h2>

              <p className="text-muted mb-0">
                Tickets belonging to{" "}
                <strong>
                  {
                    requester.displayName
                  }
                </strong>
              </p>
            </div>

            {!loading &&
              !errorMessage && (
                <span className="badge rounded-pill bg-success-subtle text-success border border-success px-3 py-2">
                  {meta.totalItems} Ticket
                  {meta.totalItems === 1
                    ? ""
                    : "s"}
                </span>
              )}
          </div>

          <form
            onSubmit={handleSearch}
            className="mb-4 p-3 zen-section"
          >
            <div className="row g-3">
              <div className="col-lg-4">
                <label
                  htmlFor="ticketSearch"
                  className="form-label"
                >
                  Search
                </label>

                <input
                  id="ticketSearch"
                  className="form-control"
                  value={search}
                  placeholder="Ticket number, summary or description"
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="col-md-6 col-lg-2">
                <label
                  htmlFor="ticketCategory"
                  className="form-label"
                >
                  Category
                </label>

                <select
                  id="ticketCategory"
                  className="form-select"
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All
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
              </div>

              <div className="col-md-6 col-lg-2">
                <label
                  htmlFor="ticketSystem"
                  className="form-label"
                >
                  Related System
                </label>

                <select
                  id="ticketSystem"
                  className="form-select"
                  value={
                    relatedSystemId
                  }
                  onChange={(event) =>
                    setRelatedSystemId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All
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
              </div>

              <div className="col-md-6 col-lg-2">
                <label
                  htmlFor="ticketPriority"
                  className="form-label"
                >
                  Priority
                </label>

                <select
                  id="ticketPriority"
                  className="form-select"
                  value={
                    requestedPriority
                  }
                  onChange={(event) =>
                    setRequestedPriority(
                      event.target.value as
                        | RequestedPriority
                        | ""
                    )
                  }
                >
                  <option value="">
                    All
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
              </div>

              <div className="col-md-6 col-lg-2">
                <label
                  htmlFor="ticketStatus"
                  className="form-label"
                >
                  Status
                </label>

                <select
                  id="ticketStatus"
                  className="form-select"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as
                        | "New"
                        | ""
                    )
                  }
                >
                  <option value="">
                    All
                  </option>

                  <option value="New">
                    New
                  </option>
                </select>
              </div>

              <div className="col-md-6 col-lg-3">
                <label
                  htmlFor="ticketSort"
                  className="form-label"
                >
                  Sort By
                </label>

                <select
                  id="ticketSort"
                  className="form-select"
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value as
                        | "ticketNo"
                        | "createdAt"
                        | "updatedAt"
                    )
                  }
                >
                  <option value="updatedAt">
                    Last Updated
                  </option>

                  <option value="createdAt">
                    Ticket Date
                  </option>

                  <option value="ticketNo">
                    Ticket Number
                  </option>
                </select>
              </div>

              <div className="col-md-6 col-lg-2">
                <label
                  htmlFor="ticketOrder"
                  className="form-label"
                >
                  Order
                </label>

                <select
                  id="ticketOrder"
                  className="form-select"
                  value={order}
                  onChange={(event) =>
                    setOrder(
                      event.target.value as
                        | "asc"
                        | "desc"
                    )
                  }
                >
                  <option value="desc">
                    Descending
                  </option>

                  <option value="asc">
                    Ascending
                  </option>
                </select>
              </div>

              <div className="col-lg-7 d-flex flex-column flex-sm-row align-items-sm-end gap-2">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading
                    ? "Loading..."
                    : "Apply"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={
                    handleClearFilters
                  }
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          {loading && (
            <div
              className="alert alert-light border text-center py-4"
              role="status"
            >
              <div
                className="spinner-border spinner-border-sm text-success me-2"
                aria-hidden="true"
              />

              Loading your Tickets...
            </div>
          )}

          {!loading &&
            errorMessage && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

          {!loading &&
            !errorMessage &&
            tickets.length === 0 &&
            meta.totalItems === 0 && (
              <div className="alert alert-light border text-center py-4">
                <h3 className="h6 mb-2">
                  No Tickets found.
                </h3>

                <p className="text-muted mb-0">
                  {hasActiveFilters
                    ? "No Tickets match the current search or filters. Try changing or clearing the filters."
                    : "You have not created any Tickets yet."}
                </p>
              </div>
            )}

          {!loading &&
            !errorMessage &&
            tickets.length > 0 && (
              <>
                <div className="ticket-grid">
                  <div
                    className="ticket-grid-header"
                    aria-hidden="true"
                  >
                    <div>
                      Ticket Number
                    </div>
                    <div>
                      Summary
                    </div>
                    <div>
                      Category
                    </div>
                    <div>
                      Related System
                    </div>
                    <div>
                      Priority
                    </div>
                    <div>
                      Status
                    </div>
                    <div>
                      Last Updated
                    </div>
                  </div>

                  {tickets.map(
                    (ticket) => (
                      <div
                        className="ticket-grid-row"
                        key={ticket.id}
                      >
                        <div
                          className="ticket-grid-cell"
                          data-label="Ticket Number"
                        >
                          <button
                            type="button"
                            className="btn btn-link p-0 fw-bold text-success text-decoration-none ticket-number-button"
                            onClick={() =>
                              onSelectTicket(
                                ticket.id
                              )
                            }
                          >
                            {
                              ticket.ticketNo
                            }
                          </button>
                        </div>

                        <div
                          className="ticket-grid-cell"
                          data-label="Summary"
                        >
                          {ticket.summary}
                        </div>

                        <div
                          className="ticket-grid-cell"
                          data-label="Category"
                        >
                          {
                            ticket.category
                              .name
                          }
                        </div>

                        <div
                          className="ticket-grid-cell"
                          data-label="Related System"
                        >
                          {
                            ticket
                              .relatedSystem
                              .name
                          }
                        </div>

                        <div
                          className="ticket-grid-cell"
                          data-label="Priority"
                        >
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

                        <div
                          className="ticket-grid-cell"
                          data-label="Status"
                        >
                          <span className="badge bg-success-subtle text-success border border-success">
                            {
                              ticket.status
                            }
                          </span>
                        </div>

                        <div
                          className="ticket-grid-cell"
                          data-label="Last Updated"
                        >
                          {new Date(
                            ticket.updatedAt
                          ).toLocaleString()}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-4">
                  <div className="text-muted">
                    Page {meta.page} of{" "}
                    {meta.totalPages} ·{" "}
                    {meta.totalItems} Ticket
                    {meta.totalItems === 1
                      ? ""
                      : "s"}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={
                        loading ||
                        meta.page <= 1
                      }
                      onClick={() =>
                        loadTickets(
                          meta.page - 1
                        )
                      }
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={
                        loading ||
                        meta.totalPages ===
                          0 ||
                        meta.page >=
                          meta.totalPages
                      }
                      onClick={() =>
                        loadTickets(
                          meta.page + 1
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
    </>
  );
}