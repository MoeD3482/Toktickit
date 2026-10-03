import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";

const ticket = {
  id: "staff-ticket-1",
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
  internalNotes: [
    {
      id: "note-1",
      ticketId: "staff-ticket-1",
      body: "Check account sync records.",
      visibility: "Internal" as const,
      author: { id: "staff-1", displayName: "IT Staff User" },
      createdAt: "2026-09-19T00:00:00.000Z",
      updatedAt: "2026-09-19T00:00:00.000Z",
    },
  ],
  actions: [],
};

function mockDetail() {
  vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue(ticket);
  vi.spyOn(api, "getStaffAssignees").mockResolvedValue([
    { id: "staff-1", displayName: "IT Staff User" },
  ]);
}

describe("StaffTicketDetail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows staff-only controls, histories, and only permitted status transitions", async () => {
    mockDetail();

    render(<StaffTicketDetail ticketId={ticket.id} onBack={vi.fn()} />);

    expect(await screen.findByText(ticket.ticketNo)).toBeInTheDocument();
    expect(screen.getByText("Staff Controls")).toBeInTheDocument();
    expect(screen.getByText("Internal Notes")).toBeInTheDocument();
    expect(screen.getByText("Check account sync records.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim Ticket" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Cancelled" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Resolved" })).not.toBeInTheDocument();
  });

  it("saves IT Priority and records a public comment without discarding the note history", async () => {
    mockDetail();
    const updatePriority = vi
      .spyOn(api, "updateStaffITPriority")
      .mockResolvedValue({ id: ticket.id, itPriority: "Urgent" });
    const addComment = vi
      .spyOn(api, "addPublicComment")
      .mockResolvedValue({
        id: "comment-1",
        ticketId: ticket.id,
        body: "We are checking the VPN connection.",
        visibility: "Public",
        author: { id: "staff-1", displayName: "IT Staff User" },
        createdAt: "2026-09-19T00:00:00.000Z",
        updatedAt: "2026-09-19T00:00:00.000Z",
      });
    const user = userEvent.setup();

    render(<StaffTicketDetail ticketId={ticket.id} onBack={vi.fn()} />);
    await screen.findByText(ticket.ticketNo);

    await user.selectOptions(screen.getByLabelText("IT Priority"), "Urgent");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updatePriority).toHaveBeenCalledWith(ticket.id, "Urgent");

    await user.type(
      screen.getByLabelText("Add public comment"),
      "We are checking the VPN connection."
    );
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(addComment).toHaveBeenCalledWith(
      ticket.id,
      "We are checking the VPN connection."
    );
    expect(screen.getByText("Check account sync records.")).toBeInTheDocument();
  });
});
