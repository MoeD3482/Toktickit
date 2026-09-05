import { useState } from "react";
import CreateTicket from "./components/CreateTicket.js";
import {
  checkSystem,
  Category,
  DevelopmentRequester,
} from "./api.js";
import RequesterSelection from "./components/RequesterSelection.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [currentRequester, setCurrentRequester] =
    useState<DevelopmentRequester | null>(null);

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

  if (!currentRequester) {
    return (
      <>
        <RequesterSelection onSelect={setCurrentRequester} />

        <div className="container pb-5" style={{ maxWidth: 640 }}>
          <hr />

          <h2 className="h6">System Check</h2>

          <button
            className="btn btn-outline-success"
            onClick={handleCheck}
            disabled={state === "loading"}
          >
            {state === "loading" ? "Loading..." : "Check System"}
          </button>

          {state === "loading" && <p className="mt-3">Loading...</p>}

          {state === "success" && (
            <div className="mt-3">
              <p>
                <strong>System Status:</strong>{" "}
                <span className="text-success">Online</span>
              </p>

              <h3 className="h6">Supported Request Categories</h3>

              <ol>
                {categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ol>
            </div>
          )}

          {state === "error" && (
            <div className="mt-3">
              <p>
                <strong>System Status:</strong>{" "}
                <span className="text-danger">Offline</span>
              </p>

              <div className="alert alert-danger">
                {errorMessage || "Unable to connect to TokTickIT API"}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">TokTickIT</h1>
          <p className="mb-0">
            Requester: <strong>{currentRequester.displayName}</strong>
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          onClick={() => setCurrentRequester(null)}
        >
          Change Requester
        </button>
      </div>

            <CreateTicket requester={currentRequester} />
    </div>
  );
}