const express = require('express');
const router = express.Router();
const db = require('../config/db_mysql'); //Get user form user table in MySQL
const authMiddleware = require('../middleware/authMiddleware'); //JWT auth middleware
const bcrypt = require('bcrypt');

//GET user profile (./api/profile)
//fetch the authenticated user's profile from MySQL
router.get('/', authMiddleware, (req, res) => {
    const sql = 'SELECT id, name, email, height, weight, goal FROM users WHERE id = ?';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ msg: 'Server error' });
        if (results.length === 0) return res.status(404).json({ msg: 'User not found' });
        res.json(results[0]);
    });
});

//UPDATE user profile (./api/profile)
router.put('/', authMiddleware, (req, res) => {
    const { name, height, weight, goal } = req.body;
 
    const sql = `
        UPDATE users
        SET
            name   = COALESCE(?, name),
            height = COALESCE(?, height),
            weight = COALESCE(?, weight),
            goal   = COALESCE(?, goal)
        WHERE id = ?
    `;
 
    db.query(sql, [name || null, height || null, weight || null, goal || null, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ msg: 'Server error' });
        if (result.affectedRows === 0) return res.status(404).json({ msg: 'User not found' });
 
        // Return the updated profile
        db.query('SELECT id, name, email, height, weight, goal FROM users WHERE id = ?', [req.user.id], (err2, rows) => {
            if (err2) return res.status(500).json({ msg: 'Server error' });
            res.json({ msg: 'Profile updated successfully', user: rows[0] });
        });
    });
});

//Update password (./api/profile/password)
//change password - requires currentPassword + newPassword
router.put('/password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
 
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Both currentPassword and newPassword are required' });
    }
 
    // Password strength validation (mirrors frontend rules)
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(newPassword)) {
        return res.status(400).json({
            msg: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
        });
    }
 
    db.query('SELECT password FROM users WHERE id = ?', [req.user.id], async (err, results) => {
        if (err) return res.status(500).json({ msg: 'Server error' });
        if (results.length === 0) return res.status(404).json({ msg: 'User not found' });
 
        const isMatch = await bcrypt.compare(currentPassword, results[0].password);
        if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
 
        const hashed = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id], (err2) => {
            if (err2) return res.status(500).json({ msg: 'Server error' });
            res.json({ msg: 'Password changed successfully' });
        });
    });
});

module.exports = router; 