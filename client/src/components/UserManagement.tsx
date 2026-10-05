
import { useEffect, useState } from "react";
import {
  AdminUser,
  AdminUsersQuery,
  getAdminUsers,
  updateAdminUser,
  setAdminUserInitialPassword,
} from "../api.js";

type Props = {
  onCreateUser: () => void;
  onEditUser: (userId: string) => void;
};

export default function UserManagement({
  onCreateUser,
  onEditUser,
}: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] =
    useState<AdminUsersQuery["role"] | "">("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("displayName");
  const [order, setOrder] = useState("asc");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [passwordUserId, setPasswordUserId] =
    useState<string | null>(null);
  const [initialPassword, setInitialPassword] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setError("");

        const filters: AdminUsersQuery = {
          page: 1,
          pageSize: 20,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        if (role) {
          filters.role = role;
        }

        if (status !== "") {
          filters.isActive = status === "true";
        }

        const response = await getAdminUsers(filters);

        if (!cancelled) {
          const data = [...response.data];

          data.sort((a, b) => {
            let aValue = "";
            let bValue = "";

            if (sort === "email") {
              aValue = a.email;
              bValue = b.email;
            } else if (sort === "createdAt") {
              aValue = a.createdAt ?? "";
              bValue = b.createdAt ?? "";
            } else {
              aValue = a.displayName;
              bValue = b.displayName;
            }

            const result = aValue.localeCompare(bValue);

            return order === "asc" ? result : -result;
          });

          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load users."
          );
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [search, role, status, sort, order]);

  const handleToggleActive = async (
    user: AdminUser
  ) => {
    try {
      setError("");
      setMessage("");

      const updatedUser = await updateAdminUser(
        user.id,
        {
          isActive: !user.isActive,
        }
      );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? updatedUser
            : currentUser
        )
      );

      setMessage(
        updatedUser.isActive
          ? "User activated successfully."
          : "User deactivated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user."
      );
    }
  };

  const handleSetInitialPassword = async (
    userId: string
  ) => {
    try {
      setError("");
      setMessage("");

      if (!initialPassword.trim()) {
        setError("Initial password is required.");
        return;
      }

      const updatedUser =
        await setAdminUserInitialPassword(
          userId,
          initialPassword
        );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === userId
            ? updatedUser
            : currentUser
        )
      );

      setPasswordUserId(null);
      setInitialPassword("");
      setMessage("Password set successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set initial password."
      );
    }
  };

  return (
    <>
      <style>
        {`
          .user-management {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 28px 24px 50px;
            box-sizing: border-box;
          }

          .user-management-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-bottom: 24px;
          }

          .user-management-title {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
          }

          .user-management-subtitle {
            margin: 6px 0 0;
            color: #666;
            font-size: 14px;
          }

          .create-user-button {
            border: 0;
            border-radius: 8px;
            padding: 11px 18px;
            background: #087f4e;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }

          .create-user-button:hover {
            background: #066a41;
          }

          .filters-card {
            background: white;
            border: 1px solid #e1e5e8;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }

          .filters-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
            gap: 14px;
          }

          .filter-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .filter-field label {
            font-size: 13px;
            font-weight: 600;
            color: #444;
          }

          .filter-field input,
          .filter-field select {
            height: 40px;
            padding: 0 11px;
            border: 1px solid #cfd5da;
            border-radius: 7px;
            background: white;
            font-size: 14px;
            box-sizing: border-box;
          }

          .filter-field input:focus,
          .filter-field select:focus {
            outline: none;
            border-color: #087f4e;
            box-shadow: 0 0 0 2px rgba(8,127,78,0.12);
          }

          .message {
            padding: 11px 14px;
            border-radius: 7px;
            margin-bottom: 16px;
            font-size: 14px;
          }

          .message-error {
            background: #fff1f1;
            border: 1px solid #e5aaaa;
            color: #a52828;
          }

          .message-success {
            background: #eefaf3;
            border: 1px solid #a8d9bb;
            color: #176b3b;
          }

          .users-list {
            display: grid;
            gap: 12px;
          }

          .user-card {
            background: white;
            border: 1px solid #e1e5e8;
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }

          .user-card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }

          .user-info {
            min-width: 0;
          }

          .user-name {
            margin: 0 0 5px;
            font-size: 18px;
            font-weight: 700;
          }

          .user-email {
            color: #666;
            font-size: 14px;
            word-break: break-word;
          }

          .user-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
          }

          .badge-role {
            background: #eef2ff;
            color: #3949ab;
          }

          .badge-active {
            background: #eaf8ef;
            color: #16723d;
          }

          .badge-inactive {
            background: #f2f2f2;
            color: #666;
          }

          .badge-password {
            background: #fff5df;
            color: #8a5b00;
          }

          .user-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 16px;
          }

          .action-button {
            border: 1px solid #cbd1d6;
            background: white;
            color: #333;
            border-radius: 7px;
            padding: 8px 13px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }

          .action-button:hover {
            background: #f5f6f7;
          }

          .action-button-primary {
            border-color: #087f4e;
            background: #087f4e;
            color: white;
          }

          .action-button-primary:hover {
            background: #066a41;
          }

          .action-button-danger {
            border-color: #c94a4a;
            color: #a52828;
          }

          .password-box {
            margin-top: 14px;
            padding: 14px;
            background: #f7f9fa;
            border: 1px solid #e1e5e8;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .password-box input {
            height: 38px;
            flex: 1;
            min-width: 200px;
            padding: 0 10px;
            border: 1px solid #cfd5da;
            border-radius: 6px;
            box-sizing: border-box;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            background: white;
            border: 1px solid #e1e5e8;
            border-radius: 12px;
            color: #777;
          }

          @media (max-width: 900px) {
            .filters-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .user-card-top {
              flex-direction: column;
            }
          }

          @media (max-width: 600px) {
            .user-management {
              padding: 20px 14px 40px;
            }

            .user-management-header {
              flex-direction: column;
              align-items: stretch;
            }

            .user-management-title {
              font-size: 26px;
            }

            .create-user-button {
              width: 100%;
            }

            .filters-grid {
              grid-template-columns: 1fr;
            }

            .user-actions {
              flex-direction: column;
            }

            .action-button {
              width: 100%;
            }

            .password-box {
              flex-direction: column;
            }

            .password-box input {
              width: 100%;
              min-width: 0;
            }
          }
        `}
      </style>

      <section className="user-management">
        <div className="user-management-header">
          <div>
            <h1 className="user-management-title">
              User Management
            </h1>

            <p className="user-management-subtitle">
              Manage users, roles, account status, and
              initial passwords.
            </p>
          </div>

          <button
            type="button"
            className="create-user-button"
            onClick={onCreateUser}
          >
             Create User
          </button>
        </div>

        <div className="filters-card">
          <div className="filters-grid">
            <div className="filter-field">
              <label htmlFor="user-search">
                Search
              </label>

              <input
                id="user-search"
                aria-label="Search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="filter-field">
              <label htmlFor="user-role">
                Role
              </label>

              <select
                id="user-role"
                aria-label="Role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as
                      | ""
                      | AdminUsersQuery["role"]
                  )
                }
              >
                <option value="">
                  All Roles
                </option>

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

            <div className="filter-field">
              <label htmlFor="user-status">
                Status
              </label>

              <select
                id="user-status"
                aria-label="Status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option value="">
                  All Statuses
                </option>

                <option value="true">
                  Active
                </option>

                <option value="false">
                  Inactive
                </option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="user-sort">
                Sort
              </label>

              <select
                id="user-sort"
                aria-label="Sort"
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value)
                }
              >
                <option value="displayName">
                  Display Name
                </option>

                <option value="email">
                  Email
                </option>

                <option value="createdAt">
                  Created At
                </option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="user-order">
                Order
              </label>

              <select
                id="user-order"
                aria-label="Order"
                value={order}
                onChange={(event) =>
                  setOrder(event.target.value)
                }
              >
                <option value="asc">
                  Ascending
                </option>

                <option value="desc">
                  Descending
                </option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="message message-error">
            {error}
          </div>
        )}

        {message && (
          <div className="message message-success">
            {message}
          </div>
        )}

        <div className="users-list">
          {users.length === 0 ? (
            <div className="empty-state">
              No users found.
            </div>
          ) : (
            users.map((user) => (
              <div
                className="user-card"
                key={user.id}
              >
                <div className="user-card-top">
                  <div className="user-info">
                    <h2 className="user-name">
                      {user.displayName}
                    </h2>

                    <div className="user-email">
                      {user.email}
                    </div>

                    <div className="user-meta">
                      <span className="badge badge-role">
                        {user.roles[0]}
                      </span>

                      <span
                        className={
                          user.isActive
                            ? "badge badge-active"
                            : "badge badge-inactive"
                        }
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                      <span className="badge badge-password">
                        Password:{" "}
                        {user.passwordState}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-actions">
                  <button
                    type="button"
                    className="action-button action-button-primary"
                    onClick={() =>
                      onEditUser(user.id)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className={
                      user.isActive
                        ? "action-button action-button-danger"
                        : "action-button"
                    }
                    onClick={() =>
                      handleToggleActive(user)
                    }
                  >
                    {user.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    type="button"
                    className="action-button"
                    onClick={() => {
                      setPasswordUserId(user.id);
                      setInitialPassword("");
                      setError("");
                      setMessage("");
                    }}
                  >
                    Set Initial Password
                  </button>
                </div>

                {passwordUserId === user.id && (
                  <div className="password-box">
                    <input
                      type="password"
                      aria-label="Initial Password"
                      placeholder="Enter initial password"
                      value={initialPassword}
                      onChange={(event) =>
                        setInitialPassword(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="action-button action-button-primary"
                      onClick={() =>
                        handleSetInitialPassword(
                          user.id
                        )
                      }
                    >
                      Set Password
                    </button>

                    <button
                      type="button"
                      className="action-button"
                      onClick={() => {
                        setPasswordUserId(null);
                        setInitialPassword("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
