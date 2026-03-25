const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    userId: {
        type: Number, //from MySQL
        required: true
    },

    weight: {
        type: Number
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
    
    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Progress", progressSchema);