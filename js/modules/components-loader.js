/* eslint-disable no-console */
function loadComponents(components) {
    components.forEach(({ id, file }) => {
        fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                document.getElementById(id).innerHTML = data;
                console.log(`${file} loaded successfully.`);
            })
            .catch(error => console.error(`Error loading ${file}:`, error));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponents([
        { id: "header", file: "/header.html" }, // Changed path
        { id: "footer", file: "/footer.html" }  // Changed path
    ]);
});