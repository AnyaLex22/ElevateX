const token = localStorage.getItem('token');

const form = document.getElementById('workoutForm');
const list = document.getElementById('workoutList');

//Load workouts
async function loadWorkouts() {
    const res = await fetch('/api/workouts', {
        headers: {Authorization: `Bearer ${token}`}
    });

    const data = await res.json();
    list.innerHTML = data.map(w => `
        <li>
            ${w.workoutType} - ${w.duration} min - ${w.caloriesBurned || 0} cal
        </li>
        `).join(' ');
}

//Add workout
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    await fetch('/api/workouts', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
        },

        body: JSON.stringify ({
            workoutType: document.getElementById('type').value,
            duration: document.getElementById('duration').value,
            caloriesBurned: document.getElementById('calories').value
        })
    });

    loadWorkouts();
});

loadWorkouts();
