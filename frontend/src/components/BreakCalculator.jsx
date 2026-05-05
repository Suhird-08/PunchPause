import { memo, useDeferredValue, useMemo, useState, startTransition } from "react";
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

function getBreakTone(totalSeconds) {
  const minutes = totalSeconds / 60;

  if (minutes < 15) {
    return "short";
  }

  if (minutes <= 30) {
    return "medium";
  }

  return "long";
}

function getBreakToneLabel(tone) {
  if (tone === "short") {
    return "Short break";
  }

  if (tone === "medium") {
    return "Medium break";
  }

  return "Long break";
}

const ResultPanel = memo(function ResultPanel({
  result,
  exceededMinutes,
  remainingMinutes,
  totalMinutes,
  longestBreakSeconds,
}) {
  const totalBreaks = result?.breaks.length ?? 0;
  const breakTargetProgress =
    totalMinutes !== null ? Math.min((totalMinutes / 60) * 100, 100) : 0;

  return (
    <article className="panel result-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Results</p>
          <h2>Break summary</h2>
        </div>
      </div>

      {result ? (
        <div className="results-stack fade-in">
          <div className="hero-metric-card">
            <div>
              <p className="section-label">Total Break Time</p>
              <strong className="hero-metric-value">
                {formatMinutesAsDuration(Number(result.total_break_minutes))}
              </strong>
              <p className="hero-metric-caption">
                {totalBreaks} recorded break{totalBreaks === 1 ? "" : "s"} across the current punch log.
              </p>
            </div>
            <div className="hero-metric-ring" aria-hidden="true">
              <div className="hero-metric-ring-inner">
                <span>{Math.round(breakTargetProgress)}%</span>
                <small>of 60 min</small>
              </div>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card insight-card">
              <span>{exceededMinutes !== null ? "Exceeded Time" : "Time Left From 60"}</span>
              <strong>
                {exceededMinutes !== null
                  ? formatMinutesAsDuration(exceededMinutes)
                  : formatMinutesAsDuration(remainingMinutes)}
              </strong>
              <p className="summary-note">
                {exceededMinutes !== null
                  ? "Regularize your break on Keka."
                  : "You are still within the recommended daily break window."}
              </p>
            </div>
            <div className="summary-card stat-card">
              <span>Longest Break</span>
              <strong>{formatExactDuration(longestBreakSeconds)}</strong>
              <p className="summary-note">Longest single pause detected from your timestamps.</p>
            </div>
            <div className="summary-card stat-card">
              <span>Break Count</span>
              <strong>{totalBreaks}</strong>
              <p className="summary-note">Each card below represents one complete break pair.</p>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <p className="section-label">Break Distribution</p>
                <h3>Duration overview</h3>
              </div>
            </div>
            <div className="mini-chart" role="img" aria-label="Bar chart showing break durations">
              {result.breaks.map((item, index) => {
                const tone = getBreakTone(item.duration_seconds);
                const barHeight = longestBreakSeconds
                  ? Math.max(20, (item.duration_seconds / longestBreakSeconds) * 100)
                  : 20;

                return (
                  <div className="chart-bar-group" key={`${item.from}-${item.to}-chart-${index}`}>
                    <span className="chart-value">{formatExactDuration(item.duration_seconds)}</span>
                    <div
                      className={`chart-bar ${tone}`}
                      style={{ height: `${barHeight}%` }}
                      title={`${getBreakToneLabel(tone)} - ${formatExactDuration(item.duration_seconds)}`}
                    />
                    <span className="chart-label">B{index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="break-list">
            {result.breaks.length ? (
              result.breaks.map((item, index) => {
                const tone = getBreakTone(item.duration_seconds);

                return (
                  <div className={`break-row ${tone}`} key={`${item.from}-${item.to}-${index}`}>
                    <div className="break-copy">
                      <p className="break-index">Break {index + 1}</p>
                      <strong className="break-time-range">
                        {item.from} to {item.to}
                      </strong>
                      <p className="break-meta">{getBreakToneLabel(tone)}</p>
                    </div>
                    <div className={`duration-pill ${tone}`}>
                      {formatExactDuration(item.duration_seconds)}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">
                No valid break pairs were found in this list.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-panel">
          <div className="empty-illustration" aria-hidden="true">
            <span>{"\u23F1"}</span>
          </div>
          <h3>No data yet</h3>
          <p>Paste timestamps to calculate breaks.</p>
        </div>
      )}
    </article>
  );
});

function BreakCalculator() {
  const [input, setInput] = useState("");
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
  const longestBreakSeconds = result
    ? result.breaks.reduce((max, item) => Math.max(max, item.duration_seconds), 0)
    : 0;
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
            <p className="panel-subtext">
              Add punch-out and punch-in times in sequence. Keep <strong>MISSING</strong> for skipped entries.
            </p>
          </div>
          <div className="status-chip">{timestampCount} entries</div>
        </div>

        <textarea
          className="timestamp-input"
          rows="12"
          placeholder={`10:41:26 AM
11:02:14 AM
MISSING`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        <div className="hint-row">
          <span>Format: hh:mm:ss AM/PM</span>
          <span>Use MISSING to skip incomplete pairs</span>
        </div>

        <div className="action-row">
          <button className="primary-button" type="button" onClick={handleSubmit} disabled={isLoading}>
            <span aria-hidden="true">{"\u23F1"}</span>
            {isLoading ? "Calculating..." : "Calculate Break"}
          </button>
          <button className="ghost-button" type="button" onClick={() => setInput("")}>
            Reset
          </button>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}
      </article>

      <ResultPanel
        result={result}
        exceededMinutes={exceededMinutes}
        remainingMinutes={remainingMinutes}
        totalMinutes={totalMinutes}
        longestBreakSeconds={longestBreakSeconds}
      />
    </section>
  );
}

export default BreakCalculator;
