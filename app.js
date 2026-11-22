// ===============================
// MATCH DATA
// ===============================

const matches = [
  {
    id: 1,
    league: "Premier League",
    home: "Manchester City",
    away: "Liverpool",
    time: "18:00",
    status: "upcoming",
    odds: ["2.10", "3.40", "3.20"]
  },
  {
    id: 2,
    league: "La Liga",
    home: "Real Madrid",
    away: "Barcelona",
    time: "20:00",
    status: "upcoming",
    odds: ["2.45", "3.20", "2.75"]
  },
  {
    id: 3,
    league: "Serie A",
    home: "Inter Milan",
    away: "AC Milan",
    time: "21:00",
    status: "upcoming",
    odds: ["1.95", "3.50", "3.80"]
  }
];

// ===============================
// BETTING SLIP
// ===============================

let betSlip = [];

let currentFilter = "all";

let searchQuery = "";

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
    m => m.id === matchId
  );

  if (!match) return;

  const existingIndex = betSlip.findIndex(
    bet => bet.matchId === matchId
  );

  // Remove same selection
  if (
    existingIndex !== -1 &&
    betSlip[existingIndex].selection === selection
  ) {

    betSlip.splice(existingIndex, 1);

  } else {

    // Remove other selection from same match
    if (existingIndex !== -1) {

      betSlip.splice(existingIndex, 1);

    }

    // Add new selection
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
// PAYOUT CALCULATION
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
// HIGHLIGHT SELECTED ODDS
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
    .classList.add("open");

  document.getElementById("slipOverlay")
    .classList.add("show");

}

// ===============================
// CLOSE SLIP
// ===============================

function closeSlip() {

  document.getElementById("betSlip")
    .classList.remove("open");

  document.getElementById("slipOverlay")
    .classList.remove("show");

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
    document.getElementById("stake").value
  );

  if (!stake || stake <= 0) {

    alert("Please enter a valid stake.");

    return;

  }

  alert(
    "BETTING SLIP\\n\\n" +
    "Selections: " + betSlip.length + "\\n" +
    "Stake: KES " + stake + "\\n" +
    "Total Odds: " +
    document.getElementById("totalOdds").textContent +
    "\\nPotential Payout: " +
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

  const navigation = document.getElementById("navigation");

  if (navigation) {

    navigation.classList.toggle("hidden");

  }

}

// ===============================
// INITIALIZE
// ===============================

renderFilteredMatches();

updateSlip();