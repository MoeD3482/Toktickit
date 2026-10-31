import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";

const dashboard = {
  openTicketCount: 4,
  waitingForRequesterCount: 1,
  recentlyUpdatedCount: 2,
  recentlyResolvedCount: 3,
  recentTickets: [
    {
      id: "recent-ticket",
      ticketNo: "TKT-2026-00021",
      summary: "VPN needs a status update",
      requestedPriority: "High" as const,
      status: "Open" as const,
      updatedAt: "2026-10-30T08:30:00.000Z",
    },
  ],
  attentionRequiredTickets: [
    {
      id: "attention-ticket",
      ticketNo: "TKT-2026-00022",
      summary: "Please confirm the replacement device",
      requestedPriority: "Medium" as const,
      status: "WaitingForRequester" as const,
      updatedAt: "2026-10-30T07:30:00.000Z",
    },
  ],
};

describe("RequesterDashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders backend metrics, concise Ticket lists, and accessible Ticket links", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(dashboard);

    render(
      <RequesterDashboard
        onShowTickets={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Requester Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("Waiting for You")).toBeInTheDocument();
    expect(screen.getAllByText("4")).toHaveLength(1);
    expect(screen.getByText("TKT-2026-00021")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-00022")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Open Ticket TKT-2026-00021: VPN needs a status update",
      }),
    ).toBeInTheDocument();
  });

  it("sends each metric card to the matching filtered Ticket list and opens Ticket Detail", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(dashboard);
    const onShowTickets = vi.fn();
    const onSelectTicket = vi.fn();
    const user = userEvent.setup();

    render(
      <RequesterDashboard
        onShowTickets={onShowTickets}
        onSelectTicket={onSelectTicket}
      />,
    );

    await screen.findByText("Open Tickets");
    await user.click(screen.getByRole("button", { name: "View open Tickets: 4" }));
    expect(onShowTickets).toHaveBeenLastCalledWith(
      {
        status: [
          "New",
          "Open",
          "InProgress",
          "WaitingForRequester",
          "Reopened",
        ],
      },
      "open Tickets",
    );

    await user.click(screen.getByRole("button", { name: "View recently resolved Tickets: 3" }));
    expect(onShowTickets).toHaveBeenLastCalledWith(
      {
        status: ["Resolved", "Closed"],
        updatedWithinDays: 30,
      },
      "recently resolved Tickets",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Open Ticket TKT-2026-00022: Please confirm the replacement device",
      }),
    );
    expect(onSelectTicket).toHaveBeenCalledWith("attention-ticket");
  });

  it("shows the loading, empty, and safe error states", async () => {
    let resolveDashboard: ((value: typeof dashboard) => void) | undefined;
    vi.spyOn(api, "getRequesterDashboard").mockReturnValue(
      new Promise((resolve) => {
        resolveDashboard = resolve;
      }),
    );

    const { unmount } = render(
      <RequesterDashboard
        onShowTickets={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading Requester Dashboard...")).toBeInTheDocument();

    resolveDashboard?.({
      ...dashboard,
      openTicketCount: 0,
      waitingForRequesterCount: 0,
      recentlyUpdatedCount: 0,
      recentlyResolvedCount: 0,
      recentTickets: [],
      attentionRequiredTickets: [],
    });

    expect(await screen.findByText("No Tickets to show yet. Create a Ticket when you need help.")).toBeInTheDocument();
    expect(screen.getByText("No Tickets have been updated in the last 30 days.")).toBeInTheDocument();
    unmount();

    vi.spyOn(api, "getRequesterDashboard").mockRejectedValue(
      new api.ApiRequestError(403, "Forbidden"),
    );
    render(
      <RequesterDashboard
        onShowTickets={vi.fn()}
        onSelectTicket={vi.fn()}
      />,
    );
    expect(
      await screen.findByText("You are not allowed to view the Requester Dashboard."),
    ).toBeInTheDocument();
  });
});
