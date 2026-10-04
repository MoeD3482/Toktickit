import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffQueue from "../../src/components/StaffQueue.js";
import * as api from "../../src/api.js";

const ticket = {
  id: "staff-ticket-1",
  ticketNo: "TKT-2026-00042",
  summary: "VPN access needs investigation",
  requester: {
    id: "requester-1",
    displayName: "Anan Chaiyasit",
    email: "anan@example.com",
  },
  category: { id: 1, name: "Network" },
  relatedSystem: { id: "system-1", name: "Campus VPN" },
  requestedPriority: "High" as const,
  itPriority: "Urgent" as const,
  status: "InProgress" as const,
  assignedTo: { id: "staff-1", displayName: "IT Staff User" },
  createdAt: "2026-09-18T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
};

function mockQueue(data = [ticket]) {
  vi.spyOn(api, "getActiveCategories").mockResolvedValue([
    { id: 1, name: "Network" },
  ]);
  vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
    { id: "system-1", name: "Campus VPN" },
  ]);
  vi.spyOn(api, "getStaffAssignees").mockResolvedValue([
    { id: "staff-1", displayName: "IT Staff User" },
  ]);
  return vi.spyOn(api, "getStaffTickets").mockResolvedValue({
    data,
    meta: {
      page: 1,
      pageSize: 10,
      totalItems: data.length,
      totalPages: data.length ? 1 : 0,
    },
  });
}

describe("StaffQueue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the queue, all staff filters, and a ticket detail action", async () => {
    mockQueue();
    const onSelectTicket = vi.fn();
    const user = userEvent.setup();

    render(<StaffQueue onSelectTicket={onSelectTicket} />);

    expect(await screen.findByText(ticket.ticketNo)).toBeInTheDocument();
    expect(screen.getByLabelText("Requester")).toBeInTheDocument();
    expect(screen.getByLabelText("IT Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Assignee")).toBeInTheDocument();
    expect(screen.getByText("Anan Chaiyasit")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: ticket.ticketNo })
    );

    expect(onSelectTicket).toHaveBeenCalledWith(ticket.id);
  });

  it("sends search and filter values to the queue API", async () => {
    const getStaffTickets = mockQueue();
    const user = userEvent.setup();

    render(<StaffQueue onSelectTicket={vi.fn()} />);
    await screen.findByText(ticket.ticketNo);

    await user.type(screen.getByLabelText("Search"), "vpn");
    await user.type(screen.getByLabelText("Requester"), "anan");
    await user.selectOptions(screen.getByLabelText("Category"), "1");
    await user.selectOptions(screen.getByLabelText("IT Priority"), "Urgent");
    await user.selectOptions(screen.getByLabelText("Assignee"), "staff-1");
    await user.click(
      screen.getByRole("button", { name: "Apply Filters" })
    );

    expect(getStaffTickets).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: "vpn",
        requester: "anan",
        categoryId: 1,
        itPriority: "Urgent",
        assignedToUserId: "staff-1",
        page: 1,
      })
    );
  });

  it("distinguishes no-results and forbidden states", async () => {
    mockQueue([]);
    const { unmount } = render(<StaffQueue onSelectTicket={vi.fn()} />);

    expect(await screen.findByText("Queue is empty.")).toBeInTheDocument();
    unmount();
    vi.restoreAllMocks();

    vi.spyOn(api, "getActiveCategories").mockResolvedValue([]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([]);
    vi.spyOn(api, "getStaffAssignees").mockRejectedValue(
      new api.ApiRequestError(403, "Forbidden")
    );
    vi.spyOn(api, "getStaffTickets").mockRejectedValue(
      new api.ApiRequestError(403, "Forbidden")
    );

    render(<StaffQueue onSelectTicket={vi.fn()} />);

    expect(
      await screen.findByText("You are not allowed to use the staff queue.")
    ).toBeInTheDocument();
  });
});
