import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyTickets from "../../src/components/MyTickets.js";
import * as api from "../../src/api.js";

describe("MyTickets", () => {
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
    summary: "Unable to connect to campus VPN",
    category: {
      id: 4,
      name: "Network",
    },
    relatedSystem: {
      id: "system-1",
      name: "Campus Wi-Fi",
    },
    requestedPriority: "Urgent" as const,
    status: "New" as const,
    createdAt: "2026-09-05T01:32:22.000Z",
    updatedAt: "2026-09-05T01:32:22.000Z",
  };

  it("loads and displays the selected Requester's Tickets", async () => {
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([
      { id: 4, name: "Network" },
    ]);

    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
      { id: "system-1", name: "Campus Wi-Fi" },
    ]);

    vi.spyOn(api, "getMyTickets").mockResolvedValue({
      data: [ticket],
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    render(<MyTickets requester={requester} />);

    expect(
      await screen.findByText("TKT-2026-00004")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Unable to connect to campus VPN")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Network").length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Campus Wi-Fi").length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Urgent").length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("New").length
    ).toBeGreaterThan(0);
  });

  it("shows an empty state when no Tickets exist", async () => {
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([]);

    vi.spyOn(api, "getMyTickets").mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
    });

    render(<MyTickets requester={requester} />);

    expect(
      await screen.findByText("No Tickets found.")
    ).toBeInTheDocument();
  });

  it("applies search and filters", async () => {
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([
      { id: 4, name: "Network" },
    ]);

    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
      { id: "system-1", name: "Campus Wi-Fi" },
    ]);

    const getMyTicketsMock = vi
      .spyOn(api, "getMyTickets")
      .mockResolvedValue({
        data: [ticket],
        meta: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });

    const user = userEvent.setup();

    render(<MyTickets requester={requester} />);

    await screen.findByText("TKT-2026-00004");

    await user.type(
      screen.getByLabelText("Search"),
      "vpn"
    );

    await user.selectOptions(
      screen.getByLabelText("Category"),
      "4"
    );

    await user.selectOptions(
      screen.getByLabelText("Priority"),
      "Urgent"
    );

    await user.click(
      screen.getByRole("button", { name: "Apply" })
    );

    expect(getMyTicketsMock).toHaveBeenLastCalledWith(
      requester.id,
      expect.objectContaining({
        search: "vpn",
        categoryId: 4,
        requestedPriority: "Urgent",
        page: 1,
      })
    );
  });

  it("shows a safe error when the Ticket API fails", async () => {
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([]);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([]);

    vi.spyOn(api, "getMyTickets").mockRejectedValue(
      new Error("API failed")
    );

    render(<MyTickets requester={requester} />);

    expect(
      await screen.findByText(
        "Unable to load your Tickets. Please try again."
      )
    ).toBeInTheDocument();
  });
});