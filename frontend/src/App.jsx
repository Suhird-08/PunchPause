import BreakCalculator from "./components/BreakCalculator.jsx";
import "./styles.css";
import breaktimeLogo from "./assets/breaktime-logo.svg";

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">PunchPause Dashboard</p>
          <h1>Calculate break durations from your punch log in seconds.</h1>
          <p className="hero-text">
            Paste timestamps line by line, keep missing values as
            <span> MISSING </span>
            when needed, and let the app total the gaps for you.
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
  );
}

export default App;
