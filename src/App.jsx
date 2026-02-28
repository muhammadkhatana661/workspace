import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

// Task configuration is deliberately simple and declarative so an admin can
// customize tomorrow's flow just by editing this array.
//
// Concepts:
// - Stage         → High level bucket ("Hypothesis", "Outreach", etc.)
// - Task Group    → A unit of work with its own deadline window in days
// - Todo / Group  → Leaf todo item or a nested todo group (tree structure)
//   - When `isGroup` is true, `children` contains its sub‑todos/groups.
//   - Todo groups themselves do NOT have timers — only leaf todos do.
//
// Day ranges are relative to the existing `startDate` logic (Day 1..7).

const TASK_STAGES = [
  {
    id: "hypothesis-stage",
    label: "Hypothesis",
    color: "#E8C547",
    dim: "#1a1500",
    startDay: 1,
    endDay: 1,
    taskGroups: [
      {
        id: "hypothesis-1",
        title: "Lock your hypothesis",
        // Must be completed on Day 1
        startDay: 1,
        endDay: 1,
        todos: [
          {
            id: "hypo-who",
            label: "Define WHO — industry + role + location in one sentence",
            isGroup: false,
            minutes: 20,
          },
          {
            id: "hypo-pain",
            label: "Define PAIN — what frustrates them every single day?",
            isGroup: false,
            minutes: 20,
          },
          {
            id: "hypo-outcome",
            label: "Define OUTCOME — what is measurably different after 7 days?",
            isGroup: false,
            minutes: 20,
          },
          {
            id: "hypo-price-group",
            label: "Price + final hypothesis statement",
            isGroup: true,
            children: [
              {
                id: "hypo-price",
                label: "Set PRICE — commit to one number, no ranges",
                isGroup: false,
                minutes: 10,
              },
              {
                id: "hypo-statement",
                label: "Write the full hypothesis statement and freeze it",
                isGroup: false,
                minutes: 15,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "prereq-stage",
    label: "Getting Prerequisites ready",
    color: "#5B9CF6",
    dim: "#0d1a30",
    // Spans Day 1–2
    startDay: 1,
    endDay: 2,
    taskGroups: [
      {
        id: "prereq-1",
        title: "Get infrastructure ready",
        startDay: 1,
        endDay: 2,
        todos: [
          {
            id: "prereq-offer-doc",
            label: "Build one-page offer doc",
            isGroup: false,
            minutes: 25,
          },
          {
            id: "prereq-links",
            label: "Booking + payment + outreach system",
            isGroup: true,
            children: [
              {
                id: "prereq-booking",
                label: "Set up booking link (Calendly or similar)",
                isGroup: false,
                minutes: 10,
              },
              {
                id: "prereq-payment",
                label: "Create payment link (Stripe or similar)",
                isGroup: false,
                minutes: 10,
              },
              {
                id: "prereq-outreach-msg",
                label: "Write outreach message for primary channel",
                isGroup: false,
                minutes: 20,
              },
            ],
          },
          {
            id: "prereq-leads",
            label: "Map 30+ leads",
            isGroup: false,
            minutes: 30,
          },
        ],
      },
    ],
  },
  {
    id: "outreach-stage",
    label: "Outreach",
    color: "#52D68A",
    dim: "#0a1f14",
    // Outreach spans Days 2–6; we assign a task group on each day.
    startDay: 2,
    endDay: 6,
    taskGroups: [
      {
        id: "outreach-2",
        title: "Outreach Day 2",
        startDay: 2,
        endDay: 2,
        todos: [
          { id: "outreach-2-send", label: "Send 10 outreach attempts", isGroup: false, minutes: 40 },
          {
            id: "outreach-2-followup",
            label: "Follow up on warm leads",
            isGroup: true,
            children: [
              { id: "outreach-2-log", label: "Log today's numbers", isGroup: false, minutes: 10 },
              { id: "outreach-2-replies", label: "Reply to any inbound within the hour", isGroup: false, minutes: 10 },
            ],
          },
        ],
      },
      {
        id: "outreach-3",
        title: "Outreach Day 3",
        startDay: 3,
        endDay: 3,
        todos: [
          { id: "outreach-3-send", label: "Send 10 outreach attempts", isGroup: false, minutes: 40 },
          { id: "outreach-3-log", label: "Log today's numbers", isGroup: false, minutes: 10 },
        ],
      },
      {
        id: "outreach-4",
        title: "Outreach Day 4",
        startDay: 4,
        endDay: 4,
        todos: [
          { id: "outreach-4-send", label: "Send 10 outreach attempts", isGroup: false, minutes: 40 },
          { id: "outreach-4-log", label: "Log today's numbers", isGroup: false, minutes: 10 },
        ],
      },
      {
        id: "outreach-5",
        title: "Outreach Day 5",
        startDay: 5,
        endDay: 5,
        todos: [
          { id: "outreach-5-send", label: "Send 10 outreach attempts", isGroup: false, minutes: 40 },
          { id: "outreach-5-log", label: "Log today's numbers", isGroup: false, minutes: 10 },
        ],
      },
      {
        id: "outreach-6",
        title: "Outreach Day 6",
        startDay: 6,
        endDay: 6,
        todos: [
          { id: "outreach-6-review", label: "Review responses and classify replies", isGroup: false, minutes: 30 },
          { id: "outreach-6-leak", label: "Write one leak sentence from the week so far", isGroup: false, minutes: 15 },
        ],
      },
    ],
  },
  {
    id: "decision-stage",
    label: "Make Decision",
    color: "#F06449",
    dim: "#200e0a",
    startDay: 7,
    endDay: 7,
    taskGroups: [
      {
        id: "decision-1",
        title: "Decision Day",
        startDay: 7,
        endDay: 7,
        todos: [
          {
            id: "decision-verdict-group",
            label: "Pick your verdict and write Week 2 hypothesis",
            isGroup: true,
            children: [
              { id: "decision-verdict", label: "Choose verdict: SCALE / PIVOT / KILL", isGroup: false, minutes: 10 },
              { id: "decision-w2", label: "Write the Week 2 locked hypothesis", isGroup: false, minutes: 20 },
            ],
          },
        ],
      },
    ],
  },
];

const METRIC_FIELDS = [
  { key: "attempts", label: "Attempts", currency: false },
  { key: "replies", label: "Replies", currency: false },
  { key: "shows", label: "Shows", currency: false },
  { key: "closes", label: "Closes", currency: false },
  { key: "revenue", label: "Revenue", currency: true },
];

function sumField(metricsObj, key) {
  return Object.values(metricsObj).reduce((s, v) => s + (parseFloat(v[key]) || 0), 0);
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function getEmptyState() {
  return {
    startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    checked: {},
    metrics: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(d => [d, { attempts: "", replies: "", shows: "", closes: "", revenue: "" }])),
    hyp: { who: "", pain: "", outcome: "", price: "", channel: "" },
    leak: "",
    verdict: "",
    pivotVar: "",
    w2hyp: "",
  };
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App({ supabase, session }) {
  return <SSQTracker supabase={supabase} session={session} />;
}

function SSQTracker({ supabase, session }) {
  const [rawSt, setSt] = useState(getEmptyState);
  const [tab, setTab] = useState("today");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const timer = useRef(null);
  const lastSavedState = useRef(null);
  const [interactionError, setInteractionError] = useState("");

  useEffect(() => {
    let subscription;

    async function loadData() {
      const { data, error } = await supabase
        .from('app_state')
        .select('data')
        .eq('id', 1)
        .single();

      if (!error && data && data.data) {
        setSt(prev => ({ ...prev, ...data.data }));
      }
      setLoadingInitial(false);
    }

    loadData();

    subscription = supabase
      .channel('public:app_state')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.1' }, (payload) => {
        if (payload.new && payload.new.data) {
          const remoteStr = JSON.stringify(payload.new.data);

          // Ignore echo of our own recent save
          if (remoteStr === lastSavedState.current) {
            return;
          }

          setSt(prev => {
            if (JSON.stringify(prev) !== remoteStr) {
              return payload.new.data; // Adopt the remote truth completely
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    }
  }, []);




  // — helpers
  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);
  const startAtMidnight = new Date(rawSt.startDate);
  startAtMidnight.setHours(0, 0, 0, 0);
  const currentDay = Math.max(1, Math.min(7, Math.floor((todayAtMidnight.getTime() - startAtMidnight.getTime()) / (1000 * 60 * 60 * 24)) + 1));
  const st = { ...rawSt, day: currentDay };

  // ── task helpers
  const flatTaskGroups = [];
  TASK_STAGES.forEach((stage, sIdx) => {
    stage.taskGroups.forEach((g, gIdx) => {
      flatTaskGroups.push({ stageIdx: sIdx, groupIdx: gIdx, stage, group: g });
    });
  });

  const activeIdx = Math.min(
    flatTaskGroups.length - 1,
    rawSt?.activeTaskIndex ?? 0
  );
  const activeEntry = flatTaskGroups[activeIdx] || flatTaskGroups[0];
  const activeStage = activeEntry.stage;
  const activeGroup = activeEntry.group;

  const countTodos = (todos) => {
    return todos.reduce((acc, t) => {
      if (t.isGroup && t.children) {
        return acc + countTodos(t.children);
      }
      return acc + 1;
    }, 0);
  };

  const isTodoDone = (todo) => {
    const key = `${todo.id}`;
    return !!st.checkedTodos?.[key];
  };

  const groupDoneCount = (group) => {
    let done = 0;
    const walk = (todos) => {
      todos.forEach(t => {
        if (t.isGroup && t.children) {
          walk(t.children);
        } else if (isTodoDone(t)) {
          done += 1;
        }
      });
    };
    walk(group.todos || []);
    return done;
  };

  const groupTotalCount = (group) => countTodos(group.todos || []);
  const groupPct = (group) => {
    const total = groupTotalCount(group);
    if (!total) return 0;
    return Math.round(groupDoneCount(group) / total * 100);
  };

  const groupHasDelay = (group) => {
    const meta = st.todoMeta || {};
    // If we're past this group's deadline and it's not fully complete, treat it as delayed.
    if (st.day > group.endDay && groupPct(group) < 100) {
      return true;
    }
    let delayed = false;
    const walk = (todos) => {
      todos.forEach(t => {
        if (t.isGroup && t.children) {
          walk(t.children);
        } else {
          const key = `${t.id}`;
          if (meta[key]?.isDelayed) {
            delayed = true;
          }
        }
      });
    };
    walk(group.todos || []);
    return delayed;
  };

  const activeGroupDelayed = groupHasDelay(activeGroup);

  const allDone = flatTaskGroups.reduce((sum, e) => sum + groupDoneCount(e.group), 0);
  const allTotal = flatTaskGroups.reduce((sum, e) => sum + groupTotalCount(e.group), 0);
  const weekPct = allTotal ? Math.round(allDone / allTotal * 100) : 0;

  const stageForDay = (day) =>
    TASK_STAGES.find(s => day >= s.startDay && day <= s.endDay) || TASK_STAGES[0];

  const upd = patch => setSt(p => ({ ...p, ...patch }));
  const stStr = JSON.stringify(st); // stable reference for effect
  const togTodo = (todo, context = {}) => {
    const key = `${todo.id}`;
    const myEmail = session?.user?.email || null;

    setSt(p => {
      const prevChecked = !!p.checkedTodos?.[key];
      const nextChecked = !prevChecked;

      const nextCheckedTodos = {
        ...(p.checkedTodos || {}),
        [key]: nextChecked,
      };

      // If unchecking, just flip the boolean and keep any existing metadata.
      if (!nextChecked) {
        return {
          ...p,
          checkedTodos: nextCheckedTodos,
        };
      }

      const lockedInfo = p.lockedTodos?.[key] || {};
      const startedAt = lockedInfo.lockedAt || context.lockedAt || Date.now();
      const completedAt = Date.now();
      const completedBy =
        myEmail ||
        context.lockedByEmail ||
        lockedInfo.lockedBy ||
        p.todoMeta?.[key]?.completedBy ||
        null;

      const durationMs = completedAt - startedAt;
      const prevMeta = p.todoMeta || {};
      const existingMeta = prevMeta[key] || {};
      const isDelayed = context.isDelayed ?? existingMeta.isDelayed ?? false;

      return {
        ...p,
        checkedTodos: nextCheckedTodos,
        todoMeta: {
          ...prevMeta,
          [key]: {
            ...existingMeta,
            startedAt,
            completedAt,
            completedBy,
            durationMs,
            isDelayed,
          },
        },
      };
    });
  };

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
    { id: "call", label: "CALL", color: "#52D68A", active: totShow > 0 && totClose === 0, msg: "Calls happening but no close. Tighten your call structure." },
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

  // timer bookkeeping for locked todos (minutes countdown)
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (loadingInitial) return;

    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        lastSavedState.current = JSON.stringify(st);
        await supabase
          .from('app_state')
          .update({ data: st })
          .eq('id', 1);
      } catch (e) {
        console.error("Error saving state", e);
      }
    }, 800);
  }, [stStr, loadingInitial]);

  if (loadingInitial) {
    return (
      <div style={{ background: "#080808", color: "#C8C5BE", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        Loading SSQ Tracker State...
      </div>
    );
  }
  // Helper component rendered inline for task trees with locking + timers
  function TaskList({ todos, onToggle, isDone, accentColor, C, depth = 0, onInteractionError, inheritedLockEmail, prevTasksDone = true }) {

    // 1. Group-level locking: Check if ANY task in this current array (or sub-arrays) is locked.
    // That lock applies to the *entire* list of todos on this level and below.
    const findGroupLock = (list) => {
      for (const t of list) {
        if (st.lockedTodos?.[t.id]?.lockedBy) return st.lockedTodos[t.id].lockedBy;
        if (t.isGroup && t.children) {
          const childLock = findGroupLock(t.children);
          if (childLock) return childLock;
        }
      }
      return null;
    };

    // The group is locked to whoever started any task inside it.
    const thisGroupLockEmail = findGroupLock(todos) || inheritedLockEmail;

    // We will keep a running tally of "are all previous siblings done?"
    let allPreviousSiblingsDone = prevTasksDone;

    return (
      <div>
        {todos.map((todo, idx) => {
          const done = !todo.isGroup && isDone(todo);
          // If it's a group, checking if all its children are done
          const isGroupFullyDone = todo.isGroup ? groupPct(todo) === 100 : done;

          const isGroup = todo.isGroup;
          const key = todo.id;
          const meta = st.todoMeta?.[key];
          const isDelayed = !!meta?.isDelayed;

          // An individual todo is locked either explicitly, or implicitly by the group lock.
          const explicitLock = st.lockedTodos?.[key];
          const lockedByEmail = explicitLock?.lockedBy || thisGroupLockEmail;
          const locked = !!lockedByEmail;
          const lockedAt = explicitLock?.lockedAt || (locked ? Date.now() : null); // fallback if implicitly locked

          const minutes = todo.minutes || 0;
          const deadlineMs = minutes * 60 * 1000;
          const remainingMs = locked && explicitLock?.lockedAt ? Math.max(0, explicitLock.lockedAt + deadlineMs - now) : null;
          const remainingMin = remainingMs != null ? Math.floor(remainingMs / 60000) : null;
          const remainingSec = remainingMs != null ? Math.floor((remainingMs % 60000) / 1000) : null;

          const myEmail = session?.user?.email;
          const isLockedByMe = locked && (lockedByEmail === myEmail);

          // Sequential Block Logic: This task is blocked if previous siblings are NOT done.
          const sequentialBlocked = !allPreviousSiblingsDone;

          // After processing this todo, update the running tally for the NEXT sibling in the map.
          allPreviousSiblingsDone = allPreviousSiblingsDone && isGroupFullyDone;
          // Support legacy lockedTodos without a lockedBy email by prioritizing myEmail (assume my old lock if missing email).
          const isLockedByOther = !!lockedByEmail && lockedByEmail !== myEmail;

          const toggleLock = () => {
            if (isLockedByOther || sequentialBlocked) {
              if (onInteractionError) {
                if (sequentialBlocked) {
                  onInteractionError("Please complete the previous task first.");
                } else if (lockedByEmail) {
                  onInteractionError(`This entire task group is in progress by ${lockedByEmail.split('@')[0]}.`);
                } else {
                  onInteractionError("This task group is in progress by someone else.");
                }
              }
              return;
            }

            if (onInteractionError) {
              onInteractionError("");
            }

            setSt(p => {
              const existing = p.lockedTodos || {};
              // For group locking locking, if the user starts the first task, all tasks in this group should logically derive from that lock or we just lock the parent context. 
              // A simpler way: just lock THIS specific todo, but the `groupLockEmail` prop passed down from the parent group will enforce uniform visual locking.
              // To ensure the actual lock logic covers the whole group, we can set a lock on the `groupId` instead, BUT our state is keyed by todo id.
              // Instead, we just lock this specific todo, and the parent `TaskList` calculates the `groupLockEmail` by scanning all siblings.

              if (existing[key] && existing[key].lockedBy === myEmail) {
                const copy = { ...existing };
                delete copy[key];
                return { ...p, lockedTodos: copy };
              }

              const newLockedTodos = { ...existing };
              for (const k in newLockedTodos) {
                if (newLockedTodos[k].lockedBy === myEmail) {
                  delete newLockedTodos[k];
                }
              }

              newLockedTodos[key] = { lockedAt: Date.now(), lockedBy: myEmail };
              return { ...p, lockedTodos: newLockedTodos };
            });
          };

          return (
            <div key={todo.id} style={{ marginLeft: depth * 14, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {!isGroup && (
                  <button
                    onClick={() => {
                      if (sequentialBlocked) {
                        onInteractionError && onInteractionError("Complete the previous task first.");
                        return;
                      }

                      if (!isLockedByMe) {
                        if (!locked) {
                          onInteractionError && onInteractionError("Start this task before marking it done.");
                        } else if (isLockedByOther) {
                          const who = lockedByEmail ? lockedByEmail.split("@")[0] : "someone else";
                          onInteractionError && onInteractionError(`Only ${who} can complete this task.`);
                        } else {
                          onInteractionError && onInteractionError("Only the person who started this task can complete it.");
                        }
                        return;
                      }

                      onInteractionError && onInteractionError("");
                      const nowTs = Date.now();
                      let isTodoDelayed = !!isDelayed;
                      if (!isTodoDelayed && minutes > 0 && lockedAt) {
                        const todoDeadline = lockedAt + minutes * 60 * 1000;
                        if (nowTs > todoDeadline) {
                          isTodoDelayed = true;
                        }
                      }
                      onToggle(todo, {
                        lockedAt,
                        lockedByEmail,
                        isDelayed: isTodoDelayed,
                      });
                    }}
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 3,
                      flexShrink: 0,
                      marginTop: 1,
                      border: `1.5px solid ${done ? accentColor : "#2a2a2a"}`,
                      background: done ? accentColor : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all .15s",
                      cursor: "pointer",
                    }}
                  >
                    {done && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6 8 1" stroke="#080808" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}

                {isGroup && (
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 3,
                      flexShrink: 0,
                      marginTop: 1,
                      border: `1.5px solid #2a2a2a`,
                      background: "#050505",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "#444",
                    }}
                  >
                    G
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 12,
                        lineHeight: 1.55,
                        color: done ? "#3a3a3a" : C.text,
                        textDecoration: done ? "line-through" : "none",
                        transition: "color .15s",
                      }}
                    >
                      {todo.label}
                      {isDelayed && " (Delayed)"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {minutes > 0 && !isGroup && (
                        <span style={{ fontSize: 9, color: "#444" }}>{minutes}m</span>
                      )}
                      {!isGroup && !done && (
                        <button
                          onClick={toggleLock}
                          disabled={isLockedByOther}
                          style={{
                            fontSize: 9,
                            letterSpacing: 1,
                            padding: "3px 7px",
                            borderRadius: 3,
                            border: `1px solid ${isLockedByOther ? "#444" : isLockedByMe ? accentColor : "#222"}`,
                            background: isLockedByOther ? "#111" : isLockedByMe ? accentColor : "transparent",
                            color: isLockedByOther ? "#555" : isLockedByMe ? "#080808" : "#555",
                            textTransform: "uppercase",
                            cursor: isLockedByOther ? "not-allowed" : "pointer",
                            opacity: isLockedByOther ? 0.7 : 1,
                          }}
                        >
                          {isLockedByOther ? `By ${lockedByEmail.split('@')[0]}` : isLockedByMe ? "Working" : "Start"}
                        </button>
                      )}
                    </div>
                  </div>

                  {locked && remainingMs != null && (
                    <div style={{ marginTop: 4, fontSize: 10, color: remainingMs === 0 ? "#F06449" : accentColor }}>
                      {remainingMs === 0 ? "Deadline passed" : `Time left: ${remainingMin}m ${remainingSec.toString().padStart(2, "0")}s`}
                    </div>
                  )}
                </div>
              </div>

              {isGroup && todo.children && todo.children.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <TaskList
                    todos={todo.children}
                    onToggle={onToggle}
                    isDone={isDone}
                    accentColor={accentColor}
                    C={C}
                    depth={depth + 1}
                    onInteractionError={onInteractionError}
                    inheritedLockEmail={thisGroupLockEmail}
                    // For children, if the parent is blocked sequentially, the children are too.
                    prevTasksDone={!sequentialBlocked}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function HistoryList({ todos, isDone, C, depth = 0 }) {
    return (
      <div>
        {todos.map(todo => {
          const done = !todo.isGroup && isDone(todo);
          const isGroup = todo.isGroup;
          const key = todo.id;
          const meta = st.todoMeta?.[key] || {};
          const isDelayed = !!meta.isDelayed;
          const completedBy = meta.completedBy || "Unknown";
          const completedAt = meta.completedAt;

          let dayCompleted = null;
          if (completedAt) {
            dayCompleted = Math.floor((completedAt - startAtMidnight.getTime()) / 86400000) + 1;
          }

          const durMin = meta.durationMs ? Math.floor(meta.durationMs / 60000) : 0;
          const durSec = meta.durationMs ? Math.floor((meta.durationMs % 60000) / 1000) : 0;
          const formattedDuration = `${durMin}m ${durSec}s`;

          return (
            <div key={todo.id} style={{ marginLeft: depth * 14, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", flex: 1, alignItems: "flex-start", gap: 10 }}>
                {isGroup ? (
                  <div style={{ width: 17, height: 17, borderRadius: 3, flexShrink: 0, marginTop: 1, border: `1.5px solid #2a2a2a`, background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#444" }}>G</div>
                ) : (
                  <div style={{ width: 17, height: 17, borderRadius: 3, flexShrink: 0, marginTop: 1, border: `1.5px solid ${done ? "#52D68A" : "#F06449"}`, background: done ? "#52D68A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {done && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6 8 1" stroke="#080808" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: done ? "#C8C5BE" : C.text, textDecoration: done ? "none" : (isGroup ? "none" : "line-through") }}>
                    {todo.label}
                  </div>
                  {!isGroup && (
                    <div style={{ fontSize: 10, color: "#888", marginTop: 4, display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {done ? (
                        <>
                          <span style={{ color: "#52D68A" }}>Completed</span>
                          <span>By: {completedBy.split('@')[0]}</span>
                          <span>Day: {dayCompleted}</span>
                          <span>Time taken: {formattedDuration}</span>
                          {isDelayed ? <span style={{ color: "#F06449" }}>Delayed</span> : <span style={{ color: "#52D68A" }}>Within time limit</span>}
                        </>
                      ) : (
                        <span style={{ color: "#F06449" }}>Missed / Not Done</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isGroup && todo.children && (
                <div style={{ marginTop: 4 }}>
                  <HistoryList todos={todo.children} isDone={isDone} C={C} depth={depth + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

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
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: activeStage.color, animation: "blink 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: C.textHi }}>SSQ</span>
          <span style={{ fontSize: 9, color: "#2a2a2a", letterSpacing: 1 }}>WEEK 1</span>
        </div>

        {/* Tabs */}
        {[
          { id: "today", label: "TODAY" },
          { id: "hypothesis", label: "HYPOTHESIS" },
          { id: "outreach", label: "OUTREACH", hidden: activeIdx < 2 },
          { id: "scoreboard", label: "SCOREBOARD", hidden: activeIdx < 2 },
          { id: "decision", label: "DECISION", hidden: activeIdx < 7 || st.day < 7 },
          { id: "history", label: "HISTORY", hidden: st.day < 7 },
        ].filter(t => !t.hidden).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: `2px solid ${tab === t.id ? activeStage.color : "transparent"}`,
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
              <div style={{ height: "100%", width: `${weekPct}%`, background: activeStage.color, transition: "width .4s" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: activeStage.color }}>{weekPct}%</span>
          </div>

          {/* Users stay signed in; no explicit sign-out button */}
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
                      fontSize: 9, letterSpacing: 2, fontWeight: 700, color: activeStage.color,
                      background: activeStage.dim, border: `1px solid ${activeStage.color}44`,
                      padding: "3px 8px", borderRadius: 2
                    }}>{activeStage.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: activeStage.color, marginBottom: 4 }}>{activeGroup.title}</div>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: .5 }}>
                    Task group window: Day {activeGroup.startDay}{activeGroup.endDay !== activeGroup.startDay ? `–${activeGroup.endDay}` : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "#E8C547", marginTop: 4, letterSpacing: .5 }}>
                    Requirements: {activeGroup.requirements && activeGroup.requirements.length > 0 ? activeGroup.requirements.join(", ") : "no special requirements"}
                  </div>
                  {activeGroupDelayed && (
                    <div style={{ fontSize: 10, color: "#F06449", marginTop: 4, letterSpacing: .5 }}>
                      This task group is delayed.
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                    <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx={24} cy={24} r={20} fill="none" stroke="#181818" strokeWidth={3} />
                      <circle cx={24} cy={24} r={20} fill="none" stroke={activeStage.color} strokeWidth={3}
                        strokeDasharray={`${(groupPct(activeGroup) / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                        strokeLinecap="round" style={{ transition: "stroke-dasharray .4s ease" }} />
                    </svg>
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: activeStage.color }}>
                      {groupPct(activeGroup)}%
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: C.textHi, lineHeight: 1 }}>
                      {groupDoneCount(activeGroup)}<span style={{ fontSize: 12, color: "#3a3a3a" }}>/{groupTotalCount(activeGroup)}</span>
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
              {interactionError && (
                <div style={{ padding: "9px 14px", background: "#1a0c0a", border: "1px solid #F0644944", borderRadius: 6, marginBottom: 10, fontSize: 11, color: "#F06449" }}>
                  {interactionError}
                </div>
              )}

              {/* Tasks */}
              <div style={card(`${activeStage.color}22`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={lbl}>TASKS — {activeStage.label.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: groupPct(activeGroup) === 100 ? "#52D68A" : "#444" }}>
                    {groupDoneCount(activeGroup)}/{groupTotalCount(activeGroup)}
                  </span>
                </div>
                <TaskList
                  todos={activeGroup.todos || []}
                  onToggle={togTodo}
                  isDone={isTodoDone}
                  accentColor={activeStage.color}
                  C={C}
                  onInteractionError={setInteractionError}
                />
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

              {/* Task group navigation (linear access only) */}
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: "#444" }}>
                  Group {activeIdx + 1} of {flatTaskGroups.length}
                </div>
                <button
                  disabled={activeIdx >= flatTaskGroups.length - 1 || groupPct(activeGroup) < 100}
                  onClick={() => {
                    if (groupPct(activeGroup) < 100) return;
                    setSt(p => ({
                      ...p,
                      activeTaskIndex: Math.min(activeIdx + 1, flatTaskGroups.length - 1),
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    fontSize: 10,
                    letterSpacing: 2,
                    borderRadius: 4,
                    border: `1px solid ${groupPct(activeGroup) === 100 ? activeStage.color : "#222"}`,
                    background: groupPct(activeGroup) === 100 ? activeStage.dim : "#0b0b0b",
                    color: groupPct(activeGroup) === 100 ? activeStage.color : "#444",
                    cursor: groupPct(activeGroup) === 100 ? "pointer" : "not-allowed",
                    textTransform: "uppercase",
                  }}
                >
                  Next group →
                </button>
              </div>
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

          {/* ═══ OUTREACH */}
          {tab === "outreach" && (
            <div>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.textHi, letterSpacing: -0.5, marginBottom: 6, lineHeight: 1 }}>Outreach</div>
                <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.8 }}>
                  No content right now.
                </div>
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
                        {["DAY", "STAGE", "ATTEMPTS", "REPLIES", "SHOWS", "CLOSES"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: h === "DAY" || h === "PHASE" ? "left" : "right", fontSize: 8, letterSpacing: 2, color: "#2a2a2a", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[2, 3, 4, 5, 6].map(d => {
                        const dp = stageForDay(d);
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
                              }}>{dp.label.toUpperCase()}</span>
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

          {/* ═══ HISTORY */}
          {tab === "history" && (
            <div>
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: C.textHi, letterSpacing: -0.5, marginBottom: 6, lineHeight: 1 }}>Task History</div>
                <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.8 }}>
                  A full log of all task groups undertaken, which user completed them, and timing details. Includes missed and delayed tasks.
                </div>
              </div>

              {flatTaskGroups.map((entry, i) => (
                <div key={i} style={{ ...card(`${entry.stage.color}22`), marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ ...lbl, marginBottom: 4 }}>{entry.stage.label.toUpperCase()} — {entry.group.title}</span>
                      <div style={{ fontSize: 10, color: "#666" }}>Task group window: Day {entry.group.startDay}{entry.group.endDay !== entry.group.startDay ? `–${entry.group.endDay}` : ""}</div>
                      {entry.group.requirements && entry.group.requirements.length > 0 && (
                        <div style={{ fontSize: 10, color: "#E8C547", marginTop: 4 }}>
                          Requirements: {entry.group.requirements.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <HistoryList
                    todos={entry.group.todos || []}
                    isDone={isTodoDone}
                    C={C}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
