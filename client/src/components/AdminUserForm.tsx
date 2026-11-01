import { useState, type FormEvent } from "react";
import {
  createAdminUser,
  type AdminUserRole,
} from "../api";

type AdminUserFormProps = {
  onCancel: () => void;
  onCreated: () => void;
};

export default function AdminUserForm({
  onCancel,
  onCreated,
}: AdminUserFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUserRole>("Requester");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await createAdminUser({
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        password,
      });

      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create user."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Create User</h2>
          <p className="text-muted">
            Create a new ToktickIT user account.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="user-display-name" className="form-label">
            Display Name
          </label>
          <input
            id="user-display-name"
            type="text"
            className="form-control"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="user-email" className="form-label">
            Email
          </label>
          <input
            id="user-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="user-role" className="form-label">
            Role
          </label>
          <select
            id="user-role"
            className="form-select"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as AdminUserRole)
            }
          >
            <option value="Requester">Requester</option>
            <option value="ITStaff">IT Staff</option>
            <option value="Administrator">Administrator</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="user-password" className="form-label">
            Initial Password
          </label>
          <input
            id="user-password"
            type="password"
            className="form-control"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="new-password"
          />
          <small className="text-muted">
            The new user will be required to change this password after login.
          </small>
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-success"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </section>
  );
}