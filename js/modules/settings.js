// settings.js

document.addEventListener("DOMContentLoaded", () => {
    const settingsForm = document.getElementById("settings-form");
    const siteTitleInput = document.getElementById("site-title");
    const siteDescriptionInput = document.getElementById("site-description");

    // Placeholder settings (replace with server-side data later)
    const settings = {
        title: "Neil Smith Media Group",
        description: "Photography, Videography, and Media Services",
    };

    // Load initial settings
    siteTitleInput.value = settings.title;
    siteDescriptionInput.value = settings.description;

    // Handle form submission
    settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        settings.title = siteTitleInput.value;
        settings.description = siteDescriptionInput.value;
        alert("Settings saved!");
    });
});
