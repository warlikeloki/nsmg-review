// Search Functionality
document.addEventListener('DOMContentLoaded', () => {
    // ... other code ...

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');

    // Search Index (REPLACE THIS WITH YOUR ACTUAL DATA)
    const pages = {
        "index.html": "Welcome to the home page.  Virginia Beach Democrats.",
        "about-us/index.html": "Learn about our officers and bylaws. About Us",
        "media/blog.html": "Read our latest blog posts. Blog",
        "voter-information/index.html": "Find voter information here. Voter Information",
        // Add more pages and their content here
    };

    searchButton.addEventListener('click', () => performSearch());

    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        searchResults.innerHTML = ""; // Clear previous results

        let resultsFound = false;

        for (const page in pages) {
            const content = pages[page].toLowerCase();
            if (content.includes(searchTerm)) {
                const resultLink = document.createElement("a");
                resultLink.href = page;
                resultLink.textContent = `Found on ${page}`;
                searchResults.appendChild(resultLink);
                results.appendChild(document.createElement("br")); // Add a line break
                resultsFound = true;
            }
        }

        if (!resultsFound) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.textContent = "No results found.";
            searchResults.appendChild(noResultsMessage);
        }
    }
});