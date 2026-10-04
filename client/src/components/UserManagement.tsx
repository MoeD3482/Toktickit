import { useEffect, useState } from "react";
import {
  AdminUser,
  AdminUserFilters,
  getAdminUsers,
} from "../api.js";

type Props = {
  onCreateUser: () => void;
  onEditUser: (userId: string) => void;
};

export default function UserManagement({
  onCreateUser,
  onEditUser,
}: Props) {
  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [search, setSearch] =
    useState("");

  const [role, setRole] = useState<
    AdminUserFilters["role"] | ""
  >("");

  const [status, setStatus] =
    useState("");

  const [sort, setSort] =
    useState("displayName");

  const [order, setOrder] =
    useState("asc");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setError("");

        const filters: AdminUserFilters = {
          page: 1,
          pageSize: 10,
        };

        if (search.trim()) {
          filters.search =
            search.trim();
        }

        if (role) {
          filters.role = role;
        }

        if (status !== "") {
          filters.isActive =
            status === "true";
        }

        const response =
          await getAdminUsers(filters);

        if (!cancelled) {
          setUsers(response.data);
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
  }, [search, role, status]);

  return (
    <section>
      <h1>User Management</h1>

      <div>
        <label htmlFor="user-search">
          Search
        </label>
        <input
          id="user-search"
          aria-label="Search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
        />
      </div>

      <div>
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
                | AdminUserFilters["role"]
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
            ITStaff
          </option>
          <option value="Administrator">
            Administrator
          </option>
        </select>
      </div>

      <div>
        <label htmlFor="user-status">
          Status
        </label>

        <select
          id="user-status"
          aria-label="Status"
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
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

      <div>
        <label htmlFor="user-sort">
          Sort
        </label>

        <select
          id="user-sort"
          aria-label="Sort"
          value={sort}
          onChange={(event) =>
            setSort(
              event.target.value
            )
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

      <div>
        <label htmlFor="user-order">
          Order
        </label>

        <select
          id="user-order"
          aria-label="Order"
          value={order}
          onChange={(event) =>
            setOrder(
              event.target.value
            )
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

      <button
        type="button"
        onClick={onCreateUser}
      >
        Create User
      </button>

      {error && (
        <p>{error}</p>
      )}

      <div>
        {users.map((user) => (
          <div key={user.id}>
            <strong>
              {user.displayName}
            </strong>

            <div>
              {user.email}
            </div>

            <div>
              {user.roles[0]}
            </div>

            <div>
              {user.isActive
                ? "Active"
                : "Inactive"}
            </div>

            <button
              type="button"
              onClick={() =>
                onEditUser(user.id)
              }
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}