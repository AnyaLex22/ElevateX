const express = require('express');
const router = express.Router();
const Workout = require('../models//mongo/Workout');
const auth = require('../middleware/authMiddleware');

//Add Workout
router.post('/', auth, async (req, res) => {
    try {
        const workout = new Workout({
            userId: req.user.id,
            ...req.body
        });

        await workout.save();
        res.json(workout);
    } catch (err)
 {
    res.status(500).json({error: err.message});
 }
});

//Get workouts
router.get('/', auth, async (req, res) => {
    const workouts = await Workout.find({userId: req.user.id}).sort({date: -1});
    res.json(workouts)
});

module.exports = router;