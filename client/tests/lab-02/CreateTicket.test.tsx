import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTicket from "../../src/components/CreateTicket.js";
import * as api from "../../src/api.js";

describe("CreateTicket", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const requester = {
    id: "requester-1",
    displayName: "Anan Chaiyasit",
    email: "anan.chaiyasit@example.com",
  };

  it("shows validation messages for an empty form", async () => {
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([
      { id: 4, name: "Network" },
    ]);

    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
      { id: "system-1", name: "VPN" },
    ]);

    const user = userEvent.setup();

    render(<CreateTicket requester={requester} />);

    const submitButton = await screen.findByRole("button", {
      name: "Submit Ticket",
    });

    await user.click(submitButton);

    expect(
      screen.getByText("Category is required.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Related System is required.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Requested Priority is required.")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Summary must contain between 5 and 120 characters."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Description must contain between 10 and 2000 characters."
      )
    ).toBeInTheDocument();
  });

  it("creates a Ticket and displays the official Ticket Number", async () => {
    vi.spyOn(api, "getActiveCategories").mockResolvedValue([
      { id: 4, name: "Network" },
    ]);

    vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
      { id: "system-1", name: "VPN" },
    ]);

    vi.spyOn(api, "createTicket").mockResolvedValue({
      id: "ticket-1",
      ticketNo: "TKT-2026-00001",
      requester: {
        id: requester.id,
        displayName: requester.displayName,
      },
      category: {
        id: 4,
        name: "Network",
      },
      relatedSystem: {
        id: "system-1",
        name: "VPN",
      },
      summary: "Unable to connect to campus VPN",
      description:
        "The VPN client fails to connect from my laptop while using campus Wi-Fi.",
      requestedPriority: "High",
      status: "New",
      createdAt: "2026-09-05T01:00:00.000Z",
      updatedAt: "2026-09-05T01:00:00.000Z",
    });

    const user = userEvent.setup();

    render(<CreateTicket requester={requester} />);

    await user.selectOptions(
      await screen.findByLabelText(/Category/),
      "4"
    );

    await user.selectOptions(
      screen.getByLabelText(/Related System/),
      "system-1"
    );

    await user.selectOptions(
      screen.getByLabelText(/Requested Priority/),
      "High"
    );

    await user.type(
      screen.getByLabelText(/Ticket Summary/),
      "Unable to connect to campus VPN"
    );

    await user.type(
      screen.getByLabelText(/Description/),
      "The VPN client fails to connect from my laptop while using campus Wi-Fi."
    );

    await user.click(
      screen.getByRole("button", { name: "Submit Ticket" })
    );

    expect(
      await screen.findByText("Ticket created successfully.")
    ).toBeInTheDocument();

    expect(
      screen.getAllByDisplayValue("TKT-2026-00001").length
    ).toBeGreaterThan(0);
  });
  it("keeps entered values when Ticket creation fails", async () => {
  vi.spyOn(api, "getActiveCategories").mockResolvedValue([
    { id: 4, name: "Network" },
  ]);

  vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
    { id: "system-1", name: "VPN" },
  ]);

  vi.spyOn(api, "createTicket").mockRejectedValue(
    new Error("Server unavailable")
  );

  const user = userEvent.setup();

  render(<CreateTicket requester={requester} />);

  const category = await screen.findByLabelText(/Category/);
  const relatedSystem = screen.getByLabelText(/Related System/);
  const priority = screen.getByLabelText(/Requested Priority/);
  const summary = screen.getByLabelText(/Ticket Summary/);
  const description = screen.getByLabelText(/Description/);

  await user.selectOptions(category, "4");
  await user.selectOptions(relatedSystem, "system-1");
  await user.selectOptions(priority, "High");

  await user.type(
    summary,
    "Unable to connect to campus VPN"
  );

  await user.type(
    description,
    "The VPN client fails to connect from my laptop while using campus Wi-Fi."
  );

  await user.click(
    screen.getByRole("button", { name: "Submit Ticket" })
  );

  expect(
    await screen.findByText(
      "Unable to create Ticket. Your entered information has been kept. Please try again."
    )
  ).toBeInTheDocument();

  expect(category).toHaveValue("4");
  expect(relatedSystem).toHaveValue("system-1");
  expect(priority).toHaveValue("High");

  expect(summary).toHaveValue(
    "Unable to connect to campus VPN"
  );

  expect(description).toHaveValue(
    "The VPN client fails to connect from my laptop while using campus Wi-Fi."
  );
});
});