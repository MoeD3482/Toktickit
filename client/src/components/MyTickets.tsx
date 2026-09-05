import { FormEvent, useEffect, useState } from "react";
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
  onSelectTicket?: (ticketId: string) => void;
}

export default function MyTickets({
  requester,
  onSelectTicket = () => {},
}: MyTicketsProps) {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);

  const [meta, setMeta] = useState<TicketListMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");

  const [requestedPriority, setRequestedPriority] = useState<
    RequestedPriority | ""
  >("");

  const [status, setStatus] = useState<"New" | "">("");

  const [sort, setSort] = useState<
    "ticketNo" | "createdAt" | "updatedAt"
  >("updatedAt");

  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadTickets(page = 1) {
    try {
      setLoading(true);
      setErrorMessage("");

      const result = await getMyTickets(requester.id, {
        search: search.trim() || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        relatedSystemId: relatedSystemId || undefined,
        requestedPriority: requestedPriority || undefined,
        status: status || undefined,
        sort,
        order,
        page,
        pageSize: 10,
      });

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
        const [categoryData, relatedSystemData] = await Promise.all([
          getActiveCategories(),
          getRelatedSystems(),
        ]);

        setCategories(categoryData);
        setRelatedSystems(relatedSystemData);
      } catch {
        // Ticket list can still show if reference data fails.
      }
    }

    loadReferenceData();
  }, []);

  useEffect(() => {
    loadTickets(1);
  }, [requester.id]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
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

  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h4 mb-1">My Tickets</h2>

            <p className="text-muted mb-0">
              Tickets belonging to {requester.displayName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-4">
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
                  setSearch(event.target.value)
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
                  setCategoryId(event.target.value)
                }
              >
                <option value="">All</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
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
                value={relatedSystemId}
                onChange={(event) =>
                  setRelatedSystemId(event.target.value)
                }
              >
                <option value="">All</option>

                {relatedSystems.map((system) => (
                  <option
                    key={system.id}
                    value={system.id}
                  >
                    {system.name}
                  </option>
                ))}
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
                value={requestedPriority}
                onChange={(event) =>
                  setRequestedPriority(
                    event.target.value as
                      | RequestedPriority
                      | ""
                  )
                }
              >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
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
                    event.target.value as "New" | ""
                  )
                }
              >
                <option value="">All</option>
                <option value="New">New</option>
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

            <div className="col-lg-7 d-flex align-items-end gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                Apply
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        {loading && (
          <div className="py-4 text-center">
            Loading your Tickets...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="alert alert-danger">
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          tickets.length === 0 &&
          meta.totalItems === 0 && (
            <div className="alert alert-light border">
              No Tickets found.
            </div>
          )}

        {!loading &&
          !errorMessage &&
          tickets.length > 0 && (
            <>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Ticket Number</th>
                      <th>Summary</th>
                      <th>Category</th>
                      <th>Related System</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0 fw-bold text-success text-decoration-none"
                            onClick={() =>
                              onSelectTicket(ticket.id)
                            }
                          >
                            {ticket.ticketNo}
                          </button>
                        </td>

                        <td>{ticket.summary}</td>

                        <td>
                          {ticket.category.name}
                        </td>

                        <td>
                          {ticket.relatedSystem.name}
                        </td>

                        <td>
                          {ticket.requestedPriority}
                        </td>

                        <td>{ticket.status}</td>

                        <td>
                          {new Date(
                            ticket.updatedAt
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3">
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
                      loading || meta.page <= 1
                    }
                    onClick={() =>
                      loadTickets(meta.page - 1)
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-success"
                    disabled={
                      loading ||
                      meta.totalPages === 0 ||
                      meta.page >= meta.totalPages
                    }
                    onClick={() =>
                      loadTickets(meta.page + 1)
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
  );
}