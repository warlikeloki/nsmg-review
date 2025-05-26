document.addEventListener('DOMContentLoaded', () => {
    const countdownElement = document.getElementById('countdown');
    const countdownLabelElement = document.getElementById('countdown-label');

    // Default values, will be overwritten.
    let targetDateString1 = countdownElement.dataset.targetDate1;
    let targetDateString2 = countdownElement.dataset.targetDate2;
    let currentTargetDateString = targetDateString1;
    let currentTargetDate;
    let intervalId;
    let currentLabel = countdownElement.dataset.label1;

    function initializeCountdown() {
        if (!currentTargetDateString) {
            console.error('Target date is missing from the countdown element.');
            countdownElement.innerHTML = '<div class="error">Error: Target date not set.</div>';
            return;
        }

        currentTargetDate = new Date(currentTargetDateString);

        if (isNaN(currentTargetDate.getTime())) {
            console.error('Invalid target date:', currentTargetDateString);
            countdownElement.innerHTML = '<div class="error">Error: Invalid date format.</div>';
            return;
        }
        updateCountdown();
        if (intervalId) {
            clearInterval(intervalId);
        }
        intervalId = setInterval(updateCountdown, 1000);
    }

    function updateCountdown() {
        const now = new Date();
        const distance = currentTargetDate.getTime() - now;

        if (distance <= 0) {
            if (currentTargetDateString === targetDateString1) {
                currentTargetDateString = targetDateString2;
                currentLabel = countdownElement.dataset.label2;
                if (countdownLabelElement) {
                    countdownLabelElement.textContent = currentLabel;
                }
                initializeCountdown();
                return;
            } else {
                clearInterval(intervalId);
                countdownElement.innerHTML = "The date has passed.";
                return;
            }
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `
            <div class="countdown-item">
                <span id="days">${String(days).padStart(2, '0')}</span>
                <span class="countdown-label">Days</span>
            </div>
            <div class="countdown-item">
                <span id="hours">${hours.toString().padStart(2, "0")}</span>
                <span class="countdown-label">Hours</span>
            </div>
            <div class="countdown-item">
                <span id="minutes">${minutes.toString().padStart(2, "0")}</span>
                <span class="countdown-label">Minutes</span>
            </div>
            <div class="countdown-item">
                <span id="seconds">${seconds.toString().padStart(2, "0")}</span>
                <span class="countdown-label">Seconds</span>
            </div>
        `;
    }

    if (countdownLabelElement) {
        countdownLabelElement.textContent = currentLabel;
    }
    initializeCountdown();
});