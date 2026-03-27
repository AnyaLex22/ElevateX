const mongoose = require('mongoose');

//SUB-SCHEMA (one per task type)
const workoutDataSchema = new mongoose.Schema({
    done: {type: Boolean, default: null} //true = completed, false = skipped, null = not answered
}, {_id: false});

const waterDataSchema = new mongoose.Schema({
    glasses: {type: Number, default: 0}, //0-20
    done: {type: Boolean, default: false} //true when glasses >= 8
}, {_id: false});

const mindfulnessDataSchema = new mongoose.Schema({
    done: {type: Boolean, default: null} //true = completed, false = skipped
}, {_id: false});

const checkinDataSchema = new mongoose.Schema({
    checked: {type: Boolean, default: false} //true = completed, false = skipped
}, {_id: false});

//MAIN SCHEMA
const dailyLogSchema = new mongoose.Schema({
    userId: {
        type: Number, //from MySQL users table (matches Progress.js & Workout.js)
        required: true
    },

    date: {
        type: String, //"YYYY-MM-DD"
        required: true
    },

    type: {
        type: String,
        enum: ['workout', 'water', 'mindfulness', 'checkin'],
        required: true
    },

    //Only one of these will be populated depending on 'type
    workoutData: workoutDataSchema,
    waterData: waterDataSchema,
    mindfulnessData: mindfulnessDataSchema,
    checkinData: checkinDataSchema,

    timestamp: {
        type: Date,
        default: Date.now //exact time of the log entry (for display in progress page)
    }
});

//COMPOUND INDEX
//One log per user per day per type (upsert target)
//Keeps the collection clean and queries fast
dailyLogSchema.index({userId: 1, date: 1, type: 1}, {unique: true});

module.exports = mongoose.model('DailyLog', dailyLogSchema);