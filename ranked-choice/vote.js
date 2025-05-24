document.addEventListener("DOMContentLoaded", () => {
  const ballotId = new URLSearchParams(window.location.search).get("ballot");
  const titleEl = document.getElementById("ballot-title");
  const descriptionEl = document.getElementById("ballot-description");
  const rankingGroups = document.getElementById("ranking-groups");
  const form = document.getElementById("vote-form");
  const status = document.getElementById("vote-status");

  if (!ballotId) {
    titleEl.textContent = "Invalid Ballot";
    form.style.display = "none";
    return;
  }

  // Fetch ballot metadata
  fetch(`/ranked-choice/get_ballot_info.php?ballot=${ballotId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        titleEl.textContent = "Ballot Not Found";
        form.style.display = "none";
        return;
      }

      titleEl.textContent = data.title;
      descriptionEl.textContent = data.description || "";

      renderRankingOptions(data.candidates);
    })
    .catch(err => {
      console.error(err);
      titleEl.textContent = "Error loading ballot.";
      form.style.display = "none";
    });

  function renderRankingOptions(candidates) {
    rankingGroups.innerHTML = "";
    candidates.forEach((_, i) => {
      const group = document.createElement("div");
      group.className = "ranking-group";

      const label = document.createElement("label");
      label.textContent = `Rank ${i + 1}:`;
      label.className = "ranking-label";
      label.setAttribute("for", `ranking-${i + 1}`);

      const select = document.createElement("select");
      select.name = `ranking[]`;
      select.id = `ranking-${i + 1}`;
      select.className = "rank-select";
      select.required = true;

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.textContent = "Select Candidate";
      select.appendChild(defaultOption);

      candidates.forEach(candidate => {
        const option = document.createElement("option");
        option.value = candidate;
        option.textContent = candidate;
        select.appendChild(option);
      });

      group.appendChild(label);
      group.appendChild(select);
      rankingGroups.appendChild(group);
    });

    // Prevent duplicate selections
    rankingGroups.addEventListener("change", handleSelectionLockout);
  }

  function handleSelectionLockout() {
    const selected = new Set();

    document.querySelectorAll("select.rank-select").forEach(select => {
      if (select.value) selected.add(select.value);
    });

    document.querySelectorAll("select.rank-select").forEach(select => {
      const currentValue = select.value;
      Array.from(select.options).forEach(option => {
        if (option.value === "" || option.value === currentValue) {
          option.disabled = false;
        } else {
          option.disabled = selected.has(option.value);
        }
      });
    });
  }

  form.addEventListener("submit", e => {
    e.preventDefault();

    const rankings = [];
    document.querySelectorAll("select.rank-select").forEach(select => {
      if (select.value) rankings.push(select.value);
    });

    if (rankings.length < 2) {
      status.textContent = "Please rank at least two candidates.";
      return;
    }

    fetch("/ranked-choice/submit_rankings.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ballot_id: ballotId,
        rankings: rankings
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          status.textContent = "✅ Vote submitted successfully!";
          form.reset();
        } else {
          status.textContent = "Error: " + (data.message || "Unable to submit vote.");
        }
      })
      .catch(err => {
        console.error(err);
        status.textContent = "Server error. Please try again later.";
      });
  });
});
