const API_URL = "http://localhost:5000";
const token = localStorage.getItem('token');

const form = document.getElementById('progressForm');
const list = document.getElementById('progressTableBody');

//Load progress
async function loadProgress() {
    try {
        const res = await fetch(`${API_URL}/api/progress`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch progress');

        const data = await res.json();

        // Sort by date descending (most recent first)
        data.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Populate table
        progressTableBody.innerHTML = data.map(p => `
            <tr>
                <td>${new Date(p.date).toLocaleDateString()}</td>
                <td>${p.workoutType}</td>
                <td>${p.caloriesBurned || 0}</td>
                <td>${p.weight || '-'}</td>
                <td>${p.duration || '-'}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        progressTableBody.innerHTML = '<tr><td colspan="5">Failed to load progress. Check console for errors.</td></tr>';
    }
}

//Add Progress
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const workoutType = document.getElementById('workoutType').value;
    const duration = document.getElementById('duration').value;
    const caloriesBurned = document.getElementById('caloriesBurned').value;
    const weight = document.getElementById('weight').value;

    try {
        const res = await fetch(`${API_URL}/api/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ date, workoutType, duration, caloriesBurned, weight })
        });

        if (!res.ok) throw new Error('Failed to add progress');

        form.reset(); //Clear form

        loadProgress(); //refresh table 


    } catch (err) {
        console.error(err);
        alert('Error adding progress. Check console.');
    }
});

//Initial load
loadProgress();
