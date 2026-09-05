import { useEffect, useState } from "react";
import {
  DevelopmentRequester,
  getDevelopmentRequesters,
} from "../api.js";

interface RequesterSelectionProps {
  onSelect: (requester: DevelopmentRequester) => void;
}

type UiState =
  | "loading"
  | "ready"
  | "empty"
  | "error";

export default function RequesterSelection({
  onSelect,
}: RequesterSelectionProps) {
  const [requesters, setRequesters] = useState<
    DevelopmentRequester[]
  >([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [state, setState] =
    useState<UiState>("loading");

  useEffect(() => {
    async function loadRequesters() {
      try {
        setState("loading");

        const data =
          await getDevelopmentRequesters();

        setRequesters(data);

        if (data.length === 0) {
          setState("empty");
        } else {
          setState("ready");
        }
      } catch {
        setState("error");
      }
    }

    loadRequesters();
  }, []);

  function handleContinue() {
    const requester =
      requesters.find(
        (item) =>
          item.id === selectedId
      );

    if (requester) {
      onSelect(requester);
    }
  }

  return (
    <div
      className="container py-5"
      style={{ maxWidth: 640 }}
    >
      <div className="card zen-selection-card shadow-sm">
        <div className="card-body p-4">
          <div className="mb-4">
            <h1 className="h3 mb-2">
              TokTickIT
            </h1>

            <p className="text-muted mb-0">
              Requester Ticketing MVP
            </p>
          </div>

          <div className="mb-4">
            <h2 className="h5 mb-2">
              Development Requester Selection
            </h2>

            <p className="text-muted mb-0">
              Select a Development Requester to
              test requester-specific ticket
              behavior. This is not a login
              screen. Authentication and
              role-based access will be
              introduced in Lab 3.
            </p>
          </div>

          {state === "loading" && (
            <div
              className="alert alert-light border"
              role="status"
            >
              Loading Development Requesters...
            </div>
          )}

          {state === "empty" && (
            <div
              className="alert alert-warning"
              role="alert"
            >
              No active Development Requesters
              are available.
            </div>
          )}

          {state === "error" && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              Unable to load Development
              Requesters. Please try again.
            </div>
          )}

          {state === "ready" && (
            <>
              <label
                htmlFor="developmentRequester"
                className="form-label"
              >
                Development Requester
              </label>

              <select
                id="developmentRequester"
                className="form-select"
                value={selectedId}
                onChange={(event) =>
                  setSelectedId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select a Requester
                </option>

                {requesters.map(
                  (requester) => (
                    <option
                      key={requester.id}
                      value={requester.id}
                    >
                      {requester.displayName} (
                      {requester.email})
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                className="btn btn-success w-100 mt-3"
                disabled={!selectedId}
                onClick={handleContinue}
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}