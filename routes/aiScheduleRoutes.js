const express = require("express");
const router = express.Router();
const {
	generateAISchedule,
	previewAISchedule,
	getAIScheduleStats,
	savePreviewSchedule,
} = require("../controllers/aiScheduleController");
const { authenticateToken } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Generate AI-powered schedule
router.post("/generate", generateAISchedule);

// Preview AI schedule without saving
router.post("/preview", previewAISchedule);

// Save preview schedule data directly
router.post("/save-preview", savePreviewSchedule);

// Get AI schedule generation statistics
router.get("/stats", getAIScheduleStats);

module.exports = router;
