
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StaffDashboard from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";

const dashboard = {
  unassignedTicketCount: 3,
  ownedByCurrentUserCount: 2,
  statusCounts: {
    New: 2,
    Open: 3,
    InProgress: 4,
    WaitingForRequester: 1,
    Reopened: 1,
  },
  priorityCounts: {
    Urgent: 1,
    High: 3,
    Medium: 2,
    Low: 1,
  },
  recentTickets: [
    {
      id: "recent-ticket",
      ticketNo: "TKT-2026-00031",
      summary: "VPN connection needs investigation",
      status: "InProgress" as const,
      itPriority: "High" as const,
      assignedToUserId: "staff-1",
      updatedAt: "2026-10-30T08:30:00.000Z",
    },
  ],
  urgentTickets: [
    {
      id: "urgent-ticket",
      ticketNo: "TKT-2026-00032",
      summary: "Production network is unavailable",
      status: "Open" as const,
      itPriority: "Urgent" as const,
      assignedToUserId: null,
      updatedAt: "2026-10-30T09:30:00.000Z",
    },
  ],
} as api.StaffDashboard;

describe("StaffDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders backend metrics, status counts, priority counts, and Ticket lists", async () => {
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(dashboard);

    render(
      <StaffDashboard
        currentUserId="staff-1"
        onShowQueue={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Staff Dashboard" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "View Unassigned Tickets: 3" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "View My Tickets: 2" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Tickets by Status")).toBeInTheDocument();
    expect(screen.getByText("Tickets by IT Priority")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /In Progress\s+4/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Urgent\s+1/ }),
    ).toBeInTheDocument();

    expect(screen.getByText("TKT-2026-00031")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-00032")).toBeInTheDocument();
  });

  it("drills down from metrics, statuses, and priorities to the correct queue filters", async () => {
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(dashboard);

    const onShowQueue = vi.fn();
    const user = userEvent.setup();

    render(
      <StaffDashboard
        currentUserId="staff-1"
        onShowQueue={onShowQueue}
        onSelectTicket={vi.fn()}
      />,
    );

    await screen.findByRole("heading", { name: "Staff Dashboard" });

    await user.click(
      screen.getByRole("button", { name: "View Unassigned Tickets: 3" }),
    );

    expect(onShowQueue).toHaveBeenLastCalledWith(
      { assignedToUserId: "unassigned" },
      "Unassigned Tickets",
    );

    await user.click(
      screen.getByRole("button", { name: "View My Tickets: 2" }),
    );

    expect(onShowQueue).toHaveBeenLastCalledWith(
      { assignedToUserId: "staff-1" },
      "My Tickets",
    );

    await user.click(
      screen.getByRole("button", { name: /In Progress\s+4/ }),
    );

    expect(onShowQueue).toHaveBeenLastCalledWith(
      { status: "InProgress" },
      "In Progress Tickets",
    );

    await user.click(
      screen.getByRole("button", { name: /Urgent\s+1/ }),
    );

    expect(onShowQueue).toHaveBeenLastCalledWith(
      { itPriority: "Urgent" },
      "Urgent Priority Tickets",
    );
  });

  it("opens the selected Ticket from recent and urgent lists", async () => {
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(dashboard);

    const onSelectTicket = vi.fn();
    const user = userEvent.setup();

    render(
      <StaffDashboard
        currentUserId="staff-1"
        onShowQueue={vi.fn()}
        onSelectTicket={onSelectTicket}
      />,
    );

    await screen.findByRole("heading", { name: "Staff Dashboard" });

    await user.click(
      screen.getByRole("button", {
        name: "Open Ticket TKT-2026-00031: VPN connection needs investigation",
      }),
    );

    expect(onSelectTicket).toHaveBeenCalledWith("recent-ticket");

    await user.click(
      screen.getByRole("button", {
        name: "Open Ticket TKT-2026-00032: Production network is unavailable",
      }),
    );

    expect(onSelectTicket).toHaveBeenLastCalledWith("urgent-ticket");
  });

  it("shows loading, empty, and safe error states", async () => {
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue({
      ...dashboard,
      unassignedTicketCount: 0,
      ownedByCurrentUserCount: 0,
      statusCounts: {},
      priorityCounts: {},
      recentTickets: [],
      urgentTickets: [],
    } as api.StaffDashboard);

    const { unmount } = render(
      <StaffDashboard
        currentUserId="staff-1"
        onShowQueue={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading Staff Dashboard...",
    );

    expect(
      await screen.findByText("No recently updated Tickets."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("No urgent Tickets at the moment."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "View Unassigned Tickets: 0" }),
    ).toBeInTheDocument();

    unmount();

    vi.spyOn(api, "getStaffDashboard").mockRejectedValue(
      new api.ApiRequestError(403, "Forbidden"),
    );

    render(
      <StaffDashboard
        currentUserId="staff-1"
        onShowQueue={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "You are not allowed to view the Staff Dashboard.",
    );
  });

  it("shows a safe message when the dashboard API fails unexpectedly", async () => {
    vi.spyOn(api, "getStaffDashboard").mockRejectedValue(
      new Error("Internal database details"),
    );

    render(
      <StaffDashboard
        currentUserId="staff-1"
        onShowQueue={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load the Staff Dashboard. Please try again.",
    );

    expect(
      screen.queryByText("Internal database details"),
    ).not.toBeInTheDocument();
  });
});
