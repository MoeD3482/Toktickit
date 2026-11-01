
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";

const ticket = {
  id: "workflow-ticket-1",
  ticketNo: "TKT-2026-00042",
  summary: "VPN access needs investigation",
  description: "Test ticket description",
  requester: {
    id: "requester-1",
    displayName: "Anan Chaiyasit",
    email: "anan@example.com",
  },
  category: { id: 1, name: "Network" },
  relatedSystem: { id: "system-1", name: "Campus VPN" },
  requestedPriority: "High" as const,
  itPriority: null,
  status: "New" as const,
  assignedTo: null,
  createdAt: "2026-09-18T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
  attachments: [],
  comments: [],
  internalNotes: [],
  actions: [],
};

function mockDetail(
  currentTicket: typeof ticket = ticket,
) {
  vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue(
    currentTicket,
  );

  vi.spyOn(api, "getStaffAssignees").mockResolvedValue([
    { id: "staff-1", displayName: "IT Staff User" },
  ]);

  vi.spyOn(api, "getTicketActionsTaken").mockResolvedValue([]);
}

const workflowCases = [
  {
    current: "New",
    allowed: ["Open", "Cancelled"],
  },
  {
    current: "Open",
    allowed: ["In Progress", "Cancelled"],
  },
  {
    current: "InProgress",
    allowed: ["Waiting For Requester", "Resolved", "Cancelled"],
  },
  {
    current: "WaitingForRequester",
    allowed: ["Open", "In Progress", "Cancelled"],
  },
  {
    current: "Resolved",
    allowed: ["Closed", "Reopened"],
  },
  {
    current: "Closed",
    allowed: ["Reopened"],
  },
  {
    current: "Reopened",
    allowed: ["Open", "In Progress", "Cancelled"],
  },
  {
    current: "Cancelled",
    allowed: [],
  },
] as const;

describe("TicketWorkflow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(workflowCases)(
    "shows only permitted transitions from $current",
    async ({ current, allowed }) => {
      const currentTicket = {
        ...ticket,
        status: current,
      } as typeof ticket;

      mockDetail(currentTicket);

      render(
        <StaffTicketDetail
          ticketId={ticket.id}
          onBack={vi.fn()}
        />,
      );

      await screen.findByText(ticket.ticketNo);

      const statusSelect = screen.getByLabelText("Next Status");

      for (const status of allowed) {
        expect(
          screen.getByRole("option", { name: status }),
        ).toBeInTheDocument();
      }


      if (allowed.length === 0) {
        expect(statusSelect).toHaveValue("");
        expect(
          screen.getByRole("option", {
            name: "No permitted transition",
          }),
        ).toBeInTheDocument();

        expect(
          screen.getByRole("button", {
            name: "Update Status",
          }),
        ).toBeDisabled();
      } else {
        expect(statusSelect).toBeEnabled();
      }
    },
  );

  it("submits a permitted transition with its reason and current timestamp", async () => {
    const updatedAt = "2026-09-20T10:00:00.000Z";

    const updatedTicket = {
      ...ticket,
      status: "Open" as const,
      updatedAt,
    };

    vi.spyOn(api, "getStaffTicketDetail")
      .mockResolvedValueOnce(ticket)
      .mockResolvedValueOnce(updatedTicket);

    vi.spyOn(api, "getStaffAssignees").mockResolvedValue([
      { id: "staff-1", displayName: "IT Staff User" },
    ]);

    const updateStatus = vi
      .spyOn(api, "updateStaffStatus")
      .mockResolvedValue(undefined as never);

    const user = userEvent.setup();

    render(
      <StaffTicketDetail
        ticketId={ticket.id}
        onBack={vi.fn()}
      />,
    );

    await screen.findByText(ticket.ticketNo);

    await user.selectOptions(
      screen.getByLabelText("Next Status"),
      "Open",
    );

    await user.type(
      screen.getByLabelText("Transition note"),
      "Initial investigation started.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Update Status",
      }),
    );

    expect(updateStatus).toHaveBeenCalledWith(
      ticket.id,
      "Open",
      "Initial investigation started.",
      ticket.updatedAt,
    );

    expect(
      await screen.findByText("Status updated."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Open", { selector: ".badge" }),
    ).toBeInTheDocument();
  });

  it("shows a safe error and preserves the selected transition after a conflict", async () => {
    mockDetail();

    vi.spyOn(api, "updateStaffStatus").mockRejectedValue(
      new Error(
        "This Ticket has changed. Refresh the details and try again.",
      ),
    );

    const user = userEvent.setup();

    render(
      <StaffTicketDetail
        ticketId={ticket.id}
        onBack={vi.fn()}
      />,
    );

    await screen.findByText(ticket.ticketNo);

    await user.selectOptions(
      screen.getByLabelText("Next Status"),
      "Open",
    );

    await user.type(
      screen.getByLabelText("Transition note"),
      "Please review this update.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Update Status",
      }),
    );

  expect(
  await screen.findByText(
    "This Ticket has changed. Refresh the details and try again.",
  ),
).toBeInTheDocument();

    expect(screen.getByLabelText("Next Status")).toHaveValue("Open");

    expect(screen.getByLabelText("Transition note")).toHaveValue(
      "Please review this update.",
    );
  });
});
