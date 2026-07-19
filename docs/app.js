// ─── Constants ───────────────────────────────────────────────────────────────

const PREDICTION_FILES = [
  "predictions/predictions_matchday_1.json",
  "predictions/predictions_matchday_2.json",
  "predictions/predictions_matchday_3.json",
  "predictions/predictions_round_of_32.json",
  "predictions/predictions_round_of_16.json",
  "predictions/predictions_quarterfinal.json",
  "predictions/predictions_semifinal.json",
  "predictions/predictions_third_place.json",
  "predictions/predictions_final.json",
];

const CITY_COUNTRY = {
  "Mexico City": "MX", "Guadalajara": "MX", "Monterrey": "MX",
  "Toronto": "CA", "Vancouver": "CA",
  "Atlanta": "US", "San Francisco": "US", "Los Angeles": "US",
  "Seattle": "US", "New York/NJ": "US", "Boston": "US",
  "Philadelphia": "US", "Miami": "US", "Houston": "US",
  "Kansas City": "US", "Dallas": "US",
};

const TEAM_COUNTRY = {
  "Mexico": "MX", "United States": "US", "Canada": "CA",
};

const FLAG_MAP = {
  "Mexico": "🇲🇽", "South Korea": "🇰🇷", "Czech Republic": "🇨🇿", "South Africa": "🇿🇦",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "Switzerland": "🇨🇭", "Qatar": "🇶🇦",
  "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "United States": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨",
  "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪", "Egypt": "🇪🇬", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DR Congo": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
};

const GROUPS = {
  "A": ["Mexico", "South Korea", "Czech Republic", "South Africa"],
  "B": ["Canada", "Bosnia and Herzegovina", "Switzerland", "Qatar"],
  "C": ["Brazil", "Morocco", "Haiti", "Scotland"],
  "D": ["United States", "Paraguay", "Australia", "Turkey"],
  "E": ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  "F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
  "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
  "H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  "I": ["France", "Senegal", "Iraq", "Norway"],
  "J": ["Argentina", "Algeria", "Austria", "Jordan"],
  "K": ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  "L": ["England", "Croatia", "Ghana", "Panama"],
};

const KNOCKOUT_ROUNDS = [
  { key: "Round of 32",   slots: 16, label: "Round of 32"   },
  { key: "Round of 16",   slots: 8,  label: "Round of 16"   },
  { key: "Quarterfinal",  slots: 4,  label: "Quarterfinals" },
  { key: "Semifinal",     slots: 2,  label: "Semifinals"    },
  { key: "Third Place",   slots: 1,  label: "Third Place"   },
  { key: "Final",         slots: 1,  label: "Final"         },
];

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  schedule:    [],
  predictions: {},   // match_id -> prediction object
  results:     {},   // match_id -> result object
  accuracy:    null,
  activeTab:   "groups",
  activeMatchday: "Matchday 1",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flag(team) {
  return FLAG_MAP[team] || "🏳️";
}

function isNeutral(homeTeam, awayTeam, city) {
  const cityCc  = CITY_COUNTRY[city] || "";
  const homeCc  = TEAM_COUNTRY[homeTeam] || "";
  const awayCc  = TEAM_COUNTRY[awayTeam] || "";
  return !(cityCc && (cityCc === homeCc || cityCc === awayCc));
}

function outcomeLabel(outcome, home, away) {
  if (outcome === "home_win") return home;
  if (outcome === "away_win") return away;
  return "Draw";
}

function confidenceColor(conf) {
  if (conf === "HIGH")   return "var(--green)";
  if (conf === "MEDIUM") return "var(--amber)";
  return "var(--text-3)";
}

async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadAllData() {
  // load schedule
  const sched = await fetchJSON("data/wc2026_schedule.json");
  if (sched) {
    state.schedule = sched;
  }

  // load all prediction files
  for (const file of PREDICTION_FILES) {
    const data = await fetchJSON(file);
    if (!data) continue;
    for (const p of data.predictions || []) {
      state.predictions[String(p.match_id)] = p;
    }
  }

  // load results
  const results = await fetchJSON("data/wc2026_results.json");
  if (results) {
    for (const r of results) {
      state.results[String(r.match_id)] = r;
    }
  }

  // load accuracy
  const acc = await fetchJSON("accuracy.json");
  if (acc) state.accuracy = acc;
}

// ─── Tab routing ──────────────────────────────────────────────────────────────

function showTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".nav-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.querySelectorAll(".panel").forEach(p => {
    p.classList.toggle("active", p.id === "panel-" + tab);
  });
  if (tab === "groups")   renderGroups();
  if (tab === "knockout") renderKnockout();
  if (tab === "accuracy") renderAccuracy();
}

// ─── Groups panel ─────────────────────────────────────────────────────────────

function getMatchdayMatches(matchday) {
  return state.schedule.filter(m => m.matchday === matchday && m.stage === "Group Stage");
}

function renderMatchdayButtons() {
  const bar = document.getElementById("matchday-bar");
  bar.innerHTML = "";
  ["Matchday 1", "Matchday 2", "Matchday 3"].forEach(md => {
    const btn = document.createElement("button");
    btn.textContent = md;
    btn.className = "filter-bar-btn" + (md === state.activeMatchday ? " active" : "");
    btn.onclick = () => {
      state.activeMatchday = md;
      document.querySelectorAll(".filter-bar-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderGroups();
    };
    bar.appendChild(btn);
  });
}

function renderGroups() {
  const matches = getMatchdayMatches(state.activeMatchday);
  const grid = document.getElementById("group-grid");
  grid.innerHTML = "";

  // group matches by group letter
  const byGroup = {};
  for (const m of matches) {
    if (!byGroup[m.group]) byGroup[m.group] = [];
    byGroup[m.group].push(m);
  }

  const sortedGroups = Object.keys(byGroup).sort();

  if (sortedGroups.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">📅</div>
      <div class="empty-state-title">No matches yet</div>
      <div class="empty-state-body">Predictions for this matchday haven't been generated yet.</div>
    </div>`;
    return;
  }

  for (const grp of sortedGroups) {
    const card = buildGroupCard(grp, byGroup[grp]);
    grid.appendChild(card);
  }
}

function buildGroupCard(grp, matches) {
  const card = document.createElement("div");
  card.className = "group-card";

  const completedCount = matches.filter(m => state.results[String(m.match_id)]).length;
  card.innerHTML = `
    <div class="group-card-header">
      <span class="group-card-title">Group ${grp}</span>
      <span class="group-card-count">${completedCount}/${matches.length} played</span>
    </div>
    <div class="group-matches" id="grp-${grp}"></div>
  `;

  const container = card.querySelector(`#grp-${grp}`);
  for (const m of matches) {
    container.appendChild(buildMatchRow(m));
  }
  return card;
}

function buildMatchRow(m) {
  const mid     = String(m.match_id);
  const pred    = state.predictions[mid];
  const result  = state.results[mid];
  const neutral = isNeutral(m.home_team, m.away_team, m.city);

  const row = document.createElement("div");
  row.className = "match-row";

  // score block
  let scoreHtml = "";
if (result) {
    const penWinner = result.penalty_winner || "";
    const penHtml = penWinner
        ? `<div style="font-size:10px;color:var(--amber);text-align:center;margin-top:2px">${penWinner} win (pen)</div>`
        : "";
    scoreHtml = `
      <div class="score-block" style="flex-direction:column;align-items:center">
        <div style="display:flex;align-items:center;gap:5px">
          <span class="score-num">${result.home_score}</span>
          <span class="score-sep">–</span>
          <span class="score-num">${result.away_score}</span>
        </div>
        ${penHtml}
      </div>`;
  } else {
    scoreHtml = `
      <div class="score-block">
        <span class="score-pending">vs</span>
      </div>`;
  }

  // badge
  let badge = "";
  if (result && pred) {
    const correct = pred.predicted === result.outcome;
    badge = correct
      ? `<span class="badge badge-correct">✓ Correct</span>`
      : `<span class="badge badge-wrong">✗ Wrong</span>`;
  } else if (pred) {
    badge = `<span class="badge badge-pending">Predicted</span>`;
  } else {
    badge = `<span class="badge badge-neutral">No prediction</span>`;
  }

  // venue badge
  const venueBadge = neutral
    ? ""
    : `<span class="badge badge-home" style="margin-left:4px">🏠 Home</span>`;

  // prob bar
  let probBar = "";
  let probLabels = "";
  let predInfo = "";
  let scoreChips = "";

  if (pred) {
    const hp = Math.round(pred.home_win_prob * 100);
    const dp = Math.round(pred.draw_prob * 100);
    const ap = Math.round(pred.away_win_prob * 100);
    const winner = outcomeLabel(pred.predicted, m.home_team, m.away_team);

    probBar = `
      <div class="prob-bar-wrap" style="margin-bottom:5px">
        <div class="prob-h" style="width:${hp}%;flex-shrink:0"></div>
        <div class="prob-d" style="width:${dp}%;flex-shrink:0"></div>
        <div class="prob-a" style="width:${ap}%;flex-shrink:0"></div>
      </div>`;

    probLabels = `
      <div class="prob-labels">
        <span class="prob-lbl-h">${hp}%</span>
        <span class="prob-lbl-d">${dp}% draw</span>
        <span class="prob-lbl-a">${ap}%</span>
      </div>`;

    predInfo = `
      <div class="pred-tag" style="margin-top:6px">
        Prediction: <strong>${winner}</strong>
        <span style="color:${confidenceColor(pred.confidence)};margin-left:4px">${pred.confidence}</span>
      </div>`;

    // scorelines by outcome
    if (!result) {
      const chips = [];
      if (pred.top_home_score) chips.push({ s: pred.top_home_score, type: "h" });
      if (pred.top_draw_score) chips.push({ s: pred.top_draw_score, type: "d" });
      if (pred.top_away_score) chips.push({ s: pred.top_away_score, type: "a" });

      if (chips.length > 0) {
        const chipHtml = chips.map(c => {
          const label = c.type === "h" ? m.home_team : c.type === "a" ? m.away_team : "Draw";
          return `<span class="score-chip top" title="${label} win">${c.s.score} <span style="opacity:0.6">${Math.round(c.s.prob*100)}%</span></span>`;
        }).join("");
        scoreChips = `<div class="scorelines" style="margin-top:6px">${chipHtml}</div>`;
      }
    }
  }

  row.innerHTML = `
    <div class="match-header">
      <span class="match-date">${m.date} · ${m.utc_time || ""} UTC</span>
      <div style="display:flex;align-items:center;gap:4px">
        ${badge}${venueBadge}
      </div>
    </div>
    <div class="match-teams">
      <span class="team-name">${flag(m.home_team)} ${m.home_team}</span>
      ${scoreHtml}
      <span class="team-name right">${m.away_team} ${flag(m.away_team)}</span>
    </div>
    <div class="match-city" style="font-size:11px;color:var(--text-3);margin-bottom:7px">📍 ${m.city || "TBD"}</div>
    ${probBar}
    ${probLabels}
    ${predInfo}
    ${scoreChips}
  `;
  return row;
}

// ─── Knockout panel ───────────────────────────────────────────────────────────

function renderKnockout() {
  const container = document.getElementById("bracket-rounds");
  container.innerHTML = "";

  for (const round of KNOCKOUT_ROUNDS) {
    const col = document.createElement("div");
    col.className = "bracket-round";

    let html = `<div class="round-label">${round.label}</div>`;

    // get matches for this round
    const roundMatches = state.schedule.filter(m => m.stage === round.key);

    if (roundMatches.length === 0) {
      // show empty placeholder slots
      for (let i = 0; i < round.slots; i++) {
        html += buildBracketMatch(null, null, null);
      }
    } else {
      for (const m of roundMatches) {
        const pred   = state.predictions[String(m.match_id)];
        const result = state.results[String(m.match_id)];
        html += buildBracketMatch(m, pred, result);
      }
    }

    col.innerHTML = html;
    container.appendChild(col);
  }
}

function buildBracketMatch(m, pred, result) {
  if (!m) {
    return `
      <div class="bracket-match">
        <div class="bracket-team">
          <span class="bracket-team-name tba">TBA</span>
        </div>
        <div class="bracket-team">
          <span class="bracket-team-name tba">TBA</span>
        </div>
      </div>`;
  }

  const homeTeam = m.home_team || "TBA";
  const awayTeam = m.away_team || "TBA";
  const isTBAHome = !m.home_team || m.home_team.startsWith("Win") || m.home_team.startsWith("2nd");
  const isTBAAway = !m.away_team || m.away_team.startsWith("Win") || m.away_team.startsWith("2nd");

  let homeScore = "", awayScore = "";
  let homeWinner = false, awayWinner = false;

  if (result) {
    homeScore = result.home_score;
    awayScore = result.away_score;
    homeWinner = result.outcome === "home_win";
    awayWinner = result.outcome === "away_win";
  }

  // prob tooltip
  let probHtml = "";
  if (pred && !result) {
    const hp = Math.round(pred.home_win_prob * 100);
    const dp = Math.round(pred.draw_prob * 100);
    const ap = Math.round(pred.away_win_prob * 100);
    probHtml = `
      <div class="prob-bar-wrap" style="margin:6px 10px 2px;gap:1px">
        <div class="prob-h" style="width:${hp}%"></div>
        <div class="prob-d" style="width:${dp}%"></div>
        <div class="prob-a" style="width:${ap}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:0 10px 6px;font-size:10px">
        <span style="color:var(--blue)">${hp}%</span>
        <span style="color:var(--text-3)">${dp}%</span>
        <span style="color:var(--red)">${ap}%</span>
      </div>`;
  }

  // date line
  const dateLine = m.date ? `<div style="font-size:10px;color:var(--text-3);padding:4px 10px 0;border-top:0.5px solid var(--border)">${m.date} · ${m.city || ""}</div>` : "";

  return `
    <div class="bracket-match">
      <div class="bracket-team ${homeWinner ? "winner" : ""}">
        <span class="bracket-team-name ${isTBAHome ? "tba" : ""}">${flag(homeTeam)} ${homeTeam}</span>
        <span class="bracket-score">${homeScore}</span>
      </div>
      <div class="bracket-team ${awayWinner ? "winner" : ""}">
        <span class="bracket-team-name ${isTBAAway ? "tba" : ""}">${flag(awayTeam)} ${awayTeam}</span>
        <span class="bracket-score">${awayScore}</span>
      </div>
      ${probHtml}
      ${dateLine}
    </div>`;
}

// ─── Accuracy panel ───────────────────────────────────────────────────────────

function renderAccuracy() {
  const acc = state.accuracy;

  // stat cards
  document.getElementById("acc-predicted").textContent = acc ? acc.total_predicted : "—";
  document.getElementById("acc-correct").textContent   = acc ? acc.total_correct   : "—";
  document.getElementById("acc-pct").textContent       = acc ? (acc.accuracy * 100).toFixed(1) + "%" : "—";
  document.getElementById("acc-rps").textContent       = acc ? (acc.rps_score || "—") : "—";

  // results list
  const list = document.getElementById("accuracy-list");
  list.innerHTML = "";

  // collect all matches with both prediction and result
  const completed = [];
  for (const mid of Object.keys(state.results)) {
    const pred   = state.predictions[mid];
    const result = state.results[mid];
    if (!pred) continue;

    const m = state.schedule.find(x => String(x.match_id) === mid);
    if (!m) continue;

    completed.push({ m, pred, result });
  }

  if (completed.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <div class="empty-state-title">No results yet</div>
      <div class="empty-state-body">Enter match results in wc2026_results.csv and re-run 07_enter_results.ipynb.</div>
    </div>`;
    return;
  }

  // sort by date
  completed.sort((a, b) => a.m.date.localeCompare(b.m.date));

  // by matchday sections
  const byMatchday = {};
  for (const item of completed) {
    const md = item.m.matchday || item.m.stage;
    if (!byMatchday[md]) byMatchday[md] = [];
    byMatchday[md].push(item);
  }

  for (const [md, items] of Object.entries(byMatchday)) {
    const correct = items.filter(i => i.pred.predicted === i.result.outcome).length;
    const section = document.createElement("div");
    section.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;margin-top:20px">
        <div class="section-label" style="margin-bottom:0">${md}</div>
        <span style="font-size:12px;color:var(--text-2)">${correct}/${items.length} correct</span>
      </div>`;
    list.appendChild(section);

    for (const { m, pred, result } of items) {
      const correct  = pred.predicted === result.outcome;
      const predWin  = outcomeLabel(pred.predicted, m.home_team, m.away_team);
      const actWin   = outcomeLabel(result.outcome, m.home_team, m.away_team);
      const hp = Math.round(pred.home_win_prob * 100);
      const dp = Math.round(pred.draw_prob * 100);
      const ap = Math.round(pred.away_win_prob * 100);

      const el = document.createElement("div");
      el.className = "accuracy-match";
      el.innerHTML = `
        <div class="accuracy-header">
          <span class="accuracy-teams">${flag(m.home_team)} ${m.home_team} vs ${m.away_team} ${flag(m.away_team)}</span>
          <span class="badge ${correct ? "badge-correct" : "badge-wrong"}">${correct ? "✓ Correct" : "✗ Wrong"}</span>
        </div>
        <div class="accuracy-meta">
          <span>Result: <strong>${result.home_score}–${result.away_score} (${actWin})</strong>
${result.penalty_winner ? `<span style="color:var(--amber);font-size:11px"> · ${result.penalty_winner} win on pens</span>` : ""}
</span>
          <span>Predicted: <strong>${predWin}</strong></span>
        </div>
        <div class="prob-bar-wrap">
          <div class="prob-h" style="width:${hp}%"></div>
          <div class="prob-d" style="width:${dp}%"></div>
          <div class="prob-a" style="width:${ap}%"></div>
        </div>
        <div class="prob-labels" style="margin-top:4px">
          <span class="prob-lbl-h">${m.home_team} ${hp}%</span>
          <span class="prob-lbl-d">${dp}% draw</span>
          <span class="prob-lbl-a">${ap}% ${m.away_team}</span>
        </div>`;
      list.appendChild(el);
    }
  }
}

// ─── Schedule JSON export helper ──────────────────────────────────────────────
// The frontend reads docs/data/wc2026_schedule.json
// This is generated by a new cell in 08_predict.ipynb

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // wire tabs
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  });

  // render matchday buttons
  renderMatchdayButtons();

  // show loading
  document.getElementById("group-grid").innerHTML = `<div class="loading" style="grid-column:1/-1">Loading schedule…</div>`;

  await loadAllData();

  // render initial view
  showTab("groups");
}

document.addEventListener("DOMContentLoaded", init);
