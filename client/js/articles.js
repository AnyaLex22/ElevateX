//  Loads articles from /api/articles with loading + empty states
function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 4000);
}
 
//RENDER ARTICLES
async function loadArticles(topic = "health") {
    const container = document.getElementById("articlesList");
    
    // ── Loading state ──────────────────────────────────────
    container.innerHTML = `
        <div class="articles-loading" style="grid-column:1/-1;">
            <div class="spinner"></div>
            <p style="font-size:0.9rem;">Loading ${topic} articles…</p>
        </div>
    `;

    try {
        const token = localStorage.getItem('token');
        const res   = await fetch(
            `http://localhost:5000/api/articles?topic=${encodeURIComponent(topic)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
 
        if (res.status === 401 || res.status === 403) {
            window.location.href = 'login.html';
            return;
        }
 
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
 
        const data = await res.json();
 
        // ── Empty state ────────────────────────────────────
        if (!data.articles || data.articles.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="empty-icon">📭</div>
                    <h3>No articles found</h3>
                    <p>We couldn't find any articles for "<strong>${topic}</strong>" right now. Try a different category or check back later.</p>
                </div>
            `;
            return;
        }
 
        // ── Render articles ────────────────────────────────
        container.innerHTML = data.articles.map(article => `
            <div class="article-card">
                <img
                    src="${article.urlToImage || ''}"
                    alt="${article.title}"
                    onerror="this.style.display='none'"
                    loading="lazy"
                />
                <h3>${article.title}</h3>
                <p>${article.description || 'No description available.'}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read More →</a>
            </div>
        `).join('');
 
    } catch (err) {
        console.error('Articles error:', err);
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="empty-icon">⚠️</div>
                <h3>Could not load articles</h3>
                <p>There was a problem fetching articles. Please check your connection and try again.</p>
            </div>
        `;
        showToast('Failed to load articles. Check your connection.', 'error');
    }
}
 
// Load default on page open
loadArticles('health');