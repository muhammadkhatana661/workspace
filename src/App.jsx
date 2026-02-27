import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    id: "hypothesis",
    label: "HYPOTHESIS",
    shortLabel: "HYP",
    days: [1, 2],
    color: "#E8C547",
    dim: "#1a1500",
    tagline: "Lock your bet before you touch the market.",
    rule: "No outreach until hypothesis is written and frozen.",
  },
  {
    id: "experiment",
    label: "EXPERIMENT",
    shortLabel: "EXP",
    days: [3, 4, 5],
    color: "#5B9CF6",
    dim: "#0d1a30",
    tagline: "Send volume. Collect signal. Touch nothing.",
    rule: "10+ attempts per day. Do NOT change your message mid-week.",
  },
  {
    id: "feedback",
    label: "FEEDBACK",
    shortLabel: "FDB",
    days: [6],
    color: "#52D68A",
    dim: "#0a1f14",
    tagline: "Read the data. Name the leak. Don't react yet.",
    rule: "Observe only. All changes happen on Day 7.",
  },
  {
    id: "decision",
    label: "DECISION",
    shortLabel: "DEC",
    days: [7],
    color: "#F06449",
    dim: "#200e0a",
    tagline: "Scale, pivot, or kill. One fix maximum.",
    rule: "Change exactly ONE variable. Lock Week 2 hypothesis.",
  },
];

const TODOS = {
  1: [
    { id: "1a", text: "Define WHO — industry + role + location in one sentence" },
    { id: "1b", text: "Define PAIN — what frustrates them every single day?" },
    { id: "1c", text: "Define OUTCOME — what is measurably different after 7 days?" },
    { id: "1d", text: "Set PRICE — commit to one number, no ranges" },
    { id: "1e", text: "Write the full hypothesis statement and freeze it (see Hypothesis tab)" },
  ],
  2: [
    { id: "2a", text: "Build one-page offer doc (Notion or Google Doc — one single link)" },
    { id: "2b", text: "Set up booking link (Calendly or GHL calendar)" },
    { id: "2c", text: "Create payment link (Stripe)" },
    { id: "2d", text: "Write outreach message — Tier A (video first) or Tier B (permission first)" },
    { id: "2e", text: "Map 30+ leads — warm contacts first, local second, cold last" },
  ],
  3: [
    { id: "3a", text: "Send 10 outreach attempts (warm/local preferred)" },
    { id: "3b", text: "Log today's numbers in the scoreboard" },
    { id: "3c", text: "Reply to any inbound within the hour" },
    { id: "3d", text: "Do NOT change your message or niche today" },
  ],
  4: [
    { id: "4a", text: "Send 10 outreach attempts (expand to cold if warm exhausted)" },
    { id: "4b", text: "Log today's numbers in the scoreboard" },
    { id: "4c", text: "Handle replies same-day — send calendar link on first interest signal" },
    { id: "4d", text: "If a call happens — run 5-phase skeleton: Frame → Diagnose → Outcome → Plan → Decision" },
  ],
  5: [
    { id: "5a", text: "Send 10 outreach attempts" },
    { id: "5b", text: "Log today's numbers in the scoreboard" },
    { id: "5c", text: "Handle all replies — zero inbox debt by end of day" },
    { id: "5d", text: "Note the most common objection or non-response pattern" },
  ],
  6: [
    { id: "6a", text: "Pull totals: attempts / pos. replies / shows / closes / revenue" },
    { id: "6b", text: "Identify your primary leak (Volume? Message? CTA? Call structure?)" },
    { id: "6c", text: "Classify all replies: Interested / Not Now / Not a Fit" },
    { id: "6d", text: "Write the sentence: 'The market told me ___' (see Decision tab)" },
    { id: "6e", text: "Do NOT make any changes yet — observation only today" },
  ],
  7: [
    { id: "7a", text: "Choose verdict: SCALE / PIVOT / KILL (see Decision tab)" },
    { id: "7b", text: "If PIVOT — name the single variable you are changing" },
    { id: "7c", text: "Write the Week 2 locked hypothesis" },
    { id: "7d", text: "Schedule Week 2 daily outreach blocks now — calendar block, not intent" },
    { id: "7e", text: "Submit scoreboard + 1-line leak summary + 1 fix to accountability group" },
  ],
};

const METRIC_FIELDS = [
  { key: "attempts", label: "Attempts", currency: false },
  { key: "replies", label: "Replies", currency: false },
  { key: "shows", label: "Shows", currency: false },
  { key: "closes", label: "Closes", currency: false },
  { key: "revenue", label: "Revenue", currency: true },
];

function phaseOf(day) {
  return PHASES.find(p => p.days.includes(day)) || PHASES[0];
}
function phaseIdxOf(day) {
  return PHASES.findIndex(p => p.days.includes(day));
}
function sumField(metricsObj, key) {
  return Object.values(metricsObj).reduce((s, v) => s + (parseFloat(v[key]) || 0), 0);
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────

const SK = "exec_w1_v3";
function loadSaved() {
  try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch { return null; }
}
function buildInit() {
  const s = loadSaved();
  return {
    startDate: s?.startDate ?? new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    checked: s?.checked ?? {},
    metrics: s?.metrics ?? Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(d => [d, { attempts: "", replies: "", shows: "", closes: "", revenue: "" }])),
    hyp: s?.hyp ?? { who: "", pain: "", outcome: "", price: "", channel: "" },
    leak: s?.leak ?? "",
    verdict: s?.verdict ?? "",
    pivotVar: s?.pivotVar ?? "",
    w2hyp: s?.w2hyp ?? "",
  };
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [rawSt, setSt] = useState(buildInit);
  const [tab, setTab] = useState("today");
  const timer = useRef(null);




  // — helpers
  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);
  const startAtMidnight = new Date(rawSt.startDate);
  startAtMidnight.setHours(0, 0, 0, 0);
  const currentDay = Math.max(1, Math.min(7, Math.floor((todayAtMidnight.getTime() - startAtMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1));
  const st = { ...rawSt, day: currentDay };

  const phase = phaseOf(st.day);
  const phaseIdx = phaseIdxOf(st.day);

  const dayDone = d => Object.values(st.checked[d] || {}).filter(Boolean).length;
  const dayTotal = d => (TODOS[d] || []).length;
  const dayPct = d => dayTotal(d) ? Math.round(dayDone(d) / dayTotal(d) * 100) : 0;

  const allDone = [1, 2, 3, 4, 5, 6, 7].reduce((s, d) => s + dayDone(d), 0);
  const allTotal = [1, 2, 3, 4, 5, 6, 7].reduce((s, d) => s + dayTotal(d), 0);
  const weekPct = Math.round(allDone / allTotal * 100);

  const upd = patch => setSt(p => ({ ...p, ...patch }));
  const stStr = JSON.stringify(st); // stable reference for effect

  const tog = (day, id) => setSt(p => ({
    ...p,
    checked: { ...p.checked, [day]: { ...(p.checked[day] || {}), [id]: !(p.checked[day]?.[id]) } }
  }));

  const setM = (day, key, val) => setSt(p => ({
    ...p,
    metrics: { ...p.metrics, [day]: { ...p.metrics[day], [key]: val } }
  }));

  const totAtt = sumField(st.metrics, "attempts");
  const totRep = sumField(st.metrics, "replies");
  const totShow = sumField(st.metrics, "shows");
  const totClose = sumField(st.metrics, "closes");
  const totRev = sumField(st.metrics, "revenue");
  const repRate = totAtt ? (totRep / totAtt * 100).toFixed(1) : null;
  const showRate = totRep ? (totShow / totRep * 100).toFixed(1) : null;

  const hypLocked = st.hyp.who && st.hyp.pain && st.hyp.outcome && st.hyp.price;

  const leaks = [
    { id: "vol", label: "VOLUME", color: "#F06449", active: totAtt < 30 && st.day >= 4, msg: "Sending < 10/day. Protect your outreach block." },
    { id: "msg", label: "MESSAGE", color: "#E8C547", active: totAtt >= 30 && parseFloat(repRate) < 1, msg: "Reply rate < 1%. Rewrite first 2 lines of your message." },
    { id: "fup", label: "FOLLOWUP", color: "#5B9CF6", active: totRep > 0 && totShow === 0, msg: "Replies exist but no calls booked. Send calendar link on first signal." },
    { id: "call", label: "CALL", color: "#52D68A", active: totShow > 0 && totClose === 0, msg: "Calls happening but no close. Tighten the 5-phase skeleton." },
  ];
  const hotLeaks = leaks.filter(l => l.active);

  // — shared style tokens
  const C = {
    bg: "#080808", bg2: "#0d0d0d", bg3: "#121212",
    border: "#1a1a1a", border2: "#222",
    text: "#C8C5BE", textHi: "#E8E4DC", textDim: "#555",
  };

  const card = (borderCol) => ({
    background: C.bg2, border: `1px solid ${borderCol || C.border}`,
    borderRadius: 6, padding: "18px 20px", marginBottom: 16,
  });

  const lbl = { fontSize: 9, letterSpacing: 3, color: C.textDim, textTransform: "uppercase", display: "block", marginBottom: 8 };

  const input = {
    width: "100%", background: "#0a0a0a", border: `1px solid ${C.border2}`,
    borderRadius: 4, color: C.textHi, padding: "8px 11px",
    fontSize: 12, fontFamily: "inherit", outline: "none", lineHeight: 1.6,
  };

  const tarea = { ...input, resize: "vertical", minHeight: 68 };

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try { localStorage.setItem(SK, JSON.stringify(st)); } catch { }
    }, 400);
  }, [stStr]);


  return (
    <div style={{ fontFamily: "'IBM Plex Mono','Fira Code','Courier New',monospace", minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#080808} ::-webkit-scrollbar-thumb{background:#222;border-radius:2px}
        input[type=number]{-moz-appearance:textfield}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .anim{animation:fadein .25s ease both}
        button{cursor:pointer;font-family:inherit}
      `}</style>

      {/* ── TOP NAV */}
      <div style={{ height: 50, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "stretch", padding: "0 20px", flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 20, borderRight: `1px solid ${C.border}`, marginRight: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: phase.color, animation: "blink 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: C.textHi }}>SSQ</span>
          <span style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 1 }}>WEEK 1</span>
        </div>

        {/* Tabs */}
        {[
          { id: "today", label: "TODAY" },
          { id: "hypothesis", label: "HYPOTHESIS" },
          { id: "scoreboard", label: "SCOREBOARD", hidden: !hypLocked },
          { id: "decision", label: "DECISION", hidden: !hypLocked || st.day < 7 },
        ].filter(t => !t.hidden).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: `2px solid ${tab === t.id ? phase.color : "transparent"}`,
            color: tab === t.id ? C.textHi : "#444",
            padding: "0 16px", fontSize: 10, letterSpacing: 2,
            transition: "color .15s, border-color .15s",
          }}>{t.label}</button>
        ))}

        {/* Right info */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          {hotLeaks.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "3px 10px", background: "#1a0c0a", border: "1px solid #F0644944", borderRadius: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F06449", animation: "blink 1.5s infinite" }} />
              <span style={{ fontSize: 9, letterSpacing: 2, color: "#F06449" }}>{hotLeaks.length} LEAK{hotLeaks.length > 1 ? "S" : ""} DETECTED</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, color: "#333" }}>WEEK</span>
            <div style={{ width: 72, height: 2, background: C.border, borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${weekPct}%`, background: phase.color, transition: "width .4s" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: phase.color }}>{weekPct}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── MAIN */}
        <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px" }} className="anim">

          {/* ═══ TODAY */}
          {tab === "today" && (
            <div>
              {/* Page header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 5 }}>
                    <span style={{ fontSize: 34, fontWeight: 700, color: C.textHi, letterSpacing: -1, lineHeight: 1 }}>Day {st.day}</span>
                    <span style={{
                      fontSize: 9, letterSpacing: 2, fontWeight: 700, color: phase.color,
                      background: phase.dim, border: `1px solid ${phase.color}44`,
                      padding: "3px 8px", borderRadius: 2
                    }}>{phase.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: phase.color, marginBottom: 4 }}>{phase.tagline}</div>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: .5 }}>Rule: {phase.rule}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                    <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx={24} cy={24} r={20} fill="none" stroke="#181818" strokeWidth={3} />
                      <circle cx={24} cy={24} r={20} fill="none" stroke={phase.color} strokeWidth={3}
                        strokeDasharray={`${(dayPct(st.day) / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                        strokeLinecap="round" style={{ transition: "stroke-dasharray .4s ease" }} />
                    </svg>
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: phase.color }}>
                      {dayPct(st.day)}%
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.textHi, lineHeight: 1 }}>
                      {dayDone(st.day)}<span style={{ fontSize: 12, color: "#3a3a3a" }}>/{dayTotal(st.day)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>tasks done</div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {!hypLocked && st.day >= 2 && (
                <div onClick={() => setTab("hypothesis")}
                  style={{ padding: "10px 16px", background: "#191200", border: "1px solid #E8C54755", borderRadius: 6, marginBottom: 16, display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8C547", animation: "blink 1.5s infinite", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#E8C547" }}>Hypothesis not locked yet — complete it before Day 3 outreach →</span>
                </div>
              )}
              {hotLeaks.map(l => (
                <div key={l.id} style={{ padding: "9px 14px", background: C.bg2, border: `1px solid ${l.color}33`, borderRadius: 6, marginBottom: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, color: l.color, padding: "2px 6px", border: `1px solid ${l.color}44`, borderRadius: 2 }}>{l.label}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{l.msg}</span>
                </div>
              ))}

              {/* Tasks */}
              <div style={card(`${phase.color}22`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={lbl}>TASKS — DAY {st.day}</span>
                  <span style={{ fontSize: 10, color: dayPct(st.day) === 100 ? "#52D68A" : "#444" }}>{dayDone(st.day)}/{dayTotal(st.day)}</span>
                </div>
                {(TODOS[st.day] || []).map(todo => {
                  const done = !!st.checked[st.day]?.[todo.id];
                  return (
                    <button key={todo.id} onClick={() => tog(st.day, todo.id)}
                      style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "none", border: "none", width: "100%", textAlign: "left", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{
                        width: 17, height: 17, borderRadius: 3, flexShrink: 0, marginTop: 1,
                        border: `1.5px solid ${done ? phase.color : "#2a2a2a"}`,
                        background: done ? phase.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s"
                      }}>
                        {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6 8 1" stroke="#080808" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span style={{ fontSize: 12, lineHeight: 1.55, color: done ? "#3a3a3a" : C.text, textDecoration: done ? "line-through" : "none", transition: "color .15s" }}>{todo.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick metric log for experiment days */}
              {st.day >= 3 && (
                <div style={card()}>
                  <span style={lbl}>LOG TODAY'S NUMBERS</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                    {METRIC_FIELDS.map(f => (
                      <div key={f.key}>
                        <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 2, marginBottom: 6 }}>{f.label.toUpperCase()}</div>
                        <div style={{ position: "relative" }}>
                          {f.currency && <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#444", fontSize: 11 }}>$</span>}
                          <input type="number" min="0" value={st.metrics[st.day][f.key]}
                            onChange={e => setM(st.day, f.key, e.target.value)}
                            style={{ ...input, paddingLeft: f.currency ? 20 : 11 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next day preview */}
              {st.day < 7 && (
                <div style={{ ...card(), opacity: 0.45, marginTop: 4 }}>
                  <span style={lbl}>TOMORROW — DAY {st.day + 1} PREVIEW</span>
                  {(TODOS[st.day + 1] || []).slice(0, 3).map(t => (
                    <div key={t.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: "#333", display: "flex", gap: 8 }}>
                      <span>○</span><span>{t.text}</span>
                    </div>
                  ))}
                  {(TODOS[st.day + 1]?.length || 0) > 3 && <div style={{ fontSize: 10, color: "#252525", paddingTop: 6 }}>+{(TODOS[st.day + 1]?.length || 0) - 3} more tasks</div>}
                </div>
              )}
            </div>
          )}

          {/* ═══ HYPOTHESIS */}
          {tab === "hypothesis" && (
            <div>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.textHi, letterSpacing: -0.5, marginBottom: 6, lineHeight: 1 }}>Locked Hypothesis</div>
                <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.8 }}>
                  Complete during Days 1–2. Once finished, do not modify for the full 7 days.<br />
                  Your hypothesis is a commitment — the market answers it, not you.
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {[
                  { key: "who", label: "WHO — Target Audience", ph: "e.g. Roofing company owners in Vancouver, 2–10 employees" },
                  { key: "price", label: "PRICE — Single Committed Number", ph: "e.g. $1,500 setup + $300/month" },
                  { key: "pain", label: "PAIN — What They Feel Every Day", ph: "e.g. Missing 40% of leads because follow-up is manual and slow" },
                  { key: "outcome", label: "OUTCOME — Measurable in 7 Days", ph: "e.g. Automated follow-up fires in 90s, books 3+ more estimates/week" },
                ].map(f => (
                  <div key={f.key} style={card()}>
                    <label style={lbl}>{f.label}</label>
                    <textarea style={tarea} placeholder={f.ph}
                      value={st.hyp[f.key]}
                      onChange={e => upd({ hyp: { ...st.hyp, [f.key]: e.target.value } })} />
                  </div>
                ))}
              </div>

              <div style={{ ...card(), marginBottom: 16 }}>
                <label style={lbl}>CHANNEL — How You Will Reach Them</label>
                <input style={input} placeholder="e.g. Cold email via Instantly + LinkedIn DMs"
                  value={st.hyp.channel}
                  onChange={e => upd({ hyp: { ...st.hyp, channel: e.target.value } })} />
              </div>

              {/* Assembled hypothesis */}
              <div style={{ background: "#090909", border: `1px solid ${hypLocked ? "#E8C54733" : C.border}`, borderRadius: 6, padding: "20px 22px" }}>
                <span style={{ ...lbl, color: hypLocked ? "#E8C547" : C.textDim }}>YOUR LOCKED HYPOTHESIS</span>
                <p style={{ fontSize: 14, lineHeight: 2.1, color: C.text }}>
                  "I believe{" "}
                  <span style={{ color: "#E8C547", borderBottom: "1px dashed #E8C54766" }}>{st.hyp.who || "[target audience]"}</span>
                  {" "}will pay{" "}
                  <span style={{ color: "#E8C547", borderBottom: "1px dashed #E8C54766" }}>{st.hyp.price || "[price]"}</span>
                  {" "}to{" "}
                  <span style={{ color: "#E8C547", borderBottom: "1px dashed #E8C54766" }}>{st.hyp.outcome || "[outcome]"}</span>
                  {" "}because{" "}
                  <span style={{ color: "#E8C547", borderBottom: "1px dashed #E8C54766" }}>{st.hyp.pain || "[their pain]"}</span>."
                </p>
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#111", borderRadius: 4, display: "flex", gap: 10 }}>
                  <span style={{ color: "#E8C547", fontSize: 13, flexShrink: 0 }}>⚑</span>
                  <span style={{ fontSize: 10, color: "#444", lineHeight: 1.7 }}>
                    Frozen from Day 2 through Day 6. You may change exactly ONE variable on Decision Day (Day 7). Changing mid-experiment means your data is worthless.
                  </span>
                </div>
                {hypLocked && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#52D68A" }} />
                    <span style={{ fontSize: 9, color: "#52D68A", letterSpacing: 2 }}>HYPOTHESIS LOCKED AND FROZEN</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ SCOREBOARD */}
          {tab === "scoreboard" && (
            <div>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.textHi, letterSpacing: -0.5, marginBottom: 6, lineHeight: 1 }}>Scoreboard</div>
                <div style={{ fontSize: 11, color: C.textDim }}>Feelings are not data. Log every outreach day. Numbers show you exactly where the leak is.</div>
              </div>

              {/* Summary stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 22 }}>
                {[
                  { l: "ATTEMPTS", v: totAtt, sub: `Target: 70+`, ok: totAtt >= 70 },
                  { l: "REPLIES", v: totRep, sub: repRate ? `${repRate}% · target ≥1%` : "target ≥1%", ok: parseFloat(repRate) >= 1 },
                  { l: "SHOWS", v: totShow, sub: showRate ? `${showRate}% of replies` : "target ≥10%", ok: parseFloat(showRate) >= 10 },
                  { l: "CLOSES", v: totClose, sub: "target > 0", ok: totClose > 0 },
                  { l: "REVENUE", v: `$${totRev}`, sub: "target > $0", ok: totRev > 0 },
                ].map(s => (
                  <div key={s.l} style={{ ...card(s.ok ? "#52D68A22" : undefined), textAlign: "center", marginBottom: 0 }}>
                    <div style={{ fontSize: 8, letterSpacing: 3, color: s.ok ? "#52D68A77" : "#333", marginBottom: 10 }}>{s.l}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: s.ok ? "#52D68A" : "#555", lineHeight: 1, marginBottom: 8 }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: s.ok ? "#2a6640" : "#252525", lineHeight: 1.4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={card()}>
                <span style={lbl}>DAY-BY-DAY</span>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
                    <thead>
                      <tr>
                        {["DAY", "PHASE", "ATTEMPTS", "REPLIES", "SHOWS", "CLOSES"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: h === "DAY" || h === "PHASE" ? "left" : "right", fontSize: 8, letterSpacing: 2, color: "#2a2a2a", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[2, 3, 4, 5, 6].map(d => {
                        const dp = phaseOf(d);
                        const active = d === st.day;
                        const isOut = d >= 3;
                        return (
                          <tr key={d} style={{ background: active ? "#0f0f0f" : "transparent", cursor: "pointer" }} onClick={() => upd({ day: d })}>
                            <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 700, color: active ? dp.color : "#3a3a3a", borderBottom: `1px solid ${C.border}` }}>
                              {active ? "▶ " : "  "}{d}
                            </td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${C.border}` }}>
                              <span style={{
                                fontSize: 8, letterSpacing: 2, fontWeight: 700, color: dp.color,
                                background: dp.dim, border: `1px solid ${dp.color}44`,
                                padding: "2px 5px", borderRadius: 2
                              }}>{dp.shortLabel}</span>
                            </td>
                            {METRIC_FIELDS.map(f => (
                              <td key={f.key} style={{ padding: "4px 10px", textAlign: "right", borderBottom: `1px solid ${C.border}` }}>
                                {!isOut && f.key !== "attempts" && f.key !== "revenue"
                                  ? <span style={{ color: "#1e1e1e", fontSize: 11 }}>—</span>
                                  : (
                                    <div onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
                                      {f.currency && <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#333", fontSize: 10 }}>$</span>}
                                      <input type="number" min="0" value={st.metrics[d][f.key]}
                                        onChange={e => setM(d, f.key, e.target.value)}
                                        style={{ ...input, width: 70, padding: f.currency ? "5px 8px 5px 18px" : "5px 8px", textAlign: "right", fontSize: 12 }} />
                                    </div>
                                  )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                      <tr style={{ background: "#050505" }}>
                        <td colSpan={2} style={{ padding: "9px 10px", fontSize: 8, letterSpacing: 2, color: "#2a2a2a" }}>TOTAL</td>
                        {METRIC_FIELDS.map(f => (
                          <td key={f.key} style={{ padding: "9px 10px", textAlign: "right", fontSize: 16, fontWeight: 700, color: "#666" }}>
                            {f.key === "attempts" ? totAtt : f.key === "replies" ? totRep : f.key === "shows" ? totShow : f.key === "closes" ? totClose : `$${totRev}`}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leak grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                {leaks.map(l => (
                  <div key={l.id} style={{ ...card(l.active ? `${l.color}33` : undefined), marginBottom: 0, opacity: l.active ? 1 : 0.3 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.active ? l.color : "#1e1e1e", flexShrink: 0 }} />
                      <span style={{ fontSize: 8, letterSpacing: 2, color: l.active ? l.color : "#252525", fontWeight: 700 }}>{l.label} LEAK</span>
                      {l.active && <span style={{ marginLeft: "auto", fontSize: 8, color: l.color, letterSpacing: 1 }}>ACTIVE</span>}
                    </div>
                    <p style={{ fontSize: 11, color: l.active ? "#888" : "#222", lineHeight: 1.6 }}>{l.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ DECISION */}
          {tab === "decision" && (
            <div>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.textHi, letterSpacing: -0.5, marginBottom: 6, lineHeight: 1 }}>Decision Day</div>
                <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.8 }}>
                  Day 7 only. Read numbers, not feelings.<br />
                  One verdict. One change maximum. Lock Week 2.
                </div>
              </div>

              {st.day < 7 && (
                <div style={{ padding: "11px 16px", background: C.bg2, border: "1px solid #F0644933", borderRadius: 6, marginBottom: 22, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#F06449" }}>⚠</span>
                  <span style={{ fontSize: 11, color: "#666" }}>Decision Day is Day 7. You're on Day {st.day}. Complete your outreach first.</span>
                </div>
              )}

              {/* Summary */}
              <div style={{ ...card(), marginBottom: 18 }}>
                <span style={lbl}>WEEK SUMMARY</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
                  {[
                    { l: "Attempts", v: totAtt, bench: "≥70", ok: totAtt >= 70 },
                    { l: "Reply Rate", v: `${repRate ?? "—"}%`, bench: "≥1%", ok: parseFloat(repRate) >= 1 },
                    { l: "Show Rate", v: `${showRate ?? "—"}%`, bench: "≥10%", ok: parseFloat(showRate) >= 10 },
                    { l: "Revenue", v: `$${totRev}`, bench: ">$0", ok: totRev > 0 },
                  ].map((r, i) => (
                    <div key={r.l} style={{ textAlign: "center", padding: "14px 8px", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ fontSize: 8, letterSpacing: 2, color: "#3a3a3a", marginBottom: 8 }}>{r.l.toUpperCase()}</div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: r.ok ? "#52D68A" : "#F06449", lineHeight: 1, marginBottom: 6 }}>{r.v}</div>
                      <div style={{ fontSize: 9, color: "#2a2a2a" }}>Target {r.bench}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leak sentence */}
              <div style={{ ...card(), marginBottom: 18 }}>
                <label style={lbl}>THE MARKET TOLD ME —</label>
                <div style={{ fontSize: 10, color: "#444", marginBottom: 10, lineHeight: 1.7 }}>Finish the sentence with one specific data-backed observation. No feelings.</div>
                <textarea style={tarea}
                  placeholder='e.g. "72 attempts, 0.4% reply rate — my first line is about me, not their pain. Message is the leak."'
                  value={st.leak}
                  onChange={e => upd({ leak: e.target.value })} />
              </div>

              {/* Verdict */}
              <div style={{ ...card(), marginBottom: 18 }}>
                <span style={lbl}>VERDICT</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { id: "scale", label: "SCALE", sub: "Signal exists. Increase volume.", color: "#52D68A", dim: "#081a0f" },
                    { id: "pivot", label: "PIVOT", sub: "One thing is broken. Change it. Re-run.", color: "#E8C547", dim: "#191200" },
                    { id: "kill", label: "KILL", sub: "Wrong market or wrong service. Start fresh.", color: "#F06449", dim: "#1a0c0a" },
                  ].map(v => (
                    <button key={v.id} onClick={() => upd({ verdict: v.id })}
                      style={{
                        background: st.verdict === v.id ? v.dim : "transparent",
                        border: `1.5px solid ${st.verdict === v.id ? v.color : "#1e1e1e"}`,
                        borderRadius: 6, padding: "16px 12px", textAlign: "center", transition: "all .15s"
                      }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: st.verdict === v.id ? v.color : "#333", letterSpacing: 2, marginBottom: 8 }}>{v.label}</div>
                      <div style={{ fontSize: 10, color: st.verdict === v.id ? "#666" : "#2a2a2a", lineHeight: 1.5 }}>{v.sub}</div>
                    </button>
                  ))}
                </div>

                {st.verdict === "pivot" && (
                  <div style={{ padding: "14px 16px", background: "#191200", border: "1px solid #E8C54744", borderRadius: 6, marginBottom: 8 }}>
                    <span style={{ ...lbl, color: "#E8C547" }}>CHANGE EXACTLY ONE VARIABLE</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                      {["Message", "Targeting (WHO)", "Price", "Channel", "CTA / Offer page"].map(v => (
                        <button key={v} onClick={() => upd({ pivotVar: st.pivotVar === v ? "" : v })}
                          style={{
                            padding: "5px 11px", border: `1px solid ${st.pivotVar === v ? "#E8C547" : "#2a2a2a"}`,
                            background: st.pivotVar === v ? "#1a1500" : "transparent",
                            color: st.pivotVar === v ? "#E8C547" : "#444",
                            borderRadius: 3, fontSize: 10, letterSpacing: 1, transition: "all .15s"
                          }}>{v}</button>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: "#444", lineHeight: 1.7 }}>Changing more than one variable means you will never know what worked. Choose one. Run it for a full week.</div>
                  </div>
                )}

                {st.verdict === "scale" && (
                  <div style={{ padding: "14px 16px", background: "#081a0f", border: "1px solid #52D68A44", borderRadius: 6 }}>
                    <span style={{ ...lbl, color: "#52D68A" }}>SCALE PROTOCOL</span>
                    {["Keep exact same message", "Keep exact same niche", "Increase to 15+ attempts/day in Week 2", "Add a second channel only after 15/day is consistent"].map(a => (
                      <div key={a} style={{ padding: "5px 0", borderBottom: `1px solid #0e2a18`, fontSize: 11, color: "#52D68A88", display: "flex", gap: 8 }}>
                        <span style={{ color: "#52D68A" }}>✓</span>{a}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Week 2 hypothesis */}
              <div style={card()}>
                <label style={lbl}>WEEK 2 — LOCKED HYPOTHESIS</label>
                <div style={{ fontSize: 10, color: "#444", marginBottom: 10, lineHeight: 1.7 }}>
                  Based on your verdict and the one fix, write the hypothesis you will run next week.
                </div>
                <textarea style={{ ...tarea, minHeight: 80 }}
                  placeholder='e.g. "I believe HVAC owners in Toronto will pay $2,000 setup + $400/month to automate missed-call follow-up because they lose 30% of inbound leads to faster competitors."'
                  value={st.w2hyp}
                  onChange={e => upd({ w2hyp: e.target.value })} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
