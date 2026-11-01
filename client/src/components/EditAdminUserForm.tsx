import { useEffect, useState, type FormEvent } from "react";
import {
  getAdminUser,
  updateAdminUser,
  type AdminUser,
  type AdminUserRole,
} from "../api";

type EditAdminUserFormProps = {
  userId: string;
  onCancel: () => void;
  onUpdated: () => void;
};

export default function EditAdminUserForm({
  userId,
  onCancel,
  onUpdated,
}: EditAdminUserFormProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUserRole>("Requester");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const result = await getAdminUser(userId);

        if (cancelled) return;

        setUser(result);
        setDisplayName(result.displayName);
        setEmail(result.email);
        setRole(result.roles[0] as AdminUserRole);
        setIsActive(result.isActive);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load user."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await updateAdminUser(userId, {
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        isActive,
      });

      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update user."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p role="status">Loading user...</p>;
  }

  if (!user) {
    return (
      <section className="container-fluid">
        <div className="alert alert-danger" role="alert">
          {error || "User not found."}
        </div>
        <button className="btn btn-outline-secondary" onClick={onCancel}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Edit User</h2>
          <p className="text-muted">
            Update user account information and access.
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
          <label htmlFor="edit-user-display-name" className="form-label">
            Display Name
          </label>
          <input
            id="edit-user-display-name"
            type="text"
            className="form-control"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="edit-user-email" className="form-label">
            Email
          </label>
          <input
            id="edit-user-email"
            type="email"
            className="form-control"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="edit-user-role" className="form-label">
            Role
          </label>
          <select
            id="edit-user-role"
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

        <div className="form-check mb-4">
          <input
            id="edit-user-active"
            type="checkbox"
            className="form-check-input"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          <label htmlFor="edit-user-active" className="form-check-label">
            Active account
          </label>
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-success"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}