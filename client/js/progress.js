// ============================================================
//  Elevate X — progress.js
//  Workout progress table → MongoDB /api/progress
//  Daily task logs        → MongoDB /api/logs
// ============================================================

const API_URL = "http://localhost:5000";
const token = localStorage.getItem('token');

// ─── AUTH GUARD ──────────────────────────────────────────────
if (!token) window.location.href = 'login.html';
 
const form           = document.getElementById('progressForm');
const progressTBody  = document.getElementById('progressTableBody');
const taskLogsBody   = document.getElementById('taskLogsBody');
const noLogsMsg      = document.getElementById('noLogsMsg');
const addProgressBtn = document.getElementById('addProgressBtn');
 
// ─── TOAST ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ─── LOGOUT ─────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('streak_checked_today');
    localStorage.removeItem('daily_tasks');
    window.location.href = 'login.html';
}

//  WORKOUT PROGRESS TABLE  —  /api/progress (MongoDB)

// ─── SKELETON ROWS ───────────────────────────────────────────
function skeletonRows(cols = 5, rows = 3) {
    return Array.from({ length: rows }, () => `
        <tr class="skeleton-row">
            ${Array.from({ length: cols }, () =>
                `<td><div class="skeleton-cell"></div></td>`
            ).join('')}
        </tr>
    `).join('');
}

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

        if(!data.length) {
            progressTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="color: var(--muted); font-style:italic;">
                        No workout progress logged yet.
                    </td>
                </tr>`;

                return;
        }

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
        progressTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="color:var(--danger);">
                    Failed to load progress. Check your connection.
                </td>
            </tr>`;
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

// ─── DAILY TASK LOGS ─────────────────────────────────────────
//
// Reads from localStorage("daily_logs") written by dashboard.js.
// Each entry: { date, type, data, timestamp }
//   type:  "workout" | "water" | "mindfulness" | "checkin"
//   data:
//     workout     → { done: true | false }
//     water       → { glasses: number }
//     mindfulness → { done: true | false }
//     checkin     → { checked: true }
 
let allLogs = []; // cache for client-side filtering
 
//FORMATTERS
function formatTaskType(type) {
    const map = {
        workout:     '🏋️ Workout',
        water:       '💧 Water Intake',
        mindfulness: '🧘 Mindfulness',
        checkin:     '🔥 Check-in Streak'
    };
    return map[type] || type;
}
 
function formatStatus(type, data) {
    if (type === 'workout') {
        if (data.done === true)  return '<span class="log-badge done">✓ Completed</span>';
        if (data.done === false) return '<span class="log-badge skipped">✗ Skipped</span>';
        return '<span class="log-badge pending">Pending</span>';
    }
 
    if (type === 'water') {
        const g = data.glasses ?? 0;
        const pct = Math.min(Math.round((g / 8) * 100), 100);
        const badgeClass = g >= 8 ? 'done' : g > 0 ? 'partial' : 'skipped';
        const label = g >= 8 ? `✓ ${g} / 8 glasses` : `${g} / 8 glasses`;
        return `
            <div class="water-log-wrap">
                <span class="log-badge ${badgeClass}">${label}</span>
                <div class="water-bar mini">
                    <div class="water-fill" style="width:${pct}%"></div>
                </div>
            </div>`;
    }
 
    if (type === 'mindfulness') {
        if (data.done === true)  return '<span class="log-badge done">✓ Completed</span>';
        if (data.done === false) return '<span class="log-badge skipped">✗ Skipped</span>';
        return '<span class="log-badge pending">Pending</span>';
    }
 
    if (type === 'checkin') {
        return '<span class="log-badge done">✓ Checked In</span>';
    }
 
    return '—';
}

function formatLogDate(dateStr) {
    // dateStr is "YYYY-MM-DD" — parse as local time to avoid timezone-shift
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatLogTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
 
//RENDER
function renderLogs(logs) {
    if (!logs.length) {
        taskLogsBody.innerHTML = '';
        noLogsMsg.style.display = 'block';
        return;
    }
 
    noLogsMsg.style.display = 'none';
 
    // Sort most recent date first, then by timestamp within same day
    const sorted = [...logs].sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
 
    taskLogsBody.innerHTML = sorted.map(log => `
        <tr>
            <td>${new Date(log.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            })}</td>
            <td>${formatTaskType(log.type)}</td>
            <td>${formatStatus(log.type, log.data)}</td>
            <td>${formatLogTime(log.timestamp)}</td>
        </tr>
    `).join('');
}
 

//FETCH FROM API
function loadTaskLogs() {
    const raw  = localStorage.getItem('daily_logs');
    allLogs    = raw ? JSON.parse(raw) : [];
    renderLogs(allLogs);
}
 
// ─── FILTER BUTTONS ──────────────────────────────────────────
function filterLogs(type, btn) {
    // Update active button style
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
 
    const filtered = type === 'all'
        ? allLogs
        : allLogs.filter(l => l.type === type);
 
    renderLogs(filtered);
}

//Initial load
loadProgress();
loadTaskLogs();
