
const API_URL = "/.netlify/functions/matches";

// ===============================
// MATCH DATA
// ===============================

let matches = [];

let betSlip = [];

let currentFilter = "all";

let searchQuery = "";

// ===============================
// LOAD MATCHES FROM NETLIFY API
// ===============================

async function loadMatches() {

  const container = document.getElementById("matches");

  if (container) {
    container.innerHTML = `
      <div class="loading">Loading matches...</div>
    `;
  }

  try {

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch matches");
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.matches)) {
      throw new Error("Invalid API response");
    }

    matches = data.matches.map(match => {

      const odds = match.odds || {};

      return {
        id: match.id,
        league: match.league || "Football",
        home: match.home,
        away: match.away,
        time: match.time || "",
        status: match.status || "upcoming",
        odds: [
          String(odds.home ?? 0),
          String(odds.draw ?? 0),
          String(odds.away ?? 0)
        ]
      };

    });

    renderFilteredMatches();

    updateSlip();

  } catch (error) {

    console.error("Match loading error:", error);

    if (container) {
      container.innerHTML = `
        <div class="empty-slip">
          Unable to load matches.
          <br><br>
          Please refresh the page.
        </div>
      `;
    }

  }

}

// ===============================
// RENDER MATCHES
// ===============================

function renderFilteredMatches() {

  const container = document.getElementById("matches");

  if (!container) return;

  const filtered = matches.filter(match => {

    const filterMatch =
      currentFilter === "all" ||
      match.status === currentFilter;

    const searchMatch =
      match.home.toLowerCase().includes(searchQuery) ||
      match.away.toLowerCase().includes(searchQuery) ||
      match.league.toLowerCase().includes(searchQuery);

    return filterMatch && searchMatch;

  });

  container.innerHTML = "";

  if (filtered.length === 0) {

    container.innerHTML = `
      <div class="empty-slip">
        No matches found.
      </div>
    `;

    return;

  }

  filtered.forEach(match => {

    const card = document.createElement("div");

    card.className = "match-card";

    card.innerHTML = `
      <div class="match-league">
        ${match.league} • ${match.time}
      </div>

      <div class="teams">

        <div class="team">
          ${match.home}
        </div>

        <div class="vs">
          VS
        </div>

        <div class="team">
          ${match.away}
        </div>

      </div>

      <div class="odds">

        <button
          class="odd"
          id="odd-${match.id}-1"
          onclick="selectOdd(${match.id}, '1', ${match.odds[0]})"
        >
          <span class="odd-label">1</span>
          <span class="odd-value">${match.odds[0]}</span>
        </button>

        <button
          class="odd"
          id="odd-${match.id}-X"
          onclick="selectOdd(${match.id}, 'X', ${match.odds[1]})"
        >
          <span class="odd-label">X</span>
          <span class="odd-value">${match.odds[1]}</span>
        </button>

        <button
          class="odd"
          id="odd-${match.id}-2"
          onclick="selectOdd(${match.id}, '2', ${match.odds[2]})"
        >
          <span class="odd-label">2</span>
          <span class="odd-value">${match.odds[2]}</span>
        </button>

      </div>
    `;

    container.appendChild(card);

  });

  updateSelectedButtons();

}

// ===============================
// SELECT ODDS
// ===============================

function selectOdd(matchId, selection, odds) {

  const match = matches.find(
    m => String(m.id) === String(matchId)
  );

  if (!match) return;

  const existingIndex = betSlip.findIndex(
    bet => String(bet.matchId) === String(matchId)
  );

  if (
    existingIndex !== -1 &&
    betSlip[existingIndex].selection === selection
  ) {

    betSlip.splice(existingIndex, 1);

  } else {

    if (existingIndex !== -1) {
      betSlip.splice(existingIndex, 1);
    }

    betSlip.push({

      matchId: match.id,
      league: match.league,
      home: match.home,
      away: match.away,
      selection: selection,
      odds: Number(odds)

    });

  }

  renderFilteredMatches();

  updateSlip();

}

// ===============================
// UPDATE BET SLIP
// ===============================

function updateSlip() {

  const count = document.getElementById("slipCount");

  const container = document.getElementById("slipSelections");

  if (!count || !container) return;

  count.textContent = betSlip.length;

  container.innerHTML = "";

  if (betSlip.length === 0) {

    container.innerHTML = `
      <div class="empty-slip">
        Your betting slip is empty.
        <br><br>
        Select odds to add bets.
      </div>
    `;

  } else {

    betSlip.forEach((bet, index) => {

      const item = document.createElement("div");

      item.className = "slip-selection";

      item.innerHTML = `
        <div class="selection-top">

          <div>

            <div class="selection-match">
              ${bet.home} vs ${bet.away}
            </div>

            <div class="selection-market">
              ${bet.league} • Selection ${bet.selection}
            </div>

          </div>

          <div>

            <span class="selection-odds">
              ${bet.odds.toFixed(2)}
            </span>

            <button
              class="remove-selection"
              onclick="removeBet(${index})"
            >
              ✕
            </button>

          </div>

        </div>
      `;

      container.appendChild(item);

    });

  }

  updateTotalOdds();

  calculatePayout();

  updateSelectedButtons();

}

// ===============================
// REMOVE BET
// ===============================

function removeBet(index) {

  betSlip.splice(index, 1);

  renderFilteredMatches();

  updateSlip();

}

// ===============================
// TOTAL ODDS
// ===============================

function updateTotalOdds() {

  let total = 1;

  betSlip.forEach(bet => {
    total *= bet.odds;
  });

  const element = document.getElementById("totalOdds");

  if (element) {
    element.textContent = total.toFixed(2);
  }

}

// ===============================
// CALCULATE PAYOUT
// ===============================

function calculatePayout() {

  const stakeElement = document.getElementById("stake");

  const payoutElement = document.getElementById("potentialPayout");

  if (!stakeElement || !payoutElement) return;

  const stake = Number(stakeElement.value) || 0;

  let totalOdds = 1;

  betSlip.forEach(bet => {
    totalOdds *= bet.odds;
  });

  const payout = stake * totalOdds;

  payoutElement.textContent =
    "KES " + payout.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

}

// ===============================
// SELECTED ODDS HIGHLIGHT
// ===============================

function updateSelectedButtons() {

  document.querySelectorAll(".odd").forEach(button => {
    button.classList.remove("selected");
  });

  betSlip.forEach(bet => {

    const button = document.getElementById(
      `odd-${bet.matchId}-${bet.selection}`
    );

    if (button) {
      button.classList.add("selected");
    }

  });

}

// ===============================
// OPEN SLIP
// ===============================

function toggleSlip() {

  document.getElementById("betSlip")
    ?.classList.add("open");

  document.getElementById("slipOverlay")
    ?.classList.add("show");

}

// ===============================
// CLOSE SLIP
// ===============================

function closeSlip() {

  document.getElementById("betSlip")
    ?.classList.remove("open");

  document.getElementById("slipOverlay")
    ?.classList.remove("show");

}

// ===============================
// PLACE BET - DEMO
// ===============================

function placeBet() {

  if (betSlip.length === 0) {

    alert("Please select at least one match.");

    return;

  }

  const stake = Number(
    document.getElementById("stake")?.value
  );

  if (!stake || stake <= 0) {

    alert("Please enter a valid stake.");

    return;

  }

  alert(
    "BETTING SLIP\n\n" +
    "Selections: " + betSlip.length + "\n" +
    "Stake: KES " + stake + "\n" +
    "Total Odds: " +
    document.getElementById("totalOdds").textContent +
    "\nPotential Payout: " +
    document.getElementById("potentialPayout").textContent
  );

}

// ===============================
// FILTER MATCHES
// ===============================

function filterMatches(filter, button) {

  currentFilter = filter;

  document.querySelectorAll(".quick-item").forEach(item => {
    item.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  renderFilteredMatches();

}

// ===============================
// SEARCH MATCHES
// ===============================

function searchMatches() {

  const input = document.getElementById("matchSearch");

  if (!input) return;

  searchQuery = input.value.toLowerCase().trim();

  renderFilteredMatches();

}

// ===============================
// MENU
// ===============================

function toggleMenu() {

  document.getElementById("navigation")
    ?.classList.toggle("hidden");

}

// ===============================
// INITIALIZE
// ===============================

loadMatches();
