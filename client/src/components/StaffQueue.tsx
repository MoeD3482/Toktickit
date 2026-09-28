import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  ApiRequestError,
  Category,
  getActiveCategories,
  getRelatedSystems,
  getStaffAssignees,
  getStaffTickets,
  ITPriority,
  RelatedSystem,
  RequestedPriority,
  StaffAssignee,
  StaffTicketListItem,
  StaffTicketMeta,
  StaffTicketQuery,
  TicketStatus,
} from "../api.js";

interface StaffQueueProps {
  onSelectTicket: (ticketId: string) => void;
}

const priorities: RequestedPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

const statuses: TicketStatus[] = [
  "New",
  "InProgress",
  "WaitingForRequester",
  "Resolved",
  "Closed",
  "Reopened",
  "Cancelled",
];

function statusLabel(status: TicketStatus) {
  return status
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function priorityClass(
  priority: RequestedPriority | ITPriority | null
) {
  if (priority === "Urgent") {
    return "bg-danger-subtle text-danger-emphasis";
  }

  if (priority === "High") {
    return "bg-warning-subtle text-warning-emphasis";
  }

  if (priority === "Medium") {
    return "bg-info-subtle text-info-emphasis";
  }

  return "bg-success-subtle text-success-emphasis";
}

export default function StaffQueue({
  onSelectTicket,
}: StaffQueueProps) {
  const [tickets, setTickets] = useState<
    StaffTicketListItem[]
  >([]);
  const [meta, setMeta] = useState<StaffTicketMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<
    RelatedSystem[]
  >([]);
  const [assignees, setAssignees] = useState<StaffAssignee[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [search, setSearch] = useState("");
  const [requester, setRequester] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState<
    RequestedPriority | ""
  >("");
  const [itPriority, setITPriority] = useState<ITPriority | "">(
    ""
  );
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [sort, setSort] = useState<
    | "ticketNo"
    | "createdAt"
    | "updatedAt"
    | "requestedPriority"
    | "itPriority"
    | "status"
  >("updatedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  function currentQuery(page: number) {
    return {
      search: search || undefined,
      requester: requester || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      relatedSystemId: relatedSystemId || undefined,
      requestedPriority: requestedPriority || undefined,
      itPriority: itPriority || undefined,
      status: status || undefined,
      assignedToUserId: assignedToUserId || undefined,
      sort,
      order,
      page,
      pageSize: 10,
    };
  }

  async function loadQueue(
    page = 1,
    query: StaffTicketQuery = currentQuery(page)
  ) {
    try {
      setLoading(true);
      setErrorMessage("");
      setForbidden(false);

      const result = await getStaffTickets(query);
      setTickets(result.data);
      setMeta(result.meta);
    } catch (error) {
      setTickets([]);
      setMeta({
        page,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      });

      if (
        error instanceof ApiRequestError &&
        error.status === 403
      ) {
        setForbidden(true);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the staff queue."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [nextCategories, nextSystems, nextAssignees] =
          await Promise.all([
            getActiveCategories(),
            getRelatedSystems(),
            getStaffAssignees(),
          ]);

        if (!cancelled) {
          setCategories(nextCategories);
          setRelatedSystems(nextSystems);
          setAssignees(nextAssignees);
        }
      } catch (error) {
        if (!cancelled) {
          if (
            error instanceof ApiRequestError &&
            error.status === 403
          ) {
            setForbidden(true);
          } else {
            setErrorMessage("Unable to load queue filters.");
          }
        }
      }
    }

    loadOptions();
    loadQueue();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadQueue(1);
  }

  function handleClear() {
    setSearch("");
    setRequester("");
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("");
    setITPriority("");
    setStatus("");
    setAssignedToUserId("");
    setSort("updatedAt");
    setOrder("desc");

    void loadQueue(1, {
      sort: "updatedAt",
      order: "desc",
      page: 1,
      pageSize: 10,
    });
  }

  const hasActiveFilters = Boolean(
    search ||
      requester ||
      categoryId ||
      relatedSystemId ||
      requestedPriority ||
      itPriority ||
      status ||
      assignedToUserId
  );

  return (
    <section aria-labelledby="staff-queue-title">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h2 id="staff-queue-title" className="h4 mb-1">
            Staff Queue
          </h2>
          <p className="text-muted mb-0">
            Find, prioritize, and manage incoming work.
          </p>
        </div>

        {!loading && !errorMessage && !forbidden && (
          <span className="text-muted">
            {meta.totalItems} Ticket
            {meta.totalItems === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <form
        className="zen-section p-3 mb-4"
        onSubmit={handleApply}
      >
        <div className="row g-3">
          <div className="col-lg-4">
            <label htmlFor="staff-search" className="form-label">
              Search
            </label>
            <input
              id="staff-search"
              className="form-control"
              value={search}
              placeholder="Ticket number, summary, requester"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="col-md-6 col-lg-3">
            <label htmlFor="staff-requester" className="form-label">
              Requester
            </label>
            <input
              id="staff-requester"
              className="form-control"
              value={requester}
              placeholder="Name or email"
              onChange={(event) => setRequester(event.target.value)}
            />
          </div>

          <div className="col-md-6 col-lg-2">
            <label htmlFor="staff-category" className="form-label">
              Category
            </label>
            <select
              id="staff-category"
              className="form-select"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 col-lg-3">
            <label htmlFor="staff-system" className="form-label">
              Related System
            </label>
            <select
              id="staff-system"
              className="form-select"
              value={relatedSystemId}
              onChange={(event) => setRelatedSystemId(event.target.value)}
            >
              <option value="">All</option>
              {relatedSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 col-lg-2">
            <label htmlFor="staff-requested-priority" className="form-label">
              Requested Priority
            </label>
            <select
              id="staff-requested-priority"
              className="form-select"
              value={requestedPriority}
              onChange={(event) =>
                setRequestedPriority(
                  event.target.value as RequestedPriority | ""
                )
              }
            >
              <option value="">All</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 col-lg-2">
            <label htmlFor="staff-it-priority" className="form-label">
              IT Priority
            </label>
            <select
              id="staff-it-priority"
              className="form-select"
              value={itPriority}
              onChange={(event) =>
                setITPriority(event.target.value as ITPriority | "")
              }
            >
              <option value="">All</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 col-lg-2">
            <label htmlFor="staff-status" className="form-label">
              Status
            </label>
            <select
              id="staff-status"
              className="form-select"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TicketStatus | "")
              }
            >
              <option value="">All</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 col-lg-3">
            <label htmlFor="staff-assignee" className="form-label">
              Assignee
            </label>
            <select
              id="staff-assignee"
              className="form-select"
              value={assignedToUserId}
              onChange={(event) => setAssignedToUserId(event.target.value)}
            >
              <option value="">All</option>
              <option value="unassigned">Unassigned</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 col-lg-3">
            <label htmlFor="staff-sort" className="form-label">
              Sort By
            </label>
            <select
              id="staff-sort"
              className="form-select"
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value as typeof sort
                )
              }
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Created Date</option>
              <option value="ticketNo">Ticket Number</option>
              <option value="requestedPriority">Requested Priority</option>
              <option value="itPriority">IT Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="col-md-6 col-lg-2">
            <label htmlFor="staff-order" className="form-label">
              Order
            </label>
            <select
              id="staff-order"
              className="form-select"
              value={order}
              onChange={(event) =>
                setOrder(event.target.value as "asc" | "desc")
              }
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="col-12 d-flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              Apply Filters
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={loading}
              onClick={handleClear}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </form>

      {loading && (
        <div className="alert alert-light border text-center py-4" role="status">
          <span
            className="spinner-border spinner-border-sm text-success me-2"
            aria-hidden="true"
          />
          Loading staff queue...
        </div>
      )}

      {!loading && forbidden && (
        <div className="alert alert-danger" role="alert">
          You are not allowed to use the staff queue.
        </div>
      )}

      {!loading && !forbidden && errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {!loading && !forbidden && !errorMessage && tickets.length === 0 && (
        <div className="alert alert-light border text-center py-4">
          <h3 className="h6 mb-2">
            {hasActiveFilters ? "No matching Tickets." : "Queue is empty."}
          </h3>
          <p className="text-muted mb-0">
            {hasActiveFilters
              ? "No Tickets match the current search or filters."
              : "There are no Tickets ready for staff review."}
          </p>
        </div>
      )}

      {!loading && !forbidden && !errorMessage && tickets.length > 0 && (
        <>
          <div className="table-responsive zen-section">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th scope="col">Ticket</th>
                  <th scope="col">Requester</th>
                  <th scope="col">Category</th>
                  <th scope="col">Related System</th>
                  <th scope="col">Requested</th>
                  <th scope="col">IT Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col">Assignee</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-link p-0 fw-bold text-decoration-none"
                        onClick={() => onSelectTicket(ticket.id)}
                      >
                        {ticket.ticketNo}
                      </button>
                      <div className="small text-muted text-break">
                        {ticket.summary}
                      </div>
                    </td>
                    <td>
                      <div>{ticket.requester.displayName}</div>
                      <div className="small text-muted text-break">
                        {ticket.requester.email}
                      </div>
                    </td>
                    <td>{ticket.category.name}</td>
                    <td>{ticket.relatedSystem.name}</td>
                    <td>
                      <span className={`badge ${priorityClass(ticket.requestedPriority)}`}>
                        {ticket.requestedPriority}
                      </span>
                    </td>
                    <td>
                      {ticket.itPriority ? (
                        <span className={`badge ${priorityClass(ticket.itPriority)}`}>
                          {ticket.itPriority}
                        </span>
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success-emphasis">
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td>{ticket.assignedTo?.displayName ?? "Unassigned"}</td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(ticket.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mt-3">
            <span className="text-muted">
              Page {meta.page} of {meta.totalPages} · {meta.totalItems} Ticket
              {meta.totalItems === 1 ? "" : "s"}
            </span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-success"
                disabled={meta.page <= 1}
                onClick={() => void loadQueue(meta.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline-success"
                disabled={meta.page >= meta.totalPages}
                onClick={() => void loadQueue(meta.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
