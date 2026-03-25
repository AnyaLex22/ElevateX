//const API_KEY = "4743920b6aa746b299d662a9041e91fb";

async function loadArticles(topic = "health") {
    const container = document.getElementById("articlesList");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(
            `http://localhost:5000/api/articles?topic=${topic}`
        );

        const data = await res.json();
        console.log(data); //temporary

        if (!data.articles || data.articles.length === 0) {
            container.innerHTML = "<p>No articles found.</p>";
            return;
        }

        container.innerHTML = data.articles.map(article => `
            <div class="article-card">
                <img src="${article.urlToImage || 'https://via.placeholder.com/300'}" />
                <h3>${article.title}</h3>
                <p>${article.description || "No description available."}</p>
                <a href="${article.url}" target="_blank">Read More →</a>
            </div>
        `).join("");

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading articles.</p>";
    }
}

// Load default
loadArticles();