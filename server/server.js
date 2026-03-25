//MYSQL
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

//MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true})); //optional, for form data

//ROUTES
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/user', userRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);

const progressRoutes = require('./routes/progressRoutes');
app.use('/api/progress', progressRoutes);

const workoutRoutes = require('./routes/workoutRoutes');
app.use('/api/workouts', workoutRoutes);

//Fetch NewsAPI
app.get("/api/articles", async (req, res) => {
    try {
        const topic = req.query.topic || "health";

        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${topic}&language=en&pageSize=6&apiKey=${process.env.NEWS_API_KEY}`
        );

        const data = await response.json();

        res.json(data); // MUST return full data including articles

    } catch (err) {
        console.error("Articles API error:", err);
        res.status(500).json({ error: "Failed to fetch articles" });
    }
});

//START SERVER
const PORT = process.env.PORT || 5000;

//MONGODB
const connectMongoDB = require('./config/db_mongo');
connectMongoDB();

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
