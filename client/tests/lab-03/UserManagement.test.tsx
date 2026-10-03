import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserManagement from "../../src/components/UserManagement.js";
import {
  AdminUser,
  getAdminUsers,
} from "../../src/api.js";

vi.mock("../../src/api.js", () => ({
  getAdminUsers: vi.fn(),
}));

const mockedGetAdminUsers = vi.mocked(getAdminUsers);

const users: AdminUser[] = [
  {
    id: "user-1",
    displayName: "Alice Staff",
    email: "alice@example.com",
    roles: ["ITStaff"],
    isActive: true,
    passwordState: "Active",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "user-2",
    displayName: "Bob Requester",
    email: "bob@example.com",
    roles: ["Requester"],
    isActive: false,
    passwordState: "Active",
    createdAt: "2026-09-02T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
  },
];

const mockResponse = {
  data: users,
  meta: {
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 2,
  },
};

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAdminUsers.mockResolvedValue(mockResponse);
  });

  it("renders users and management controls", async () => {
    render(
      <UserManagement
        onCreateUser={vi.fn()}
        onEditUser={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "User Management",
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice Staff")).toBeInTheDocument();
      expect(screen.getByText("Bob Requester")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", {
        name: "Create User",
      })
    ).toBeInTheDocument();
  });

  it("loads users with search", async () => {
    render(
      <UserManagement
        onCreateUser={vi.fn()}
        onEditUser={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Staff")).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText("Search"),
      {
        target: { value: "Alice" },
      }
    );

    await waitFor(() => {
      expect(mockedGetAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: "Alice",
        })
      );
    });
  });

  it("supports role and status filters", async () => {
    render(
      <UserManagement
        onCreateUser={vi.fn()}
        onEditUser={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Staff")).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText("Role"),
      {
        target: { value: "ITStaff" },
      }
    );

    await waitFor(() => {
      expect(mockedGetAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: "ITStaff",
        })
      );
    });

    fireEvent.change(
      screen.getByLabelText("Status"),
      {
        target: { value: "false" },
      }
    );

    await waitFor(() => {
      expect(mockedGetAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  it("calls callbacks for create and edit", async () => {
    const onCreateUser = vi.fn();
    const onEditUser = vi.fn();

    render(
      <UserManagement
        onCreateUser={onCreateUser}
        onEditUser={onEditUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Staff")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create User",
      })
    );

    expect(onCreateUser).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Edit",
      })[0]
    );

    expect(onEditUser).toHaveBeenCalledWith("user-1");
  });

  it("shows a safe error when loading fails", async () => {
    mockedGetAdminUsers.mockRejectedValue(
      new Error("Unable to load users.")
    );

    render(
      <UserManagement
        onCreateUser={vi.fn()}
        onEditUser={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load users.")
      ).toBeInTheDocument();
    });
  });
});