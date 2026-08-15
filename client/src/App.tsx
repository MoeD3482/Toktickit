import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  void categories;

  async function handleCheck() {
    setState("loading");
    setErrorMessage("");
    try {
      await checkSystem();
      setState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to connect to TokTickIT API");
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success mb-3" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "success" && (
        <div className="mt-3">
          <p className="mb-0">
            <strong>System Status:</strong> <span className="text-success">Online</span>
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="mt-3">
          <p className="mb-1">
            <strong>System Status:</strong> <span className="text-danger">Offline</span>
          </p>
          <p className="text-danger mb-0">{errorMessage || "Unable to connect to TokTickIT API"}</p>
        </div>
      )}
    </div>
  );
}
