import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequesterTicketDetail from "../../src/components/RequesterTicketDetail.js";
import * as api from "../../src/api.js";

describe("RequesterTicketDetail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const requester = {
    id: "requester-1",
    displayName: "Anan Chaiyasit",
    email: "anan.chaiyasit@example.com",
  };

  const ticket = {
    id: "ticket-1",
    ticketNo: "TKT-2026-00004",

    requester: {
      id: "requester-1",
      displayName: "Anan Chaiyasit",
    },

    category: {
      id: 4,
      name: "Network",
    },

    relatedSystem: {
      id: "system-1",
      name: "Campus Wi-Fi",
    },

    summary: "Unable to connect to campus VPN",
    description:
      "The VPN client fails to connect from my laptop while using campus Wi-Fi.",
    requestedPriority: "Urgent" as const,
    status: "New" as const,
    createdAt: "2026-09-05T01:32:22.000Z",
    updatedAt: "2026-09-05T01:32:22.000Z",
  };

  it("loads and displays Ticket detail", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(ticket);

    render(
      <RequesterTicketDetail
        requester={requester}
        ticketId="ticket-1"
        onBack={() => {}}
      />
    );

    expect(
      await screen.findByDisplayValue("TKT-2026-00004")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Anan Chaiyasit")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Network")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Campus Wi-Fi")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Urgent")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("New")
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "Unable to connect to campus VPN"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue(
        "The VPN client fails to connect from my laptop while using campus Wi-Fi."
      )
    ).toBeInTheDocument();
  });

  it("shows a safe error when Ticket detail fails to load", async () => {
    vi.spyOn(api, "getTicketDetail").mockRejectedValue(
      new Error("API failed")
    );

    render(
      <RequesterTicketDetail
        requester={requester}
        ticketId="ticket-1"
        onBack={() => {}}
      />
    );

    expect(
      await screen.findByText(
        "Unable to load Ticket detail. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("returns to My Tickets when Back is selected", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(ticket);

    const onBack = vi.fn();
    const user = userEvent.setup();

    render(
      <RequesterTicketDetail
        requester={requester}
        ticketId="ticket-1"
        onBack={onBack}
      />
    );

    await screen.findByDisplayValue("TKT-2026-00004");

    await user.click(
      screen.getByRole("button", {
        name: "Back to My Tickets",
      })
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});