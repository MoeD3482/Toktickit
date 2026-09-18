import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the TokTickIT login heading when no session exists", async () => {
    vi.spyOn(api, "getCurrentUser").mockRejectedValue(
      new Error("Authentication required")
    );

    render(<App />);

    expect(await screen.findByText(/TokTickIT/i)).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to continue")
    ).toBeInTheDocument();
  });

  it("shows the authenticated requester shell when a session exists", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue({
      id: "requester-1",
      displayName: "Anan Chaiyasit",
      email: "anan.chaiyasit@example.com",
      roles: ["Requester"],
      isActive: true,
      passwordState: "Active",
    });

    render(<App />);

    expect(
      await screen.findByText("Anan Chaiyasit")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign Out" })
    ).toBeInTheDocument();
  });

  it("shows the change-password screen when required", async () => {
    vi.spyOn(api, "getCurrentUser").mockResolvedValue({
      id: "requester-1",
      displayName: "Anan Chaiyasit",
      email: "anan.chaiyasit@example.com",
      roles: ["Requester"],
      isActive: true,
      passwordState: "ChangeRequired",
    });

    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: "Change Password",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/change your temporary password/i)
    ).toBeInTheDocument();
  });
});
