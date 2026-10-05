import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import ChangePassword from "./components/ChangePassword.js";
import CreateTicket from "./components/CreateTicket.js";
import Login from "./components/Login.js";
import MyTickets from "./components/MyTickets.js";
import RequesterTicketDetail from "./components/RequesterTicketDetail.js";
import StaffQueue from "./components/StaffQueue.js";
import StaffTicketDetail from "./components/StaffTicketDetail.js";
import UserManagement from "./components/UserManagement.js";

import {
  AuthenticatedUser,
  DevelopmentRequester,
  createAdminUser,
  getAdminUsers,
  getCurrentUser,
  logout,
} from "./api.js";

type ActivePage =
  | "create"
  | "tickets"
  | "staff-queue"
  | "user-management"
  | "create-user"
  | "edit-user";

type AuthState =
  | "checking"
  | "anonymous"
  | "authenticated";

type AdminRole =
  | "Requester"
  | "ITStaff"
  | "Administrator";

export default function App() {
  const [authState, setAuthState] =
    useState<AuthState>("checking");

  const [currentUser, setCurrentUser] =
    useState<AuthenticatedUser | null>(null);

  const [activePage, setActivePage] =
    useState<ActivePage>("create");

  const [selectedTicketId, setSelectedTicketId] =
    useState<string | null>(null);

  const [selectedStaffTicketId, setSelectedStaffTicketId] =
    useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser();

        setCurrentUser(user);

        if (user.roles.includes("Administrator")) {
          setActivePage("user-management");
        } else if (user.roles.includes("ITStaff")) {
          setActivePage("staff-queue");
        } else {
          setActivePage("create");
        }

        setAuthState("authenticated");
      } catch {
        setCurrentUser(null);
        setAuthState("anonymous");
      }
    }

    loadCurrentUser();
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Leave the authenticated UI even if the session already expired.
    }

    setCurrentUser(null);
    setSelectedTicketId(null);
    setSelectedStaffTicketId(null);
    setSelectedUserId(null);
    setActivePage("create");
    setAuthState("anonymous");
  }

  function handleAuthenticated(
    user: AuthenticatedUser
  ) {
    setCurrentUser(user);
    setSelectedTicketId(null);
    setSelectedStaffTicketId(null);
    setSelectedUserId(null);

    if (user.roles.includes("Administrator")) {
      setActivePage("user-management");
    } else if (user.roles.includes("ITStaff")) {
      setActivePage("staff-queue");
    } else {
      setActivePage("create");
    }

    setAuthState("authenticated");
  }

  if (authState === "checking") {
    return (
      <div className="container py-5">
        <p role="status">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (
    authState === "anonymous" ||
    !currentUser
  ) {
    return (
      <Login
        onLogin={handleAuthenticated}
      />
    );
  }

  if (
    currentUser.passwordState ===
    "ChangeRequired"
  ) {
    return (
      <ChangePassword
        user={currentUser}
        onPasswordChanged={
          handleAuthenticated
        }
      />
    );
  }

  const currentRequester: DevelopmentRequester = {
    id: currentUser.id,
    displayName: currentUser.displayName,
    email: currentUser.email,
  };

  const canUseRequesterWorkflow =
    currentUser.roles.includes("Requester");

  const canUseStaffWorkflow =
    currentUser.roles.includes("ITStaff");

  const canUseAdminWorkflow =
    currentUser.roles.includes("Administrator");

  return (
    <div
      className="container py-5"
      style={{ maxWidth: 1200 }}
    >
      <div className="zen-app-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">
            TokTickIT
          </h1>

          <p className="mb-0">
            Current user:{" "}
            <strong>
              {currentUser.displayName}
            </strong>{" "}
            <span className="text-muted">
              (
              {currentUser.roles.join(", ")}
              )
            </span>
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {canUseRequesterWorkflow && (
            <>
              <button
                type="button"
                className={
                  activePage === "tickets"
                    ? "btn btn-success"
                    : "btn btn-outline-success"
                }
                onClick={() => {
                  setActivePage("tickets");
                  setSelectedTicketId(null);
                  setSelectedStaffTicketId(null);
                  setSelectedUserId(null);
                }}
              >
                My Tickets
              </button>

              <button
                type="button"
                className={
                  activePage === "create"
                    ? "btn btn-success"
                    : "btn btn-outline-success"
                }
                onClick={() => {
                  setActivePage("create");
                  setSelectedTicketId(null);
                  setSelectedStaffTicketId(null);
                  setSelectedUserId(null);
                }}
              >
                Create Ticket
              </button>
            </>
          )}

          {canUseStaffWorkflow && (
            <button
              type="button"
              className={
                activePage === "staff-queue"
                  ? "btn btn-success"
                  : "btn btn-outline-success"
              }
              onClick={() => {
                setActivePage("staff-queue");
                setSelectedTicketId(null);
                setSelectedStaffTicketId(null);
                setSelectedUserId(null);
              }}
            >
              Staff Queue
            </button>
          )}

          {canUseAdminWorkflow && (
            <button
              type="button"
              className={
                activePage === "user-management"
                  ? "btn btn-success"
                  : "btn btn-outline-success"
              }
              onClick={() => {
                setActivePage("user-management");
                setSelectedTicketId(null);
                setSelectedStaffTicketId(null);
                setSelectedUserId(null);
              }}
            >
              User Management
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </div>

      {canUseAdminWorkflow &&
        activePage === "user-management" && (
          <UserManagement
            onCreateUser={() =>
              setActivePage("create-user")
            }
            onEditUser={(userId) => {
              setSelectedUserId(userId);
              setActivePage("edit-user");
            }}
          />
        )}

      {canUseAdminWorkflow &&
        activePage === "create-user" && (
          <CreateUserPage
            onBack={() =>
              setActivePage("user-management")
            }
            onCreated={() =>
              setActivePage("user-management")
            }
          />
        )}

      {canUseAdminWorkflow &&
        activePage === "edit-user" &&
        selectedUserId && (
          <EditUserPage
            userId={selectedUserId}
            onBack={() => {
              setSelectedUserId(null);
              setActivePage("user-management");
            }}
            onUpdated={() => {
              setSelectedUserId(null);
              setActivePage("user-management");
            }}
          />
        )}

      {!canUseRequesterWorkflow &&
        !canUseStaffWorkflow &&
        !canUseAdminWorkflow && (
          <div className="alert alert-info">
            No workflow is available
            for this role yet.
          </div>
        )}

      {canUseRequesterWorkflow && (
        <>
          {selectedTicketId ? (
            <RequesterTicketDetail
              requester={currentRequester}
              ticketId={selectedTicketId}
              onBack={() => {
                setSelectedTicketId(null);
                setActivePage("tickets");
              }}
            />
          ) : (
            <>
              {activePage === "create" && (
                <CreateTicket
                  requester={currentRequester}
                />
              )}

              {activePage === "tickets" && (
                <MyTickets
                  requester={currentRequester}
                  onSelectTicket={(ticketId) =>
                    setSelectedTicketId(ticketId)
                  }
                />
              )}
            </>
          )}
        </>
      )}

      {canUseStaffWorkflow &&
        activePage === "staff-queue" && (
          <>
            {selectedStaffTicketId ? (
              <StaffTicketDetail
                ticketId={selectedStaffTicketId}
                onBack={() =>
                  setSelectedStaffTicketId(null)
                }
              />
            ) : (
              <StaffQueue
                onSelectTicket={(ticketId) =>
                  setSelectedStaffTicketId(ticketId)
                }
              />
            )}
          </>
        )}
    </div>
  );
}

function CreateUserPage({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<AdminRole>("Requester");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError(
        "Display name is required."
      );
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError(
        "Initial password is required."
      );
      return;
    }

    try {
      setLoading(true);

      await createAdminUser({
        displayName: displayName.trim(),
        email: email.trim(),
        role,
        password,
      });

      setSuccess(
        "User created successfully."
      );

      setDisplayName("");
      setEmail("");
      setRole("Requester");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create user."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1>Create User</h1>

          <p className="mb-0">
            Create a new TokTickIT user
            account.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onBack}
          disabled={loading}
        >
          Back to User Management
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card p-4"
      >
        <div className="mb-3">
          <label
            htmlFor="create-user-display-name"
            className="form-label"
          >
            Display Name
          </label>

          <input
            id="create-user-display-name"
            name="displayName"
            type="text"
            className="form-control"
            value={displayName}
            onChange={(event) =>
              setDisplayName(
                event.target.value
              )
            }
            disabled={loading}
            required
          />
        </div>

        <div className="mb-3">
          <label
            htmlFor="create-user-email"
            className="form-label"
          >
            Email
          </label>

          <input
            id="create-user-email"
            name="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            disabled={loading}
            required
          />
        </div>

        <div className="mb-3">
          <label
            htmlFor="create-user-role"
            className="form-label"
          >
            Role
          </label>

          <select
            id="create-user-role"
            name="role"
            className="form-select"
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as AdminRole
              )
            }
            disabled={loading}
          >
            <option value="Requester">
              Requester
            </option>

            <option value="ITStaff">
              IT Staff
            </option>

            <option value="Administrator">
              Administrator
            </option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="create-user-password"
            className="form-label"
          >
            Initial Password
          </label>

          <input
            id="create-user-password"
            name="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            disabled={loading}
            required
          />

          <div className="form-text">
            This will be the user's initial
            password.
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create User"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
            disabled={loading}
          >
            Cancel
          </button>

          {success && (
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={onCreated}
            >
              Back to Users
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function EditUserPage({
  userId,
  onBack,
  onUpdated,
}: {
  userId: string;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<AdminRole>("Requester");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError("");

       const response = await getAdminUsers({
  page: 1,
  pageSize: 20,
});

        const user = response.data.find(
          (item) => item.id === userId
        );

        if (!user) {
          setError("User not found.");
          return;
        }

        setDisplayName(user.displayName);
        setEmail(user.email);

        const userRole =
          user.roles[0];

        if (
          userRole === "Requester" ||
          userRole === "ITStaff" ||
          userRole === "Administrator"
        ) {
          setRole(userRole);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load user."
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [userId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError(
        "Display name is required."
      );
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/v1/admin/users/${userId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            displayName:
              displayName.trim(),
            email: email.trim(),
            role,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to update user."
        );
      }

      setSuccess(
        "User updated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Edit User</h1>
            <p className="mb-0">
              Loading user information...
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <div
          className="alert alert-info"
          role="status"
        >
          Loading...
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1>Edit User</h1>

          <p className="mb-0">
            Update the user's basic
            information and role.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onBack}
          disabled={saving}
        >
          Back to User Management
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card p-4"
      >
        <div className="mb-3">
          <label
            htmlFor="edit-user-display-name"
            className="form-label"
          >
            Display Name
          </label>

          <input
            id="edit-user-display-name"
            name="displayName"
            type="text"
            className="form-control"
            value={displayName}
            onChange={(event) =>
              setDisplayName(
                event.target.value
              )
            }
            disabled={saving}
            required
          />
        </div>

        <div className="mb-3">
          <label
            htmlFor="edit-user-email"
            className="form-label"
          >
            Email
          </label>

          <input
            id="edit-user-email"
            name="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            disabled={saving}
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="edit-user-role"
            className="form-label"
          >
            Role
          </label>

          <select
            id="edit-user-role"
            name="role"
            className="form-select"
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as AdminRole
              )
            }
            disabled={saving}
          >
            <option value="Requester">
              Requester
            </option>

            <option value="ITStaff">
              IT Staff
            </option>

            <option value="Administrator">
              Administrator
            </option>
          </select>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="submit"
            className="btn btn-success"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </button>

          {success && (
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={onUpdated}
            >
              Back to Users
            </button>
          )}
        </div>
      </form>
    </section>
  );
}