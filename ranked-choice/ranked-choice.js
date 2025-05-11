// DOM Elements
const form = document.getElementById("ranked-choice-form");
const addCandidateBtn = document.getElementById("add-candidate-btn");
const additionalCandidates = document.getElementById("additional-candidates");
const rankingGroupsContainer = document.getElementById("ranking-groups");

// Configuration
const maxCandidates = 10;
let candidateCount = 2;

// Add candidate input
addCandidateBtn.addEventListener("click", () => {
    if (candidateCount >= maxCandidates) return;

    candidateCount++;
    const candidateGroup = document.createElement("div");
    candidateGroup.classList.add("candidate-group");
    candidateGroup.innerHTML = `
        <label for="candidate-${candidateCount}" class="candidate-label">Candidate ${candidateCount}:</label>
        <input type="text" id="candidate-${candidateCount}" name="candidate-${candidateCount}" class="candidate-input" placeholder="Candidate Name" required>
    `;
    additionalCandidates.appendChild(candidateGroup);

    // Update rankings to include the new candidate
    updateRankings();
});

// Update ranking options
function updateRankings() {
    const candidateNames = getCandidateNames();

    // Clear existing ranking groups
    rankingGroupsContainer.innerHTML = "";

    // Create ranking groups based on the number of candidates
    for (let i = 1; i <= candidateNames.length; i++) {
        const rankingGroup = document.createElement("div");
        rankingGroup.classList.add("ranking-group");
        rankingGroup.innerHTML = `
            <label for="ranking-${i}" class="ranking-label">Rank ${i}:</label>
            <select id="ranking-${i}" name="ranking-${i}" title="Rank ${i}" required>
                <option value="" disabled selected>Select Candidate</option>
                ${candidateNames.map(name => `<option value="${name}">${name}</option>`).join("")}
            </select>
        `;
        rankingGroupsContainer.appendChild(rankingGroup);
    }

    // Add event listeners to prevent duplicate selections
    const allSelectElements = rankingGroupsContainer.querySelectorAll("select");
    allSelectElements.forEach(select => {
        select.addEventListener("change", handleRankingChange);
    });
}

// Prevent duplicate selections
function handleRankingChange() {
    const selectedValues = new Set();

    // Gather all currently selected values
    rankingGroupsContainer.querySelectorAll("select").forEach(select => {
        if (select.value) {
            selectedValues.add(select.value);
        }
    });

    // Disable selected options in other dropdowns
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

// Retrieve current candidate names
function getCandidateNames() {
    const candidates = [];
    for (let i = 1; i <= candidateCount; i++) {
        const candidateInput = document.getElementById(`candidate-${i}`);
        if (candidateInput && candidateInput.value.trim() !== "") {
            candidates.push(candidateInput.value.trim());
        }
    }
    return candidates;
}

// Initial population of ranking options
updateRankings();

// Update rankings when a candidate name is changed
form.addEventListener("input", (event) => {
    if (event.target.classList.contains("candidate-input")) {
        updateRankings();
    }
});

// Handle form submission
form.addEventListener("submit", (event) => {
    event.preventDefault();

    const candidateNames = getCandidateNames();
    const rankings = [];

    const rankingSelects = rankingGroupsContainer.querySelectorAll("select");
    rankingSelects.forEach(select => {
        const selectedValue = select.value;
        if (selectedValue) {
            rankings.push(selectedValue);
        }
    });

    if (rankings.length < 2) {
        alert("Please rank at least two candidates.");
        return;
    }

    // Log the rankings for now (replace with actual form processing later)
    console.log("Ranked Choice Ballot Submitted:");
    console.log("Candidates:", candidateNames);
    console.log("Rankings:", rankings);
    alert("Ballot submitted successfully!");

    // Reset the form for testing purposes (optional)
    form.reset();
    candidateCount = 2;
    additionalCandidates.innerHTML = "";
    updateRankings();
});
