document.addEventListener("DOMContentLoaded", () => {
  const ballotId = new URLSearchParams(window.location.search).get("ballot");
  const output = document.getElementById("result-output");
  const chartCanvas = document.getElementById("final-result-chart");

  if (!ballotId) {
    output.innerHTML = "<p class='form-status'>Invalid ballot ID.</p>";
    return;
  }

  fetch(`/ranked-choice/get_ranked_choice_results.php?ballot=${ballotId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        output.innerHTML = `<p class="form-status error">${data.message}</p>`;
        return;
      }

      // Show winner
      const winnerHtml = `
        <div class="ballot-preview">
          <h2>Winner: ${data.winner}</h2>
          <p>Majority determined after ${data.rounds.length} round${data.rounds.length > 1 ? "s" : ""}.</p>
        </div>
      `;

      // Show rounds
      let roundsHtml = "<div class='ballot-preview'><h2>Round-by-Round Results:</h2><ol>";
      data.rounds.forEach((round, index) => {
        roundsHtml += `<li><strong>Round ${index + 1}</strong>:<ul>`;
        for (const [candidate, count] of Object.entries(round.tally)) {
          roundsHtml += `<li>${candidate}: ${count} vote${count !== 1 ? "s" : ""}</li>`;
        }
        roundsHtml += "</ul></li>";
      });
      roundsHtml += "</ol></div>";

      output.innerHTML = winnerHtml + roundsHtml;

      // Build final round bar chart
      const finalRound = data.rounds[data.rounds.length - 1];
      const labels = Object.keys(finalRound.tally);
      const values = Object.values(finalRound.tally);

      new Chart(chartCanvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Final Round Votes',
            data: values,
            backgroundColor: '#39abfd',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Votes'
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          }
        }
      });
    })
    .catch(err => {
      console.error(err);
      output.innerHTML = "<p class='form-status error'>Failed to load results. Please try again later.</p>";
    });
});
