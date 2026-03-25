const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema ({
    userId: {
        type: Number,
        required: true
    },

    workoutType: {
        type: String
    },

    duration: {
        type: Number
    },

    caloriesBurned: {
        type: Number
    },

    notes: {
        type: String,
    },

    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Workout', workoutSchema);