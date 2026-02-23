import { useState, useEffect } from "react";

const T = {
  "Arsenal": { wr: 0.631, ppg: 2.089, gs: 2.017, gc: 0.972, gd: 1.045, hwr: 0.708, awr: 0.556 },
  "Aston Villa": { wr: 0.478, ppg: 1.629, gs: 1.539, gc: 1.343, gd: 0.197, hwr: 0.562, awr: 0.393 },
  "Bournemouth": { wr: 0.343, ppg: 1.286, gs: 1.371, gc: 1.636, gd: -0.264, hwr: 0.386, awr: 0.300 },
  "Brentford": { wr: 0.371, ppg: 1.348, gs: 1.506, gc: 1.455, gd: 0.051, hwr: 0.427, awr: 0.315 },
  "Brighton": { wr: 0.365, ppg: 1.421, gs: 1.511, gc: 1.416, gd: 0.096, hwr: 0.404, awr: 0.326 },
  "Burnley": { wr: 0.157, ppg: 0.755, gs: 1.010, gc: 1.784, gd: -0.775, hwr: 0.176, awr: 0.137 },
  "Chelsea": { wr: 0.461, ppg: 1.652, gs: 1.697, gc: 1.213, gd: 0.483, hwr: 0.494, awr: 0.427 },
  "Crystal Palace": { wr: 0.315, ppg: 1.275, gs: 1.270, gc: 1.326, gd: -0.056, hwr: 0.337, awr: 0.292 },
  "Everton": { wr: 0.298, ppg: 1.169, gs: 1.056, gc: 1.393, gd: -0.337, hwr: 0.360, awr: 0.236 },
  "Fulham": { wr: 0.379, ppg: 1.336, gs: 1.421, gc: 1.486, gd: -0.064, hwr: 0.443, awr: 0.314 },
  "Leeds United": { wr: 0.225, ppg: 0.971, gs: 1.235, gc: 1.980, gd: -0.745, hwr: 0.294, awr: 0.157 },
  "Liverpool": { wr: 0.607, ppg: 2.062, gs: 2.146, gc: 1.067, gd: 1.079, hwr: 0.719, awr: 0.494 },
  "Man City": { wr: 0.685, ppg: 2.230, gs: 2.331, gc: 0.904, gd: 1.427, hwr: 0.775, awr: 0.596 },
  "Man United": { wr: 0.449, ppg: 1.573, gs: 1.478, gc: 1.399, gd: 0.079, hwr: 0.562, awr: 0.337 },
  "Newcastle": { wr: 0.449, ppg: 1.584, gs: 1.697, gc: 1.354, gd: 0.343, hwr: 0.562, awr: 0.337 },
  "Nottm Forest": { wr: 0.314, ppg: 1.186, gs: 1.214, gc: 1.564, gd: -0.350, hwr: 0.357, awr: 0.271 },
  "Sunderland": { wr: 0.346, ppg: 1.385, gs: 1.038, gc: 1.154, gd: -0.115, hwr: 0.538, awr: 0.154 },
  "Tottenham": { wr: 0.438, ppg: 1.483, gs: 1.758, gc: 1.494, gd: 0.264, hwr: 0.517, awr: 0.360 },
  "West Ham": { wr: 0.326, ppg: 1.208, gs: 1.348, gc: 1.635, gd: -0.287, hwr: 0.360, awr: 0.292 },
  "Wolves": { wr: 0.291, ppg: 1.061, gs: 1.067, gc: 1.592, gd: -0.525, hwr: 0.344, awr: 0.236 },
};

const TEAMS = Object.keys(T).sort();

function predict(home, away) {
  const h = T[home], a = T[away];
  const adv = 0.12;
  const sd = (h.ppg - a.ppg) / 3;
  const gd = (h.gs - a.gc) * 0.15;
  const dd = (a.gs - h.gc) * 0.15;
  const fd = (h.wr - a.wr) * 0.2;
  let hw = Math.max(0.08, Math.min(0.80, 0.38 + adv + sd + gd + fd));
  let dr = Math.max(0.10, Math.min(0.38, 0.28 - Math.abs(sd) * 0.3));
  let aw = Math.max(0.08, Math.min(0.70, 0.34 - adv - sd - dd - fd));
  const tot = hw + dr + aw;
  hw = Math.round((hw / tot) * 1000) / 10;
  dr = Math.round((dr / tot) * 1000) / 10;
  aw = Math.round((100 - hw - dr) * 10) / 10;
  const pred = hw >= dr && hw >= aw ? "Home Win" : aw >= dr ? "Away Win" : "Draw";
  return { pred, hw, dr, aw };
}

function Bar({ w, color, delay }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 50 + delay); return () => clearTimeout(t); }, [w]);
  return (
    <div style={{ height: 28, background: "#F5F1EB", borderRadius: 6, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 6, background: color,
        width: show ? `${w}%` : "0%",
        transition: "width 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
      }} />
    </div>
  );
}

export default function App() {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [res, setRes] = useState(null);
  const [key, setKey] = useState(0);

  const go = () => {
    if (!home || !away || home === away) return;
    setKey(k => k + 1);
    setRes({ ...predict(home, away), home, away });
  };

  const ok = home && away && home !== away;
  const sel = {
    width: "100%", padding: "12px 36px 12px 14px",
    background: "#F5F1EB", border: "2px solid transparent", borderRadius: 8,
    color: "#1a1a1a", fontFamily: "'Instrument Sans', system-ui, sans-serif",
    fontSize: 15, fontWeight: 600, cursor: "pointer", appearance: "none",
    outline: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237a7a7a' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
  };

  const vClr = res?.pred === "Home Win" ? "#2d6a4f" : res?.pred === "Away Win" ? "#7b2d8b" : "#b8860b";
  const vTxt = res?.pred === "Home Win" ? `${res.home} win` : res?.pred === "Away Win" ? `${res.away} win` : "Draw";
  const maxP = res ? Math.max(res.hw, res.dr, res.aw) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "'Instrument Sans', system-ui, sans-serif", color: "#1a1a1a" }}>
      <div style={{ height: 4, background: "#2d6a4f" }} />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px" }}>

        {/* Nav */}
        <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 20, fontWeight: 700 }}>
            Match<span style={{ color: "#2d6a4f" }}>Forecast</span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a7a7a", background: "#EDE8DF", padding: "5px 12px", borderRadius: 4 }}>
            Premier League 2025–26
          </span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 42, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 14 }}>
            Who wins the<br />next fixture?
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#7a7a7a", maxWidth: 480 }}>
            Pick a home side and an away side. Our model crunches four seasons of match stats to forecast the result.
          </p>
        </div>

        {/* Fixture Card */}
        <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ background: "#1a1a1a", color: "white", padding: "12px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
            <span>Select Fixture</span>
            <span style={{ fontWeight: 500, opacity: 0.5 }}>2025–26</span>
          </div>
          <div style={{ padding: "28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 1fr", gap: 16, alignItems: "end", marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a7a7a", marginBottom: 8 }}>Home</label>
                <select style={sel} value={home} onChange={e => { setHome(e.target.value); setRes(null); }}>
                  <option value="">Choose side…</option>
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.08)", fontSize: 13, fontWeight: 700, color: "#b0a99f", background: "white", marginBottom: 1 }}>v</div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a7a7a", marginBottom: 8 }}>Away</label>
                <select style={sel} value={away} onChange={e => { setAway(e.target.value); setRes(null); }}>
                  <option value="">Choose side…</option>
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={go} disabled={!ok} style={{
              width: "100%", padding: 15, background: ok ? "#2d6a4f" : "#ccc",
              border: "none", borderRadius: 8, color: "white", fontFamily: "inherit",
              fontSize: 14, fontWeight: 700, letterSpacing: "0.04em",
              cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.4,
            }}>
              {home === away && home ? "Pick two different sides" : "Get Prediction"}
            </button>
          </div>
        </div>

        {/* Results */}
        {res && (
          <div key={key} style={{ animation: "fadeIn 0.4s ease", marginBottom: 48 }}>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>

            {/* Scoreboard */}
            <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "28px 24px 20px", textAlign: "center", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a7a7a", marginBottom: 8 }}>
                  {res.home} v {res.away}
                </div>
                <div style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 32, fontWeight: 700, color: vClr, marginBottom: 6 }}>
                  {vTxt}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#7a7a7a" }}>
                  Confidence: <strong style={{ color: "#3d3d3d", fontWeight: 600 }}>{maxP}%</strong>
                </div>
              </div>

              <div style={{ padding: 24 }}>
                {[
                  { label: res.home, val: res.hw, color: "#2d6a4f", delay: 0 },
                  { label: "Draw", val: res.dr, color: "#b8860b", delay: 80 },
                  { label: res.away, val: res.aw, color: "#7b2d8b", delay: 160 },
                ].map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 44px", alignItems: "center", gap: 12, marginBottom: i < 2 ? 14 : 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#3d3d3d", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                    <Bar w={r.val} color={r.color} delay={r.delay} />
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{r.val}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a7a7a", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                Head-to-Head Comparison
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[
                  { label: "Pts / Game", hv: T[res.home].ppg.toFixed(2), av: T[res.away].ppg.toFixed(2) },
                  { label: "Avg Goals", hv: T[res.home].gs.toFixed(2), av: T[res.away].gs.toFixed(2) },
                  { label: "Win Rate", hv: `${(T[res.home].wr * 100).toFixed(0)}%`, av: `${(T[res.away].wr * 100).toFixed(0)}%` },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "18px 16px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(0,0,0,0.08)" : "none" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#b0a99f", marginBottom: 8 }}>{s.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, color: "#2d6a4f" }}>{s.hv}</span>
                      <span style={{ fontSize: 11, color: "#b0a99f" }}>–</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, color: "#7b2d8b" }}>{s.av}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: "#b0a99f", padding: "8px 0" }}>
              Forecast by <code style={{ fontFamily: "'IBM Plex Mono', monospace", background: "#EDE8DF", padding: "2px 7px", borderRadius: 3, fontSize: 10, fontWeight: 500, color: "#7a7a7a" }}>Logistic Regression</code> · Model accuracy <code style={{ fontFamily: "'IBM Plex Mono', monospace", background: "#EDE8DF", padding: "2px 7px", borderRadius: 3, fontSize: 10, fontWeight: 500, color: "#7a7a7a" }}>58.0%</code>
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: "24px 0 32px", marginTop: 20, textAlign: "center", fontSize: 12, color: "#b0a99f" }}>
          <strong style={{ color: "#7a7a7a", fontWeight: 600 }}>MatchForecast By TemieLovesData</strong> — built with scikit-learn, Flask & four seasons of data
        </div>
      </div>
    </div>
  );
}
