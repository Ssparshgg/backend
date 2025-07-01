const Shift = require("../models/Shift");
const User = require("../models/User");

async function getAllShifts() {
	try {
		return await Shift.find({ status: { $ne: "rejected" } })
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
	} catch (error) {
		console.error("Error getting all shifts:", error);
		return [];
	}
}

async function getShiftsByUser(userId) {
	try {
		return await Shift.find({ assignedTo: userId })
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
	} catch (error) {
		console.error("Error getting shifts by user:", error);
		return [];
	}
}

async function createShift(data) {
	try {
		const newShift = new Shift(data);
		await newShift.save();
		return await newShift.populate("assignedTo", "username name");
	} catch (error) {
		console.error("Error creating shift:", error);
		throw error;
	}
}

async function getShiftById(id) {
	try {
		return await Shift.findById(id)
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
	} catch (error) {
		console.error("Error getting shift by ID:", error);
		return null;
	}
}

async function updateShift(id, data) {
	try {
		const shift = await Shift.findByIdAndUpdate(
			id,
			{ ...data },
			{ new: true, runValidators: true }
		)
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
		return shift;
	} catch (error) {
		console.error("Error updating shift:", error);
		return null;
	}
}

async function deleteShift(id) {
	try {
		const result = await Shift.findByIdAndDelete(id);
		return !!result;
	} catch (error) {
		console.error("Error deleting shift:", error);
		return false;
	}
}

async function assignShift(id, staffId) {
	try {
		const shift = await Shift.findByIdAndUpdate(
			id,
			{ assignedTo: staffId },
			{ new: true, runValidators: true }
		)
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
		return shift;
	} catch (error) {
		console.error("Error assigning shift:", error);
		return null;
	}
}

async function updateShiftStatus(id, status) {
	try {
		const shift = await Shift.findByIdAndUpdate(
			id,
			{ status },
			{ new: true, runValidators: true }
		)
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
		return shift;
	} catch (error) {
		console.error("Error updating shift status:", error);
		return null;
	}
}

async function getShiftsForManager(managerId) {
	try {
		// Find all staff managed by this manager
		const staff = await User.find({
			managerId: managerId,
			role: "staff",
			isActive: true,
		}).select("_id");
		const staffIds = staff.map((s) => s._id);
		if (staffIds.length === 0) return [];
		// Find all shifts assigned to these staff
		return await Shift.find({
			assignedTo: { $in: staffIds },
			status: { $ne: "rejected" },
		})
			.populate("assignedTo", "username name")
			.populate("createdBy", "username name");
	} catch (error) {
		console.error("Error getting shifts for manager:", error);
		return [];
	}
}

module.exports = {
	getAllShifts,
	getShiftsByUser,
	createShift,
	getShiftById,
	updateShift,
	deleteShift,
	assignShift,
	updateShiftStatus,
	getShiftsForManager,
};
