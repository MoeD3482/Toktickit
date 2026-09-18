import { FormEvent, useState } from "react";
import {
  AuthenticatedUser,
  changePassword,
} from "../api.js";

interface ChangePasswordProps {
  user: AuthenticatedUser;
  onPasswordChanged: (user: AuthenticatedUser) => void;
}

export default function ChangePassword({
  user,
  onPasswordChanged,
}: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("Password confirmation must match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedUser = await changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );
      onPasswordChanged(updatedUser);
    } catch {
      setErrorMessage("Unable to change password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="container py-5"
      style={{ maxWidth: 520 }}
    >
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h1 className="h3 mb-2">Change Password</h1>
          <p className="text-muted mb-4">
            {user.displayName}, change your temporary password
            before continuing.
          </p>

          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                htmlFor="currentPassword"
                className="form-label"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                className="form-control"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <input
                id="newPassword"
                className="form-control"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="confirmPassword"
                className="form-label"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                className="form-control"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Changing password..."
                : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
