const WorkPreference = require("../models/WorkPreference");
const User = require("../models/User");

// Get user preferences
const getUserPreferences = async (req, res) => {
	try {
		const { userId } = req.params;
		const currentUser = req.user;

		// Check if user can access these preferences
		// Users can access their own preferences
		// Managers can access their staff's preferences
		if (currentUser._id.toString() === userId) {
			// User is accessing their own preferences - allow
		} else if (currentUser.role === "manager") {
			// Manager is accessing staff preferences - check if staff belongs to this manager
			const targetUser = await User.findById(userId);
			if (
				!targetUser ||
				targetUser.managerId?.toString() !== currentUser._id.toString()
			) {
				return res.status(403).json({ message: "Access denied" });
			}
		} else {
			// Neither own preferences nor manager accessing staff - deny
			return res.status(403).json({ message: "Access denied" });
		}

		// Find or create preferences for the user
		let workPreference = await WorkPreference.findOne({ userId });

		if (!workPreference) {
			// Create default preferences if none exist
			workPreference = new WorkPreference({
				userId,
				preferences: WorkPreference.getDefaultPreferences(),
				staffRequirements: WorkPreference.getDefaultStaffRequirements(),
			});
			await workPreference.save();
		}

		// Return both preferences and staff requirements
		res.json({
			preferences: workPreference.preferences,
			staffRequirements: workPreference.staffRequirements,
		});
	} catch (error) {
		console.error("Error getting user preferences:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
	try {
		const { userId } = req.params;
		const currentUser = req.user;
		const { preferences, staffRequirements } = req.body;

		// Check if user can update these preferences
		// Users can update their own preferences
		// Managers can update their staff's preferences
		if (currentUser._id.toString() === userId) {
			// User is updating their own preferences - allow
		} else if (currentUser.role === "manager") {
			// Manager is updating staff preferences - check if staff belongs to this manager
			const targetUser = await User.findById(userId);
			if (
				!targetUser ||
				targetUser.managerId?.toString() !== currentUser._id.toString()
			) {
				return res.status(403).json({ message: "Access denied" });
			}
		} else {
			// Neither own preferences nor manager updating staff - deny
			return res.status(403).json({ message: "Access denied" });
		}

		// Validate preferences structure
		const validDays = [
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
			"saturday",
			"sunday",
		];

		if (preferences) {
			for (const day of validDays) {
				if (!Array.isArray(preferences[day])) {
					return res
						.status(400)
						.json({ message: `Invalid preferences format for ${day}` });
				}

				// Validate time slot format for each day
				for (const timeSlot of preferences[day]) {
					if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)) {
						return res.status(400).json({
							message: `Invalid time slot format: ${timeSlot}. Expected format: HH:MM-HH:MM`,
						});
					}
				}
			}
		}

		// Validate staff requirements structure
		if (staffRequirements) {
			for (const day of validDays) {
				if (
					typeof staffRequirements[day] !== "number" ||
					staffRequirements[day] < 0 ||
					staffRequirements[day] > 50
				) {
					return res.status(400).json({
						message: `Invalid staff requirement for ${day}. Must be a number between 0 and 50.`,
					});
				}
			}
		}

		// Find or create work preference document
		let workPreference = await WorkPreference.findOne({ userId });

		if (!workPreference) {
			workPreference = new WorkPreference({ userId });
		}

		// Update preferences and staff requirements
		if (preferences) {
			workPreference.preferences = preferences;
		}
		if (staffRequirements) {
			workPreference.staffRequirements = staffRequirements;
		}

		await workPreference.save();

		// Return updated data
		res.json({
			preferences: workPreference.preferences,
			staffRequirements: workPreference.staffRequirements,
		});
	} catch (error) {
		console.error("Error updating user preferences:", error);
		if (error.name === "ValidationError") {
			return res.status(400).json({ message: error.message });
		}
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get all staff preferences for a manager
const getStaffPreferences = async (req, res) => {
	try {
		const currentUser = req.user;

		if (currentUser.role !== "manager") {
			return res.status(403).json({ message: "Access denied" });
		}

		// Get all staff members for this manager
		const staffMembers = await User.find({
			managerId: currentUser._id,
			role: "staff",
		});

		// Get preferences for all staff members
		const staffPreferences = await WorkPreference.find({
			userId: { $in: staffMembers.map((staff) => staff._id) },
		}).populate("userId", "name email phone");

		// Format the response
		const formattedPreferences = staffPreferences.map((pref) => ({
			userId: pref.userId._id,
			name: pref.userId.name,
			email: pref.userId.email,
			phone: pref.userId.phone,
			preferences: pref.preferences,
			staffRequirements: pref.staffRequirements,
		}));

		res.json(formattedPreferences);
	} catch (error) {
		console.error("Error getting staff preferences:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

module.exports = {
	getUserPreferences,
	updateUserPreferences,
	getStaffPreferences,
};
