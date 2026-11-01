
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionsTakenSection from "../../src/components/ActionsTakenSection.js";
import * as api from "../../src/api.js";

const action = {
  id: "action-1",
  ticketId: "ticket-1",
  performedByUserId: "staff-1",
  actionAt: "2026-10-29T08:30:00.000Z",
  description: "Checked the network configuration.",
  result: "Network connection restored.",
  followUpRequired: true,
  followUpNote: "Monitor the connection tomorrow.",
  attachmentNotes: "Network diagnostic report attached.",
  createdAt: "2026-10-29T08:30:00.000Z",
  updatedAt: "2026-10-29T08:30:00.000Z",
  performedBy: {
    id: "staff-1",
    displayName: "IT Staff User",
  },
};

describe("ActionsTakenSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays Actions Taken and all recorded information", async () => {
    vi.spyOn(api, "getTicketActionsTaken")
      .mockResolvedValue([action]);

    render(
      <ActionsTakenSection
        ticketId="ticket-1"
        editable={false}
      />
    );

    expect(
      await screen.findByText("Checked the network configuration.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Network connection restored.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("IT Staff User")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Monitor the connection tomorrow.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Network diagnostic report attached.")
    ).toBeInTheDocument();
  });

  it("shows an empty state when no Actions Taken exist", async () => {
    vi.spyOn(api, "getTicketActionsTaken")
      .mockResolvedValue([]);

    render(
      <ActionsTakenSection
        ticketId="ticket-1"
        editable={false}
      />
    );

    expect(
      await screen.findByText(
        "No Actions Taken have been recorded."
      )
    ).toBeInTheDocument();
  });

  it("keeps the Requester view read-only", async () => {
    vi.spyOn(api, "getTicketActionsTaken")
      .mockResolvedValue([action]);

    render(
      <ActionsTakenSection
        ticketId="ticket-1"
        editable={false}
      />
    );

    await screen.findByText(action.description);

    expect(
      screen.queryByRole("button", {
        name: "Add Action Taken",
      })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Edit",
      })
    ).not.toBeInTheDocument();
  });

  it("allows IT Staff to create an Action Taken", async () => {
    const user = userEvent.setup();

    vi.spyOn(api, "getTicketActionsTaken")
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([action]);

    const createAction = vi
      .spyOn(api, "createTicketActionTaken")
      .mockResolvedValue(action);

    render(
      <ActionsTakenSection
        ticketId="ticket-1"
        editable={true}
      />
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Add Action Taken",
      })
    );

    await user.clear(
      screen.getByLabelText("Action Description")
    );
    await user.type(
      screen.getByLabelText("Action Description"),
      action.description
    );

    await user.type(
      screen.getByLabelText("Result"),
      action.result
    );

    await user.click(
      screen.getByLabelText("Follow-Up Required")
    );

    await user.type(
      screen.getByLabelText(/Follow-up Note/),
      action.followUpNote!
    );

    await user.type(
      screen.getByLabelText("Attachment Notes"),
      action.attachmentNotes!
    );

    await user.click(
      screen.getByRole("button", {
        name: "Record Action",
      })
    );

    expect(createAction).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({
        description: action.description,
        result: action.result,
        followUpRequired: true,
        followUpNote: action.followUpNote,
        attachmentNotes: action.attachmentNotes,
      }),
      expect.any(String)
    );

    expect(
      await screen.findByText(
        "Action Taken recorded successfully."
      )
    ).toBeInTheDocument();
  });

  it("preserves form values when creating an Action Taken fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(api, "getTicketActionsTaken")
      .mockResolvedValue([]);

    vi.spyOn(api, "createTicketActionTaken")
      .mockRejectedValue(new Error("Network error"));

    render(
      <ActionsTakenSection
        ticketId="ticket-1"
        editable={true}
      />
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Add Action Taken",
      })
    );

    await user.type(
      screen.getByLabelText("Action Description"),
      "Investigated the network issue."
    );

    await user.type(
      screen.getByLabelText("Result"),
      "Issue still exists."
    );

    await user.click(
      screen.getByRole("button", {
        name: "Record Action",
      })
    );

    expect(
      await screen.findByText("Network error")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Action Description")
    ).toHaveValue("Investigated the network issue.");

    expect(
      screen.getByLabelText("Result")
    ).toHaveValue("Issue still exists.");
  });
});
