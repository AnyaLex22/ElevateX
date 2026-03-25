const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

//Protected route
router.get("/profile", authenticateToken, (req, res) => {
    res.json({
        message: "Protected data accessed!",
        user: req.user
    });
});

module.exports = router;