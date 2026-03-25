const express = require('express');
const router = express.Router();
const db = require('../config/db_mysql'); //Get user form user table in MySQL
const authMiddleware = require('../middleware/authMiddleware'); //JWT auth middleware

//GET user profile
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    const sql = "SELECT id, name, email, age, height, weight, goal FROM users WHERE id=?";

    db.query(sql, [userId], (err, results) => {
        if(err) return res.status(500).json({msg: err.message});

        if (results.length === 0) {
            return res.status(404).json({msg: 'User not found'});
        }

        res.json(results[0]);
    });
});

//UPDATE user profile
router.put('/', authMiddleware, async (req, res) => {

    const { name, age, height, weight, goal } = req.body;
    const userId = req.user.id;
    const nameVal = name || null;
    const ageVal = age || null;
    const heightVal = height || null;
    const weightVal = weight || null;
    const goalVal = goal || null;
    
    const sql = `
        UPDATE users
        SET
            name = COALESCE(?, name),
            age = COALESCE(?, age),
            height = COALESCE(?, height),
            weight = COALESCE(?, weight),
            goal = COALESCE(?, goal)
        WHERE id = ?
    `;

    db.query(sql, [nameVal, ageVal, heightVal, weightVal, goalVal, userId], (err, result) => {
    if (err) return res.status(500).json({ msg: err.message });

    res.json({ msg: 'Profile updated successfully' });
    });
});

module.exports = router; 