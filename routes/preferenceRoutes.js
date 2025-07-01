const express = require("express");
const router = express.Router();
const preferenceController = require("../controllers/preferenceController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Get all staff preferences for a manager (must come before /:userId routes)
router.get(
	"/staff",
	authenticateToken,
	requireRole(["manager"]),
	preferenceController.getStaffPreferences
);

// Get user preferences (users can get their own, managers can get their staff's)
router.get(
	"/:userId",
	authenticateToken,
	preferenceController.getUserPreferences
);

// Update user preferences (users can update their own, managers can update their staff's)
router.put(
	"/:userId",
	authenticateToken,
	preferenceController.updateUserPreferences
);

module.exports = router;
