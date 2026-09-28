import { useEffect, useState } from "react";
import ChangePassword from "./components/ChangePassword.js";
import CreateTicket from "./components/CreateTicket.js";
import Login from "./components/Login.js";
import MyTickets from "./components/MyTickets.js";
import RequesterTicketDetail from "./components/RequesterTicketDetail.js";
import StaffQueue from "./components/StaffQueue.js";
import StaffTicketDetail from "./components/StaffTicketDetail.js";

import {
  AuthenticatedUser,
  DevelopmentRequester,
  getCurrentUser,
  logout,
} from "./api.js";

type ActivePage = "create" | "tickets" | "staff-queue";
type AuthState = "checking" | "anonymous" | "authenticated";

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

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setActivePage(
          user.roles.includes("ITStaff")
            ? "staff-queue"
            : "create"
        );
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
      // The user should still leave the authenticated UI even if
      // the server session has already expired.
    }

    setCurrentUser(null);
    setSelectedTicketId(null);
    setSelectedStaffTicketId(null);
    setActivePage("create");
    setAuthState("anonymous");
  }

  function handleAuthenticated(user: AuthenticatedUser) {
    setCurrentUser(user);
    setSelectedTicketId(null);
    setSelectedStaffTicketId(null);
    setActivePage(
      user.roles.includes("ITStaff")
        ? "staff-queue"
        : "create"
    );
    setAuthState("authenticated");
  }

  if (authState === "checking") {
    return (
      <div className="container py-5">
        <p role="status">Checking authentication...</p>
      </div>
    );
  }

  if (authState === "anonymous" || !currentUser) {
    return <Login onLogin={handleAuthenticated} />;
  }

  if (currentUser.passwordState === "ChangeRequired") {
    return (
      <ChangePassword
        user={currentUser}
        onPasswordChanged={handleAuthenticated}
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
            </strong>
            {" "}
            <span className="text-muted">
              ({currentUser.roles.join(", ")})
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
              }}
            >
              Staff Queue
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

      {!canUseRequesterWorkflow && !canUseStaffWorkflow && (
        <div className="alert alert-info">
          No requester workflow is available for this role yet.
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
                <CreateTicket requester={currentRequester} />
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

      {canUseStaffWorkflow && activePage === "staff-queue" && (
        selectedStaffTicketId ? (
          <StaffTicketDetail
            ticketId={selectedStaffTicketId}
            onBack={() => setSelectedStaffTicketId(null)}
          />
        ) : (
          <StaffQueue
            onSelectTicket={(ticketId) =>
              setSelectedStaffTicketId(ticketId)
            }
          />
        )
      )}
    </div>
  );
}
