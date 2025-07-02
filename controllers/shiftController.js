const shiftService = require("../services/shiftService");
const { parseShiftProposal } = require("../services/geminiService");
const Shift = require("../models/Shift");

// Utility function to safely compare ObjectIds
const safeObjectIdCompare = (id1, id2) => {
	if (!id1 || !id2) return false;

	// Handle populated objects that have _id property
	const getId1 = id1._id || id1;
	const getId2 = id2._id || id2;

	return getId1.toString() === getId2.toString();
};

const getAllShifts = async (req, res) => {
	try {
		let shifts;
		if (req.user.role === "manager") {
			shifts = await shiftService.getShiftsForManager(req.user._id);
		} else {
			shifts = await shiftService.getAllShifts();
		}
		res.json(shifts);
	} catch (error) {
		console.error("Get all shifts error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const getMyShifts = async (req, res) => {
	try {
		const shifts = await shiftService.getShiftsByUser(req.user._id);
		res.json(shifts);
	} catch (error) {
		console.error("Get my shifts error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const createShift = async (req, res) => {
	try {
		let shiftData = { ...req.body, createdBy: req.user._id };

		// Date validation: Prevent booking before today
		const now = new Date();
		now.setHours(0, 0, 0, 0); // Set to start of today
		const shiftStart = new Date(shiftData.startTime);
		if (shiftStart < now) {
			return res
				.status(400)
				.json({ message: "Cannot book a shift before today." });
		}

		// If staff is creating a shift (proposing)
		if (req.user.role === "staff") {
			shiftData.assignedTo = req.user._id;
			shiftData.status = "proposed";
		}
		// If manager is creating a shift (scheduling)
		else if (req.user.role === "manager") {
			// If manager assigns to a staff member, it needs staff approval
			if (shiftData.assignedTo && shiftData.assignedTo !== req.user._id) {
				shiftData.status = "scheduled";
			} else {
				shiftData.status = "confirmed";
			}
		}

		const shift = await shiftService.createShift(shiftData);
		res.status(201).json(shift);
	} catch (error) {
		console.error("Create shift error:", error);
		res.status(400).json({ message: error.message });
	}
};

const getShiftById = async (req, res) => {
	try {
		const shift = await shiftService.getShiftById(req.params.id);
		if (!shift) return res.status(404).json({ message: "Shift not found" });
		res.json(shift);
	} catch (error) {
		console.error("Get shift by ID error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const updateShift = async (req, res) => {
	try {
		const shift = await shiftService.updateShift(req.params.id, req.body);
		if (!shift) return res.status(404).json({ message: "Shift not found" });
		res.json(shift);
	} catch (error) {
		console.error("Update shift error:", error);
		res.status(400).json({ message: error.message });
	}
};

const deleteShift = async (req, res) => {
	try {
		const success = await shiftService.deleteShift(req.params.id);
		if (!success) return res.status(404).json({ message: "Shift not found" });
		res.json({ message: "Shift deleted" });
	} catch (error) {
		console.error("Delete shift error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const assignShift = async (req, res) => {
	try {
		const shift = await shiftService.assignShift(
			req.params.id,
			req.body.staffId
		);
		if (!shift) return res.status(404).json({ message: "Shift not found" });
		res.json(shift);
	} catch (error) {
		console.error("Assign shift error:", error);
		res.status(400).json({ message: error.message });
	}
};

const updateShiftStatus = async (req, res) => {
	try {
		const shift = await shiftService.updateShiftStatus(
			req.params.id,
			req.body.status
		);
		if (!shift) return res.status(404).json({ message: "Shift not found" });
		res.json(shift);
	} catch (error) {
		console.error("Update shift status error:", error);
		res.status(400).json({ message: error.message });
	}
};

const approveShift = async (req, res) => {
	try {
		const { action } = req.body; // "approve" or "reject"
		const shift = await shiftService.getShiftById(req.params.id);

		console.log("Approve shift debug:", {
			userId: req.user._id,
			userRole: req.user.role,
			shiftId: req.params.id,
			shiftStatus: shift?.status,
			action: action,
			shiftAssignedTo: shift?.assignedTo,
			shiftCreatedBy: shift?.createdBy,
		});

		if (!shift) {
			return res.status(404).json({ message: "Shift not found" });
		}

		let newStatus;

		// Managers have broader permissions - can approve/reject proposed or scheduled shifts
		if (req.user.role === "manager") {
			if (shift.status === "proposed") {
				newStatus = action === "approve" ? "confirmed" : "rejected";
			} else if (shift.status === "scheduled") {
				newStatus = action === "approve" ? "confirmed" : "rejected";
			} else {
				return res
					.status(400)
					.json({ message: "Invalid shift status for this action" });
			}
		}
		// Staff can only approve/reject scheduled shifts assigned to them
		else if (
			req.user.role === "staff" &&
			shift.status === "scheduled" &&
			safeObjectIdCompare(shift.assignedTo, req.user._id)
		) {
			newStatus = action === "approve" ? "confirmed" : "rejected";
		} else {
			console.log("Permission denied for approve/reject:", {
				userRole: req.user.role,
				shiftStatus: shift.status,
				userAssigned: safeObjectIdCompare(shift.assignedTo, req.user._id),
			});
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		console.log("Updating shift status to:", newStatus);

		const updatedShift = await shiftService.updateShiftStatus(
			req.params.id,
			newStatus
		);
		res.json(updatedShift);
	} catch (error) {
		console.error("Approve shift error:", error);
		res.status(400).json({ message: error.message });
	}
};

const cancelShift = async (req, res) => {
	try {
		const shift = await shiftService.getShiftById(req.params.id);

		console.log("Cancel shift debug:", {
			userId: req.user._id,
			userRole: req.user.role,
			shiftId: req.params.id,
			shiftStatus: shift?.status,
			shiftAssignedTo: shift?.assignedTo,
			shiftCreatedBy: shift?.createdBy,
		});

		if (!shift) {
			return res.status(404).json({ message: "Shift not found" });
		}

		// Managers can cancel any shift
		if (req.user.role === "manager") {
			// Don't allow cancellation of already cancelled or rejected shifts
			if (shift.status === "cancelled" || shift.status === "rejected") {
				return res
					.status(400)
					.json({ message: "Shift is already cancelled or rejected" });
			}
		}
		// Staff can only cancel shifts they created or are assigned to
		else if (req.user.role === "staff") {
			const isCreator = safeObjectIdCompare(shift.createdBy, req.user._id);
			const isAssigned = safeObjectIdCompare(shift.assignedTo, req.user._id);
			const canCancel = isCreator || isAssigned;

			console.log("Staff cancel permissions:", {
				isCreator,
				isAssigned,
				canCancel,
				userCreatedBy: shift.createdBy?.toString(),
				userAssignedTo: shift.assignedTo?.toString(),
				currentUserId: req.user._id?.toString(),
			});

			if (!canCancel) {
				return res.status(403).json({ message: "Insufficient permissions" });
			}

			// Don't allow cancellation of already cancelled or rejected shifts
			if (shift.status === "cancelled" || shift.status === "rejected") {
				return res
					.status(400)
					.json({ message: "Shift is already cancelled or rejected" });
			}
		} else {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		console.log("Cancelling shift");

		const updatedShift = await shiftService.updateShiftStatus(
			req.params.id,
			"cancelled"
		);
		res.json(updatedShift);
	} catch (error) {
		console.error("Cancel shift error:", error);
		res.status(400).json({ message: error.message });
	}
};

// AI Shift Proposal (Staff)
async function proposeShiftPreview(req, res) {
	try {
		const { userId, naturalLanguage } = req.body;
		if (!userId || !naturalLanguage) {
			return res
				.status(400)
				.json({ message: "userId and naturalLanguage are required" });
		}
		const previewShifts = await parseShiftProposal(naturalLanguage, userId);
		return res.json({ previewShifts });
	} catch (error) {
		console.error("proposeShiftPreview error:", error);
		return res
			.status(500)
			.json({ message: error.message || "Failed to parse shift proposal" });
	}
}

// Optionally, update proposeShiftSave to accept multiple shifts (future-proof)
async function proposeShiftSave(req, res) {
	try {
		const { userId, previewShifts } = req.body;
		if (
			!userId ||
			!previewShifts ||
			!Array.isArray(previewShifts) ||
			previewShifts.length === 0
		) {
			return res
				.status(400)
				.json({ message: "userId and previewShifts (array) are required" });
		}

		// Date validation: Prevent booking before today for any shift
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		for (const previewShift of previewShifts) {
			const shiftStart = new Date(previewShift.startTime);
			if (shiftStart < now) {
				return res
					.status(400)
					.json({ message: "Cannot book a shift before today." });
			}
		}

		// Save all shifts as proposed (pending manager approval)
		const savedShifts = [];
		for (const previewShift of previewShifts) {
			const newShift = new Shift({
				...previewShift,
				assignedTo: userId,
				status: "proposed",
				createdBy: userId,
			});
			await newShift.save();
			const populatedShift = await Shift.findById(newShift._id).populate(
				"assignedTo createdBy"
			);
			savedShifts.push(populatedShift);
		}
		return res.json({ shifts: savedShifts });
	} catch (error) {
		console.error("proposeShiftSave error:", error);
		return res
			.status(500)
			.json({ message: error.message || "Failed to save proposed shift(s)" });
	}
}

module.exports = {
	getAllShifts,
	getMyShifts,
	createShift,
	getShiftById,
	updateShift,
	deleteShift,
	assignShift,
	updateShiftStatus,
	approveShift,
	cancelShift,
	proposeShiftPreview,
	proposeShiftSave,
};
