// DOM Elements
const form = document.getElementById("ranked-choice-form");
const candidateCountSelect = document.getElementById("candidate-count");
const candidateFields = document.getElementById("candidate-fields");
const rankingGroupsContainer = document.getElementById("ranking-groups");
const previewSection = document.getElementById("ballot-preview");
const previewList = document.getElementById("ranked-output");

const maxCandidates = 10;
let candidateCount = 0;

// Handle candidate count dropdown
candidateCountSelect.addEventListener("change", () => {
  candidateCount = parseInt(candidateCountSelect.value);
  renderCandidateInputs(candidateCount);
  updateRankings();
});

function renderCandidateInputs(count) {
  candidateFields.innerHTML = "";
  for (let i = 1; i <= count; i++) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("candidate-group");
    wrapper.innerHTML = `
      <label for="candidate-${i}" class="candidate-label">Candidate ${i}:</label>
      <input type="text" id="candidate-${i}" name="candidate-${i}" class="candidate-input" placeholder="Candidate Name" required>
    `;
    candidateFields.appendChild(wrapper);
  }
}

// Retrieve current candidate names
function getCandidateNames() {
  const names = [];
  for (let i = 1; i <= candidateCount; i++) {
    const input = document.getElementById(`candidate-${i}`);
    if (input && input.value.trim() !== "") {
      names.push(input.value.trim());
    }
  }
  return names;
}

// Update ranking options
function updateRankings() {
  const candidateNames = getCandidateNames();
  rankingGroupsContainer.innerHTML = "";

  for (let i = 1; i <= candidateNames.length; i++) {
    const group = document.createElement("div");
    group.classList.add("ranking-group");
    group.innerHTML = `
      <label for="ranking-${i}" class="ranking-label">Rank ${i}:</label>
      <select id="ranking-${i}" name="ranking-${i}" class="rank-select" data-rank="${i}" required>
        <option value="" disabled selected>Select Candidate</option>
        ${candidateNames.map(name => `<option value="${name}">${name}</option>`).join("")}
      </select>
    `;
    rankingGroupsContainer.appendChild(group);
  }

  const selects = rankingGroupsContainer.querySelectorAll(".rank-select");
  selects.forEach(select => {
    select.addEventListener("change", handleRankingChange);
    select.addEventListener("change", updateBallotPreview);
  });

  updateBallotPreview();
}

// Prevent duplicate candidate selections
function handleRankingChange() {
  const selectedValues = new Set();

  rankingGroupsContainer.querySelectorAll("select").forEach(select => {
    if (select.value) selectedValues.add(select.value);
  });

  rankingGroupsContainer.querySelectorAll("select").forEach(select => {
    const currentValue = select.value;
    select.querySelectorAll("option").forEach(option => {
      if (option.value === "" || option.value === currentValue) {
        option.disabled = false;
      } else {
        option.disabled = selectedValues.has(option.value);
      }
    });
  });
}

// Live Ballot Preview
function updateBallotPreview() {
  const selects = document.querySelectorAll(".rank-select");

  const rankings = Array.from(selects).map(select => ({
    candidate: select.value,
    rank: parseInt(select.getAttribute("data-rank"))
  })).filter(entry => entry.candidate !== "");

  rankings.sort((a, b) => a.rank - b.rank);

  if (rankings.length === 0) {
    previewSection.classList.add("hidden");
    previewList.innerHTML = "";
    return;
  }

  previewSection.classList.remove("hidden");
  previewList.innerHTML = rankings.map(entry =>
    `<li><strong>${entry.candidate}</strong> (Rank ${entry.rank})</li>`
  ).join("");
}

// Monitor changes to candidate name fields
form.addEventListener("input", event => {
  if (event.target.classList.contains("candidate-input")) {
    updateRankings();
  }
});

// Handle form submission
form.addEventListener("submit", event => {
  event.preventDefault();

  const candidateNames = getCandidateNames();
  const rankings = [];

  rankingGroupsContainer.querySelectorAll("select").forEach(select => {
    if (select.value) rankings.push(select.value);
  });

  if (rankings.length < 2) {
    alert("Please rank at least two candidates.");
    return;
  }

  console.log("Submitted ballot:", rankings);
  alert("Ballot submitted successfully!");

  form.reset();
  candidateFields.innerHTML = "";
  rankingGroupsContainer.innerHTML = "";
  previewSection.classList.add("hidden");
  previewList.innerHTML = "";
});
