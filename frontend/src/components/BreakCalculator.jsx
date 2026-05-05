import { memo, useDeferredValue, useMemo, useState, startTransition } from "react";

const SAMPLE_INPUT = "";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "/api" : "https://punchpause-4.onrender.com")
).replace(/\/$/, "");

function formatExactDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatMinutesAsDuration(totalMinutes) {
  if (totalMinutes === null || Number.isNaN(totalMinutes)) {
    return "";
  }

  return formatExactDuration(totalMinutes * 60);
}

const ResultPanel = memo(function ResultPanel({ result, exceededMinutes, remainingMinutes }) {
  return (
    <article className="panel result-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Results</p>
          <h2>Break summary</h2>
        </div>
      </div>

      {result ? (
        <>
          <div className="summary-grid">
            <div className="summary-card accent-card">
              <span>Total Break Time</span>
              <strong>{formatMinutesAsDuration(Number(result.total_break_minutes))}</strong>
            </div>
            {exceededMinutes !== null ? (
              <div className="summary-card">
                <span>Exceeded Time</span>
                <strong>{formatMinutesAsDuration(exceededMinutes)}</strong>
              </div>
            ) : (
              <div className="summary-card">
                <span>Time Left From 60</span>
                <strong>{formatMinutesAsDuration(remainingMinutes)}</strong>
              </div>
            )}
          </div>

          <div className="break-list">
            {result.breaks.length ? (
              result.breaks.map((item, index) => (
                <div className="break-row" key={`${item.from}-${item.to}-${index}`}>
                  <div>
                    <p className="break-index">Break {index + 1}</p>
                    <strong>
                      {item.from} to {item.to}
                    </strong>
                  </div>
                  <div className="duration-pill">{formatExactDuration(item.duration_seconds)}</div>
                </div>
              ))
            ) : (
              <p className="empty-state">
                No valid break pairs were found in this list.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="empty-panel">
          <p>Your break totals will appear here after you submit timestamps.</p>
        </div>
      )}
    </article>
  );
});

function BreakCalculator() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const deferredInput = useDeferredValue(input);

  const parsedTimestamps = useMemo(() => {
    return deferredInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [deferredInput]);

  const timestampCount = parsedTimestamps.length;

  const totalMinutes = result ? Number(result.total_break_minutes) : null;
  const exceededMinutes =
    totalMinutes !== null && totalMinutes > 60
      ? Math.round((totalMinutes - 60) * 100) / 100
      : null;
  const remainingMinutes =
    totalMinutes !== null && totalMinutes <= 60
      ? Math.round((60 - totalMinutes) * 100) / 100
      : null;

  const handleSubmit = async () => {
    const timestamps = input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (timestamps.length < 2) {
      setError("Add at least two timestamps before calculating.");
      startTransition(() => setResult(null));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/calculate-breaks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timestamps,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || `Request failed with status ${response.status}`);
      }

      startTransition(() => setResult(data));
    } catch (requestError) {
      startTransition(() => setResult(null));
      setError(
        requestError.message ||
          "The calculation request failed. Check that the backend server is running and the API URL is correct."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="workspace">
      <article className="panel input-panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">Input</p>
            <h2>Paste timestamps line by line</h2>
          </div>
          <div className="status-chip">{timestampCount} entries</div>
        </div>

        <textarea
          className="timestamp-input"
          rows="12"
          placeholder="10:41:26 AM"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        <div className="hint-row">
          <span>Format: hh:mm:ss AM/PM</span>
          <span>Use MISSING to skip incomplete pairs</span>
        </div>

        <div className="action-row">
          <button className="primary-button" type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Calculating..." : "Calculate Break"}
          </button>
          <button className="ghost-button" type="button" onClick={() => setInput(SAMPLE_INPUT)}>
            Reset
          </button>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
      </article>

      <ResultPanel
        result={result}
        exceededMinutes={exceededMinutes}
        remainingMinutes={remainingMinutes}
      />
    </section>
  );
}

export default BreakCalculator;
