const express  = require('express');
const router   = express.Router();
const DailyLog = require('../models/mongo/DailyLog');
const auth     = require('../middleware/authMiddleware');

// ─── HELPERS ─────────────────────────────────────────────────

// Returns "YYYY-MM-DD" for a given Date object (or today if omitted)
function toDateStr(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateStr(d);
}

// ─── POST /api/logs ──────────────────────────────────────────
// Upsert a daily log entry for the authenticated user.
// Body: { type, date?, workoutData | waterData | mindfulnessData | checkinData }
//
// Using findOneAndUpdate with upsert:true so calling this twice on the
// same day for the same type just updates the existing record (no duplicates).

router.post('/', auth, async (req, res) => {
    const { type, date, workoutData, waterData, mindfulnessData, checkinData } = req.body;

    if (!type) return res.status(400).json({ error: 'type is required' });

    const dateStr = date || toDateStr();

    // Build the data payload for this type
    const dataField = {
        workout:     workoutData ? { workoutData } : null,
        water:       waterData ? { waterData } : null,
        mindfulness: mindfulnessData ? { mindfulnessData } : null,
        checkin:     checkinData ? { checkinData } : null,
    }[type];

    if (!dataField) return res.status(400).json({ error: `Unknown type or missing data: ${type}` });

    try {
        const log = await DailyLog.findOneAndUpdate(
            { userId: req.user.id, date: dateStr, type },           // filter
            {$set: { ...dataField, timestamp: new Date() }},       // update
            { upsert: true, new: true, setDefaultsOnInsert: true }   // options
        );

        res.json(log);
    } catch (err) {
        console.error('DailyLog save error:', err.message); //<- shows exact error in Render logs
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/logs ───────────────────────────────────────────
// Fetch all logs for the authenticated user.
// Optional query params:
//   ?type=workout|water|mindfulness|checkin   → filter by type
//   ?date=YYYY-MM-DD                          → filter by specific day
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD            → filter by date range

router.get('/', auth, async (req, res) => {
    const { type, date, from, to } = req.query;

    const filter = { userId: req.user.id };

    if (type)          filter.type = type;
    if (date)          filter.date = date;
    if (from || to)    filter.date = {
        ...(from && { $gte: from }),
        ...(to   && { $lte: to   })
    };

    try {
        const logs = await DailyLog.find(filter).sort({ date: -1, timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/logs/today ─────────────────────────────────────
// Fetch all log entries for the authenticated user for today.
// The frontend uses this on page load to restore task state.

router.get('/today', auth, async (req, res) => {
    try {
        const logs = await DailyLog.find({
            userId: req.user.id,
            date:   toDateStr()
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/logs/streak ────────────────────────────────────
// Computes the current check-in streak for the authenticated user.
// Returns: { streak: number, lastCheckinDate: string | null, checkedInToday: boolean }
//
// Logic:
//   1. Fetch all checkin logs for this user, sorted date descending.
//   2. Walk backwards from today, counting consecutive days that have a checkin.
//   3. Stop as soon as a day is missing.

router.get('/streak', auth, async (req, res) => {
    try {
        const checkins = await DailyLog.find({
            userId: req.user.id,
            type:   'checkin',
            'checkinData.checked': true
        }).sort({ date: -1 });  // most recent first

        if (!checkins.length) {
            return res.json({ streak: 0, lastCheckinDate: null, checkedInToday: false });
        }

        const today     = toDateStr();
        const yest      = yesterday();
        const dates     = new Set(checkins.map(c => c.date));
        const checkedInToday = dates.has(today);

        // Start counting from today (if checked in) or yesterday
        let streak  = 0;
        let cursor  = new Date(); // start from today

        // If not checked in today and not checked in yesterday → streak is 0
        if (!checkedInToday && !dates.has(yest)) {
            return res.json({
                streak: 0,
                lastCheckinDate: checkins[0].date,
                checkedInToday: false
            });
        }

        // Walk back day by day while dates has a checkin
        while (true) {
            const dayStr = toDateStr(cursor);
            if (dates.has(dayStr)) {
                streak++;
                cursor.setDate(cursor.getDate() - 1);
            } else {
                break;
            }
        }

        res.json({
            streak,
            lastCheckinDate: checkins[0].date,
            checkedInToday
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;