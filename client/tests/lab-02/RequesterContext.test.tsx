import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Development Requester context", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the selected Requester and allows changing Requester", async () => {
    vi.spyOn(api, "getDevelopmentRequesters").mockResolvedValue([
      {
        id: "requester-1",
        displayName: "Anan Chaiyasit",
        email: "anan.chaiyasit@example.com",
      },
    ]);

    const user = userEvent.setup();

    render(<App />);

    const dropdown = await screen.findByLabelText(
      "Development Requester"
    );

    await user.selectOptions(dropdown, "requester-1");

    await user.click(
      screen.getByRole("button", { name: "Continue" })
    );

    expect(
      screen.getByText(/Requester:/)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Anan Chaiyasit")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Change Requester" })
    );

    expect(
      await screen.findByText("Development Requester Selection")
    ).toBeInTheDocument();
  });
});