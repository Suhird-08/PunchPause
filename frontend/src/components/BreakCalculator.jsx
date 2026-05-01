import { useMemo, useState } from "react";
import axios from "axios";

const SAMPLE_INPUT = "";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://punchpause-4.onrender.com";
const API_URL = `${API_BASE_URL}/calculate-breaks`;

function BreakCalculator() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const timestampCount = useMemo(() => {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean).length;
  }, [input]);

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
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(API_URL, { timestamps });
      setResult(response.data);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError.response?.data?.detail ||
          "The calculation request failed. Check that the backend container or local server is running."
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
            Load Example
          </button>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
      </article>

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
                <span>Total Minutes</span>
                <strong>{result.total_break_minutes}</strong>
              </div>
              {exceededMinutes !== null ? (
                <div className="summary-card">
                  <span>Exceeded Time</span>
                  <strong>{exceededMinutes} mins</strong>
                </div>
              ) : (
                <div className="summary-card">
                  <span>Time Left From 60</span>
                  <strong>{remainingMinutes} mins</strong>
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
                    <div className="duration-pill">
                      {Math.round(item.duration_seconds / 60)} mins
                    </div>
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
    </section>
  );
}

export default BreakCalculator;
