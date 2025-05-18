document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-ballot-form");
  const candidateList = document.getElementById("candidate-list");
  const addCandidateBtn = document.getElementById("add-candidate-btn");
  const status = document.getElementById("ballot-status");

  let candidateCount = 2;
  const maxCandidates = 10;

  // Add new candidate field
  addCandidateBtn.addEventListener("click", () => {
    if (candidateCount >= maxCandidates) {
      alert(`You can only add up to ${maxCandidates} candidates.`);
      return;
    }

    candidateCount++;
    const input = document.createElement("input");
    input.type = "text";
    input.name = "candidates[]";
    input.placeholder = `Candidate ${candidateCount}`;
    input.required = true;
    candidateList.appendChild(input);
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Creating ballot...";

    const formData = new FormData(form);

    try {
      const response = await fetch("/php/create_ballot.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.ballot_id) {
        const link = `${window.location.origin}/ranked-choice/vote.html?ballot=${result.ballot_id}`;
        status.innerHTML = `✅ Ballot created! Share this link:<br><a href="${link}" target="_blank">${link}</a>`;
        form.reset();
        candidateList.innerHTML = `
          <input type="text" name="candidates[]" placeholder="Candidate 1" required />
          <input type="text" name="candidates[]" placeholder="Candidate 2" required />
        `;
        candidateCount = 2;
      } else {
        status.textContent = "Something went wrong. Please try again.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Server error. Please try again later.";
    }
  });
});
