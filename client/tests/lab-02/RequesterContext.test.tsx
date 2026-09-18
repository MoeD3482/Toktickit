import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("Development Requester context", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the authenticated Requester and allows signing out", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue({
      id: "requester-1",
      displayName: "Anan Chaiyasit",
      email: "anan.chaiyasit@example.com",
      roles: ["Requester"],
      isActive: true,
      passwordState: "Active",
    });

    vi.spyOn(api, "logout").mockResolvedValue();

    const user = userEvent.setup();

    render(<App />);

    expect(
      await screen.findByText(/Current user:/)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Anan Chaiyasit")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Sign Out" })
    );

    expect(
      await screen.findByText("Sign in to continue")
    ).toBeInTheDocument();
  });
});
