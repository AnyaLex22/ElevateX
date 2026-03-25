const API_URL = "http://localhost:5000/api/progress";

//Get token from localStorage (store it after login)
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

//GREETING
function setGreeting() {
    const hour = new Date().getHours();
    const greetings = {
        morning:   "Good morning! Let's crush today 💪",
        afternoon: "Good afternoon! Keep the energy up 🔥",
        evening:   "Good evening! How did today go? 🌙"
    };

    const key = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    document.getElementById("greeting").textContent = greetings[key];
}

//LOGOUT
function logout() {
    localStorage.removeItem("token"); //Remove session
    window.location.href = "login.html";
}

//FETCH PROGRESS
async function fetchProgress() {
    const res = await fetch (API_URL, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (res.status === 401 || res.status === 403) {
        logout(); //auto logout if token invalid
        return;
    }

    return await res.json();
}

//PREPARE CHART DATA
function prepareData(data) {
    // Sort oldest → newest for charts
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
 
    const dates    = sorted.map(item => new Date(item.date).toLocaleDateString());
    const weights  = sorted.map(item => item.weight || 0);
    const calories = sorted.map(item => item.caloriesBurned || 0);
 
    // Workout type count (pie chart)
    const workoutMap = {};
    sorted.forEach(item => {
        if (!item.workoutType) return;
        workoutMap[item.workoutType] = (workoutMap[item.workoutType] || 0) + 1;
    });
 
    return {
        dates,
        weights,
        calories,
        workoutLabels: Object.keys(workoutMap),
        workoutCounts: Object.values(workoutMap)
    };
}


//UPDATE STATS CARDS
function updateStats(data) {
    const latestWeight = data.weights[data.weights.length - 1] || 0;
 
    const avgCalories = data.calories.length
        ? (data.calories.reduce((a, b) => a + b, 0) / data.calories.length).toFixed(0)
        : 0;
 
    const totalWorkouts = data.workoutCounts.reduce((a, b) => a + b, 0);
 
    document.getElementById("weightStat").innerText  = latestWeight ? latestWeight + " kg" : "No data";
    document.getElementById("caloriesStat").innerText = avgCalories ? avgCalories + " kcal" : "No data";
    document.getElementById("workoutStat").innerText  = totalWorkouts || "No data";
}


//CREATE CHARTS
function createCharts(data) {
    const CHART_COLORS = {
        blue:   "rgba(56, 189, 248, 1)",
        blueFill: "rgba(56, 189, 248, 0.15)",
        orange: "rgba(251, 146, 60, 1)",
        orangeFill: "rgba(251, 146, 60, 0.15)",
        pie:    ["#38bdf8","#fb923c","#a78bfa","#34d399","#f472b6","#facc15","#60a5fa"]
    };
 
    const emptyMsg = (ctx) => {
        if (!data.dates.length) {
            const { width, height } = ctx.canvas;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "14px DM Sans";
            ctx.textAlign = "center";
            ctx.fillText("No data yet. Log your progress!", width / 2, height / 2);
        }
    };
 
    // ── Weight (line graph) ──
    const wCtx = document.getElementById("weightChart").getContext("2d");
    if (!data.weights.length) { emptyMsg(wCtx); } else {
        new Chart(wCtx, {
            type: "line",
            data: {
                labels: data.dates,
                datasets: [{
                    label: "Weight (kg)",
                    data: data.weights,
                    borderColor: CHART_COLORS.blue,
                    backgroundColor: CHART_COLORS.blueFill,
                    borderWidth: 2,
                    pointBackgroundColor: CHART_COLORS.blue,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: "rgba(0,0,0,0.05)" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
 
    // ── Calories (bar chart) ──
    const cCtx = document.getElementById("caloriesChart").getContext("2d");
    if (!data.calories.length) { emptyMsg(cCtx); } else {
        new Chart(cCtx, {
            type: "bar",
            data: {
                labels: data.dates,
                datasets: [{
                    label: "Calories Burned",
                    data: data.calories,
                    backgroundColor: CHART_COLORS.orangeFill,
                    borderColor: CHART_COLORS.orange,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: "rgba(0,0,0,0.05)" }, beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }
 
    // ── Workout Pie Chart ──
    const pCtx = document.getElementById("workoutChart").getContext("2d");
    if (!data.workoutLabels.length) { emptyMsg(pCtx); } else {
        new Chart(pCtx, {
            type: "pie",
            data: {
                labels: data.workoutLabels,
                datasets: [{
                    data: data.workoutCounts,
                    backgroundColor: CHART_COLORS.pie,
                    borderWidth: 2,
                    borderColor: "#fff"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom", labels: { font: { size: 12 } } }
                }
            }
        });
    }
}


// ─── STREAK LOGIC ────────────────────────────────────────────
//
// Stored in localStorage:
//   streak_count      – number of consecutive days
//   streak_last_date  – "YYYY-MM-DD" of last check-in
//   streak_checked_today – "YYYY-MM-DD" if already checked in today
 
function todayStr() {
    return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}
 
function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}
 
function loadStreak() {
    const count        = parseInt(localStorage.getItem("streak_count") || "0", 10);
    const lastDate     = localStorage.getItem("streak_last_date") || "";
    const checkedToday = localStorage.getItem("streak_checked_today") || "";
    const today        = todayStr();
 
    // If last check-in was before yesterday → streak broken
    if (lastDate && lastDate !== today && lastDate !== yesterdayStr()) {
        localStorage.setItem("streak_count", "0");
        localStorage.setItem("streak_last_date", "");
        localStorage.removeItem("streak_checked_today");
        return { count: 0, checkedToday: false };
    }
 
    return { count, checkedToday: checkedToday === today };
}
 
function renderStreak() {
    const { count, checkedToday } = loadStreak();
    const btn = document.getElementById("checkinBtn");
    const msg = document.getElementById("streakMsg");
 
    document.getElementById("streakCount").textContent =
        count > 0 ? `${count} day${count > 1 ? "s" : ""}` : "0 days";
 
    if (checkedToday) {
        btn.textContent  = "✓ Checked in!";
        btn.disabled     = true;
        btn.classList.add("checked");
        msg.textContent  = "Great job! See you tomorrow 🎉";
    } else {
        btn.textContent  = "Check In Today";
        btn.disabled     = false;
        btn.classList.remove("checked");
        msg.textContent  = count > 0
            ? `Don't break your ${count}-day streak!`
            : "Start your streak today!";
    }
}
 
function handleCheckin() {
    const today    = todayStr();
    const { count } = loadStreak();
    const lastDate = localStorage.getItem("streak_last_date") || "";
 
    // Don't double-count if somehow called twice
    if (localStorage.getItem("streak_checked_today") === today) return;
 
    const newCount = (lastDate === yesterdayStr() || lastDate === today)
        ? count + 1
        : 1;  // fresh start or first ever
 
    localStorage.setItem("streak_count", String(newCount));
    localStorage.setItem("streak_last_date", today);
    localStorage.setItem("streak_checked_today", today);
 
    // Save check-in log for progress tracking page
    saveDailyLog("checkin", { checked: true });
 
    renderStreak();
}
 
// ─── DAILY TASKS ─────────────────────────────────────────────
//
// Stored in localStorage as JSON:
//   daily_tasks – { date: "YYYY-MM-DD", workout: {...}, water: {...}, mindfulness: {...} }
 
function loadTasks() {
    const today   = todayStr();
    const raw     = localStorage.getItem("daily_tasks");
    const stored  = raw ? JSON.parse(raw) : null;
 
    // Reset if stored for a different day
    if (!stored || stored.date !== today) {
        const fresh = {
            date: today,
            workout:     { done: null },
            water:       { glasses: 0, done: false },
            mindfulness: { done: null }
        };
        localStorage.setItem("daily_tasks", JSON.stringify(fresh));
        return fresh;
    }
 
    return stored;
}
 
function saveTasks(tasks) {
    localStorage.setItem("daily_tasks", JSON.stringify(tasks));
}
 
function renderTasks(tasks) {
    renderWorkoutTask(tasks.workout);
    renderWaterTask(tasks.water);
    renderMindfulnessTask(tasks.mindfulness);
}
 
function setBadge(taskName, status) {
    const badge = document.getElementById(`badge-${taskName}`);
    badge.textContent = status === true  ? "✓ Done"
                      : status === false ? "✗ Skipped"
                      : "Pending";
    badge.className = "task-badge " +
        (status === true ? "done" : status === false ? "skipped" : "");
 
    const card = document.getElementById(`task-${taskName}`);
    card.classList.toggle("completed", status === true);
    card.classList.toggle("skipped-task", status === false);
}
 
//WORKOUT TASK
function renderWorkoutTask(workout) {
    setBadge("workout", workout.done);
    if (workout.done !== null) {
        const actions = document.querySelector("#task-workout .task-actions");
        actions.innerHTML = workout.done
            ? `<p class="done-msg">Awesome work! 💪 Logged.</p>`
            : `<p class="done-msg">That's okay — show up tomorrow! 🙏</p>`;
    }
}
 
//WATER INTAKE TASK
function renderWaterTask(water) {
    const pct = Math.min((water.glasses / 8) * 100, 100);
    document.getElementById("waterFill").style.width = pct + "%";
    document.getElementById("waterLabel").textContent = `${water.glasses} / 8`;
    document.getElementById("waterCount").value = water.glasses || "";
 
    const done = water.glasses >= 8;
    setBadge("water", done ? true : water.glasses > 0 ? null : null);
    if (done) {
        document.getElementById("badge-water").textContent = "✓ Done";
        document.getElementById("badge-water").className = "task-badge done";
    }
}
 
//MINDFULNESS TASK
function renderMindfulnessTask(mindfulness) {
    setBadge("mindfulness", mindfulness.done);
    if (mindfulness.done !== null) {
        const actions = document.querySelector("#task-mindfulness .task-actions");
        actions.innerHTML = mindfulness.done
            ? `<p class="done-msg">Beautiful. Keep finding your calm 🧘</p>`
            : `<p class="done-msg">Tomorrow is another chance 🌿</p>`;
    }
}
 
//COMPLETE TASKS
function completeTask(taskName, value) {
    const tasks = loadTasks();
 
    if (taskName === "workout") {
        tasks.workout.done = value;
        saveTasks(tasks);
        renderWorkoutTask(tasks.workout);
        saveDailyLog("workout", { done: value });
    }
 
    if (taskName === "water") {
        const glasses = parseInt(document.getElementById("waterCount").value, 10) || 0;
        tasks.water.glasses = glasses;
        tasks.water.done    = glasses >= 8;
        saveTasks(tasks);
        renderWaterTask(tasks.water);
        saveDailyLog("water", { glasses });
    }
 
    if (taskName === "mindfulness") {
        tasks.mindfulness.done = value;
        saveTasks(tasks);
        renderMindfulnessTask(tasks.mindfulness);
        saveDailyLog("mindfulness", { done: value });
    }
}
 
// ─── DAILY LOG (for progress tracking page later) ────────────
//
// Appends entries to localStorage "daily_logs" array.
// Each entry: { date, type, data, timestamp }
// The progress tracking page can read and display these.
 
function saveDailyLog(type, data) {
    const today = todayStr();
    const raw   = localStorage.getItem("daily_logs");
    const logs  = raw ? JSON.parse(raw) : [];
 
    // Remove old log of same type on same day (upsert)
    const filtered = logs.filter(l => !(l.date === today && l.type === type));
    filtered.push({ date: today, type, data, timestamp: new Date().toISOString() });
 
    localStorage.setItem("daily_logs", JSON.stringify(filtered));
}
 
// ─── INIT ────────────────────────────────────────────────────
async function init() {
    setGreeting();
 
    // Streak
    renderStreak();
 
    // Tasks
    const tasks = loadTasks();
    renderTasks(tasks);
 
    // Charts & stats
    try {
        const rawData  = await fetchProgress();
        if (!rawData || !rawData.length) {
            document.getElementById("weightStat").innerText  = "No data";
            document.getElementById("caloriesStat").innerText = "No data";
            document.getElementById("workoutStat").innerText  = "No data";
            createCharts({ dates: [], weights: [], calories: [], workoutLabels: [], workoutCounts: [] });
            return;
        }
 
        const processed = prepareData(rawData);
        updateStats(processed);
        createCharts(processed);
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}
 
init();