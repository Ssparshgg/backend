const {
	generateSchedule,
	validateGeneratedSchedule,
} = require("../services/geminiService");
const WorkPreference = require("../models/WorkPreference");
const Shift = require("../models/Shift");
const User = require("../models/User");

/**
 * Generate AI-powered schedule
 * POST /api/ai-schedule/generate
 */
const generateAISchedule = async (req, res) => {
	try {
		const { startDate, endDate, managerId } = req.body;
		const currentUser = req.user;

		// Validate input
		if (!startDate || !endDate) {
			return res.status(400).json({
				success: false,
				message: "Start date and end date are required",
			});
		}

		// Check if user is a manager
		if (currentUser.role !== "manager") {
			return res.status(403).json({
				success: false,
				message: "Only managers can generate AI schedules",
			});
		}

		// Use provided managerId or current user's ID
		const targetManagerId = managerId || currentUser._id;

		// Get manager's work preferences
		const managerPreferences = await WorkPreference.findOne({
			userId: targetManagerId,
		});
		if (!managerPreferences) {
			return res.status(404).json({
				success: false,
				message: "Manager work preferences not found",
			});
		}

		// Get all staff under this manager
		const staffMembers = await User.find({
			managerId: targetManagerId,
			role: "staff",
		});

		if (staffMembers.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No staff members found under this manager",
			});
		}

		// Get work preferences for all staff members
		const staffPreferences = await WorkPreference.find({
			userId: { $in: staffMembers.map((staff) => staff._id) },
		});

		// Format staff preferences for AI
		const formattedStaffPreferences = staffPreferences.map((pref) => ({
			userId: pref.userId.toString(),
			preferences: pref.preferences,
			name:
				staffMembers.find(
					(staff) => staff._id.toString() === pref.userId.toString()
				)?.name || "Unknown",
		}));

		// Generate schedule using Gemini AI
		const generatedSchedule = await generateSchedule(
			managerPreferences,
			formattedStaffPreferences,
			new Date(startDate),
			new Date(endDate)
		);

		// Validate the generated schedule
		const validation = validateGeneratedSchedule(
			generatedSchedule,
			managerPreferences,
			formattedStaffPreferences
		);

		if (!validation.isValid) {
			return res.status(400).json({
				success: false,
				message: "Generated schedule validation failed",
				errors: validation.errors,
				warnings: validation.warnings,
			});
		}

		// Save the generated shifts to database
		const savedShifts = [];
		for (const shiftData of generatedSchedule.shifts) {
			const shift = new Shift({
				title: shiftData.title,
				startTime: new Date(shiftData.startTime),
				endTime: new Date(shiftData.endTime),
				assignedTo: shiftData.assignedTo,
				role: shiftData.role,
				description: shiftData.description || "",
				status: "scheduled",
				createdBy: currentUser._id,
			});

			const savedShift = await shift.save();
			savedShifts.push(savedShift);
		}

		res.status(200).json({
			success: true,
			message: "AI schedule generated successfully",
			data: {
				shifts: savedShifts,
				summary: generatedSchedule.summary,
				validation: {
					warnings: validation.warnings,
				},
			},
		});
	} catch (error) {
		console.error("Error generating AI schedule:", error);
		res.status(500).json({
			success: false,
			message: "Failed to generate AI schedule",
			error: error.message,
		});
	}
};

/**
 * Preview AI schedule without saving
 * POST /api/ai-schedule/preview
 */
const previewAISchedule = async (req, res) => {
	try {
		const { startDate, endDate, managerId } = req.body;
		const currentUser = req.user;

		// Validate input
		if (!startDate || !endDate) {
			return res.status(400).json({
				success: false,
				message: "Start date and end date are required",
			});
		}

		// Check if user is a manager
		if (currentUser.role !== "manager") {
			return res.status(403).json({
				success: false,
				message: "Only managers can preview AI schedules",
			});
		}

		// Use provided managerId or current user's ID
		const targetManagerId = managerId || currentUser._id;

		// Get manager's work preferences
		const managerPreferences = await WorkPreference.findOne({
			userId: targetManagerId,
		});
		if (!managerPreferences) {
			return res.status(404).json({
				success: false,
				message: "Manager work preferences not found",
			});
		}

		// Get all staff under this manager
		const staffMembers = await User.find({
			managerId: targetManagerId,
			role: "staff",
		});

		if (staffMembers.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No staff members found under this manager",
			});
		}

		// Get work preferences for all staff members
		const staffPreferences = await WorkPreference.find({
			userId: { $in: staffMembers.map((staff) => staff._id) },
		});

		// Format staff preferences for AI
		const formattedStaffPreferences = staffPreferences.map((pref) => ({
			userId: pref.userId.toString(),
			preferences: pref.preferences,
			name:
				staffMembers.find(
					(staff) => staff._id.toString() === pref.userId.toString()
				)?.name || "Unknown",
		}));

		// Generate schedule using Gemini AI
		const generatedSchedule = await generateSchedule(
			managerPreferences,
			formattedStaffPreferences,
			new Date(startDate),
			new Date(endDate)
		);

		// Validate the generated schedule
		const validation = validateGeneratedSchedule(
			generatedSchedule,
			managerPreferences,
			formattedStaffPreferences
		);

		res.status(200).json({
			success: true,
			message: "AI schedule preview generated",
			data: {
				shifts: generatedSchedule.shifts,
				summary: generatedSchedule.summary,
				validation: {
					isValid: validation.isValid,
					errors: validation.errors,
					warnings: validation.warnings,
				},
			},
		});
	} catch (error) {
		console.error("Error previewing AI schedule:", error);
		res.status(500).json({
			success: false,
			message: "Failed to preview AI schedule",
			error: error.message,
		});
	}
};

/**
 * Get AI schedule generation statistics
 * GET /api/ai-schedule/stats
 */
const getAIScheduleStats = async (req, res) => {
	try {
		const currentUser = req.user;
		const { managerId } = req.query;

		// Check if user is a manager
		if (currentUser.role !== "manager") {
			return res.status(403).json({
				success: false,
				message: "Only managers can view AI schedule stats",
			});
		}

		// Use provided managerId or current user's ID
		const targetManagerId = managerId || currentUser._id;

		// Get manager's work preferences
		const managerPreferences = await WorkPreference.findOne({
			userId: targetManagerId,
		});
		if (!managerPreferences) {
			return res.status(404).json({
				success: false,
				message: "Manager work preferences not found",
			});
		}

		// Get staff count
		const staffCount = await User.countDocuments({
			managerId: targetManagerId,
			role: "staff",
		});

		// Get existing shifts count
		const existingShiftsCount = await Shift.countDocuments({
			createdBy: targetManagerId,
		});

		res.status(200).json({
			success: true,
			data: {
				managerPreferences: {
					staffRequirements: managerPreferences.staffRequirements,
					hasPreferences: Object.values(managerPreferences.preferences).some(
						(day) => day.length > 0
					),
				},
				staffCount,
				existingShiftsCount,
				canGenerate: staffCount > 0,
			},
		});
	} catch (error) {
		console.error("Error getting AI schedule stats:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get AI schedule stats",
			error: error.message,
		});
	}
};

/**
 * Save preview schedule data directly
 * POST /api/ai-schedule/save-preview
 */
const savePreviewSchedule = async (req, res) => {
	try {
		const { shifts, summary } = req.body;
		const currentUser = req.user;

		// Check if user is a manager
		if (currentUser.role !== "manager") {
			return res.status(403).json({
				success: false,
				message: "Only managers can save AI schedules",
			});
		}

		// Validate input
		if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Invalid shifts data provided",
			});
		}

		// Save the shifts to database
		const savedShifts = [];
		for (const shiftData of shifts) {
			const shift = new Shift({
				title: shiftData.title,
				startTime: new Date(shiftData.startTime),
				endTime: new Date(shiftData.endTime),
				assignedTo: shiftData.assignedTo,
				role: shiftData.role,
				description: shiftData.description || "",
				status: "scheduled",
				createdBy: currentUser._id,
			});

			const savedShift = await shift.save();
			savedShifts.push(savedShift);
		}

		res.status(200).json({
			success: true,
			message: "Preview schedule saved successfully",
			data: {
				shifts: savedShifts,
				summary: summary,
			},
		});
	} catch (error) {
		console.error("Error saving preview schedule:", error);
		res.status(500).json({
			success: false,
			message: "Failed to save preview schedule",
			error: error.message,
		});
	}
};

module.exports = {
	generateAISchedule,
	previewAISchedule,
	getAIScheduleStats,
	savePreviewSchedule,
};
