import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePassword from "../../src/components/ChangePassword.js";
import * as api from "../../src/api.js";

const changeRequiredUser = {
  id: "user-1",
  displayName: "Anan Chaiyasit",
  email: "anan.chaiyasit@example.com",
  roles: ["Requester" as const],
  isActive: true,
  passwordState: "ChangeRequired" as const,
};

const activeUser = {
  ...changeRequiredUser,
  passwordState: "Active" as const,
};

describe("ChangePassword", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits matching password fields and returns the updated user", async () => {
    vi.spyOn(api, "changePassword").mockResolvedValue(activeUser);

    const onPasswordChanged = vi.fn();
    const testUser = userEvent.setup();

    render(
      <ChangePassword
        user={changeRequiredUser}
        onPasswordChanged={onPasswordChanged}
      />
    );

    await testUser.type(
      screen.getByLabelText("Current Password"),
      "CurrentPass123"
    );
    await testUser.type(
      screen.getByLabelText("New Password"),
      "NewPass123"
    );
    await testUser.type(
      screen.getByLabelText("Confirm Password"),
      "NewPass123"
    );
    await testUser.click(
      screen.getByRole("button", { name: "Change Password" })
    );

    expect(api.changePassword).toHaveBeenCalledWith(
      "CurrentPass123",
      "NewPass123",
      "NewPass123"
    );
    expect(onPasswordChanged).toHaveBeenCalledWith(activeUser);
  });

  it("validates password confirmation before calling the API", async () => {
    const changePasswordSpy = vi.spyOn(api, "changePassword");
    const testUser = userEvent.setup();

    render(
      <ChangePassword
        user={changeRequiredUser}
        onPasswordChanged={vi.fn()}
      />
    );

    await testUser.type(
      screen.getByLabelText("New Password"),
      "NewPass123"
    );
    await testUser.type(
      screen.getByLabelText("Confirm Password"),
      "OtherPass123"
    );
    await testUser.click(
      screen.getByRole("button", { name: "Change Password" })
    );

    expect(changePasswordSpy).not.toHaveBeenCalled();
    expect(
      screen.getByText("Password confirmation must match.")
    ).toBeInTheDocument();
  });

  it("shows a safe error when password change fails", async () => {
    vi.spyOn(api, "changePassword").mockRejectedValue(
      new Error("PASSWORD_CHANGE_FAILED")
    );

    const testUser = userEvent.setup();

    render(
      <ChangePassword
        user={changeRequiredUser}
        onPasswordChanged={vi.fn()}
      />
    );

    await testUser.type(
      screen.getByLabelText("Current Password"),
      "WrongPass123"
    );
    await testUser.type(
      screen.getByLabelText("New Password"),
      "NewPass123"
    );
    await testUser.type(
      screen.getByLabelText("Confirm Password"),
      "NewPass123"
    );
    await testUser.click(
      screen.getByRole("button", { name: "Change Password" })
    );

    expect(
      await screen.findByText("Unable to change password.")
    ).toBeInTheDocument();
  });
});
