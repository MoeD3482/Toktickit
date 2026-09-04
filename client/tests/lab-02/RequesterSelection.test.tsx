import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequesterSelection from "../../src/components/RequesterSelection.js";
import * as api from "../../src/api.js";

describe("RequesterSelection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads active Development Requesters and enables Continue after selection", async () => {
    vi.spyOn(api, "getDevelopmentRequesters").mockResolvedValue([
      {
        id: "requester-1",
        displayName: "Anan Chaiyasit",
        email: "anan.chaiyasit@example.com",
      },
      {
        id: "requester-2",
        displayName: "Narin Kittipong",
        email: "narin.kittipong@example.com",
      },
    ]);

    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<RequesterSelection onSelect={onSelect} />);

    const dropdown = await screen.findByLabelText(
      "Development Requester"
    );

    const continueButton = screen.getByRole("button", {
      name: "Continue",
    });

    expect(continueButton).toBeDisabled();

    await user.selectOptions(dropdown, "requester-1");

    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    expect(onSelect).toHaveBeenCalledWith({
      id: "requester-1",
      displayName: "Anan Chaiyasit",
      email: "anan.chaiyasit@example.com",
    });
  });

  it("shows an empty state when no active Requesters exist", async () => {
    vi.spyOn(api, "getDevelopmentRequesters").mockResolvedValue([]);

    render(<RequesterSelection onSelect={vi.fn()} />);

    expect(
      await screen.findByText(
        "No active Development Requesters are available."
      )
    ).toBeInTheDocument();
  });

  it("shows a safe error when the Requester API fails", async () => {
    vi.spyOn(api, "getDevelopmentRequesters").mockRejectedValue(
      new Error("API failed")
    );

    render(<RequesterSelection onSelect={vi.fn()} />);

    expect(
      await screen.findByText(
        "Unable to load Development Requesters. Please try again."
      )
    ).toBeInTheDocument();
  });
});