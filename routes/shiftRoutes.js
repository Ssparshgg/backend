const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");
const { authenticateToken, requireRole } = require("../middleware/auth");

router.get("/", authenticateToken, shiftController.getAllShifts);
router.get("/my-shifts", authenticateToken, shiftController.getMyShifts);
router.post(
	"/",
	authenticateToken,
	requireRole(["manager", "staff"]),
	shiftController.createShift
);
router.get("/:id", authenticateToken, shiftController.getShiftById);
router.put(
	"/:id",
	authenticateToken,
	requireRole(["manager"]),
	shiftController.updateShift
);
router.delete(
	"/:id",
	authenticateToken,
	requireRole(["manager"]),
	shiftController.deleteShift
);
router.post(
	"/:id/assign",
	authenticateToken,
	requireRole(["manager"]),
	shiftController.assignShift
);
router.post(
	"/:id/status",
	authenticateToken,
	requireRole(["staff"]),
	shiftController.updateShiftStatus
);
router.post(
	"/:id/approve",
	authenticateToken,
	requireRole(["manager", "staff"]),
	shiftController.approveShift
);
router.post(
	"/:id/cancel",
	authenticateToken,
	requireRole(["manager", "staff"]),
	shiftController.cancelShift
);

// AI Shift Proposal (Staff)
router.post("/propose-preview", shiftController.proposeShiftPreview);
router.post("/propose-save", shiftController.proposeShiftSave);

module.exports = router;
