import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../../src/components/Login.js";
import * as api from "../../src/api.js";

const user = {
  id: "user-1",
  displayName: "Anan Chaiyasit",
  email: "anan.chaiyasit@example.com",
  roles: ["Requester" as const],
  isActive: true,
  passwordState: "Active" as const,
};

describe("Login", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits credentials and returns the authenticated user", async () => {
    vi.spyOn(api, "login").mockResolvedValue(user);

    const onLogin = vi.fn();
    const testUser = userEvent.setup();

    render(<Login onLogin={onLogin} />);

    await testUser.type(
      screen.getByLabelText("Email"),
      "anan.chaiyasit@example.com"
    );
    await testUser.type(
      screen.getByLabelText("Password"),
      "CurrentPass123"
    );
    await testUser.click(
      screen.getByRole("button", { name: "Sign In" })
    );

    expect(api.login).toHaveBeenCalledWith(
      "anan.chaiyasit@example.com",
      "CurrentPass123"
    );
    expect(onLogin).toHaveBeenCalledWith(user);
  });

  it("shows a generic safe error when login fails", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new Error("INVALID_CREDENTIALS")
    );

    const testUser = userEvent.setup();

    render(<Login onLogin={vi.fn()} />);

    await testUser.type(
      screen.getByLabelText("Email"),
      "missing@example.com"
    );
    await testUser.type(
      screen.getByLabelText("Password"),
      "WrongPass123"
    );
    await testUser.click(
      screen.getByRole("button", { name: "Sign In" })
    );

    expect(
      await screen.findByText("Email or password is incorrect.")
    ).toBeInTheDocument();
  });

  it("validates missing credentials before calling the API", async () => {
    const loginSpy = vi.spyOn(api, "login");
    const testUser = userEvent.setup();

    render(<Login onLogin={vi.fn()} />);

    await testUser.click(
      screen.getByRole("button", { name: "Sign In" })
    );

    expect(loginSpy).not.toHaveBeenCalled();
    expect(
      screen.getByText("Email and password are required.")
    ).toBeInTheDocument();
  });
});
