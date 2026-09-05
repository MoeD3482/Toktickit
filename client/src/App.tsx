import { useState } from "react";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";
import RequesterSelection from "./components/RequesterSelection.js";
import RequesterTicketDetail from "./components/RequesterTicketDetail.js";

import {
  checkSystem,
  Category,
  DevelopmentRequester,
} from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";
type ActivePage = "create" | "tickets";

export default function App() {
  const [currentRequester, setCurrentRequester] =
    useState<DevelopmentRequester | null>(null);

  const [activePage, setActivePage] =
    useState<ActivePage>("create");

  const [selectedTicketId, setSelectedTicketId] =
    useState<string | null>(null);

  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCheck() {
    setState("loading");
    setCategories([]);
    setErrorMessage("");

    try {
      const result = await checkSystem();

      setCategories(result.categories);
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Unable to connect to TokTickIT API");
    }
  }

  function handleChangeRequester() {
    setCurrentRequester(null);
    setSelectedTicketId(null);
    setActivePage("create");
  }

  if (!currentRequester) {
    return (
      <>
        <RequesterSelection
          onSelect={(requester) => {
            setCurrentRequester(requester);
            setActivePage("create");
            setSelectedTicketId(null);
          }}
        />

        <div
          className="container pb-5"
          style={{ maxWidth: 640 }}
        >
          <hr />

          <h2 className="h6">System Check</h2>

          <button
            type="button"
            className="btn btn-outline-success"
            onClick={handleCheck}
            disabled={state === "loading"}
          >
            {state === "loading"
              ? "Loading..."
              : "Check System"}
          </button>

          {state === "loading" && (
            <p className="mt-3">Loading...</p>
          )}

          {state === "success" && (
            <div className="mt-3">
              <p>
                <strong>System Status:</strong>{" "}
                <span className="text-success">
                  Online
                </span>
              </p>

              <h3 className="h6">
                Supported Request Categories
              </h3>

              <ol>
                {categories.map((category) => (
                  <li key={category.id}>
                    {category.name}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {state === "error" && (
            <div className="mt-3">
              <p>
                <strong>System Status:</strong>{" "}
                <span className="text-danger">
                  Offline
                </span>
              </p>

              <div className="alert alert-danger">
                {errorMessage ||
                  "Unable to connect to TokTickIT API"}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div
      className="container py-5"
      style={{ maxWidth: 1200 }}
    >
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">TokTickIT</h1>

          <p className="mb-0">
            Requester:{" "}
            <strong>
              {currentRequester.displayName}
            </strong>
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
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
            }}
          >
            Create Ticket
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleChangeRequester}
          >
            Change Requester
          </button>
        </div>
      </div>

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
    </div>
  );
}