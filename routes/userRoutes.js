const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Get all managers (should come before /:id routes)
router.get("/managers", authenticateToken, userController.getManagers);

// Get staff by manager (should come before /:id routes)
router.get(
	"/managers/:managerId/staff",
	authenticateToken,
	requireRole(["manager"]),
	userController.getStaffByManager
);

// Assign staff to manager (should come before /:id routes)
router.post(
	"/assign",
	authenticateToken,
	requireRole(["manager"]),
	userController.assignStaffToManager
);

// Assign staff to manager (PUT method)
router.put(
	"/:staffId/assign-manager",
	authenticateToken,
	requireRole(["manager"]),
	userController.assignStaffToManager
);

// Get all users (managers only)
router.get(
	"/",
	authenticateToken,
	requireRole(["manager"]),
	userController.getAllUsers
);

// Create new user (managers only)
router.post(
	"/",
	authenticateToken,
	requireRole(["manager"]),
	userController.createUser
);

// Get user by ID (managers only)
router.get(
	"/:id",
	authenticateToken,
	requireRole(["manager"]),
	userController.getUserById
);

// Update user (managers only)
router.put(
	"/:id",
	authenticateToken,
	requireRole(["manager"]),
	userController.updateUser
);

// Delete user (managers only)
router.delete(
	"/:id",
	authenticateToken,
	requireRole(["manager"]),
	userController.deleteUser
);

// Remove staff from manager (should come after /:id routes)
router.delete(
	"/:staffId/manager",
	authenticateToken,
	requireRole(["manager"]),
	userController.removeStaffFromManager
);

module.exports = router;
