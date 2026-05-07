import BreakCalculator from "./components/BreakCalculator.jsx";
import "./styles.css";
import breaktimeLogo from "./assets/breaktime-logo.svg";

function App() {
  return (
    <>
      <main className="app-shell">
        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">PunchPause Dashboard</p>
            <h1>See every break in seconds with a faster, cleaner punch log view.</h1>
            <p className="hero-text">
              Drop in your timestamps, leave
              <span> MISSING </span>
              where needed, and let PunchPause instantly total break time, flag long pauses, and organize the full day for you.
            </p>
          </div>
          <div className="hero-brand">
            <img className="hero-logo" src={breaktimeLogo} alt="PunchPause logo" />
            <div className="hero-brand-copy">
              <span>PunchPause</span>
              <strong>Track every pause with clarity.</strong>
            </div>
          </div>
        </section>

        <BreakCalculator />
      </main>

      <p className="corner-credit">
        <span>Concept by Nikita</span>
        <strong>Brought to life by Suhird</strong>
      </p>
    </>
  );
}

export default App;
