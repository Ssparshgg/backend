const userService = require("../services/userService");

const getAllUsers = async (req, res) => {
	try {
		console.log("getAllUsers called by user:", {
			id: req.user._id,
			username: req.user.username,
			role: req.user.role,
		});

		const users = await userService.getAllUsers();
		console.log("Retrieved users count:", users.length);
		res.json(users);
	} catch (error) {
		console.error("Get all users error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const getManagers = async (req, res) => {
	try {
		const managers = await userService.getManagers();
		res.json(managers);
	} catch (error) {
		console.error("Get managers error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const getStaffByManager = async (req, res) => {
	try {
		const { managerId } = req.params;

		// Validate managerId
		if (!managerId || managerId === "undefined" || managerId === "null") {
			console.log("Invalid managerId in request:", managerId);
			return res.json([]);
		}

		const staff = await userService.getStaffByManager(managerId);
		res.json(staff);
	} catch (error) {
		console.error("Get staff by manager error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const createUser = async (req, res) => {
	try {
		const user = await userService.createUser(req.body);
		res.status(201).json(user);
	} catch (error) {
		console.error("Create user error:", error);
		res.status(400).json({ message: error.message });
	}
};

const getUserById = async (req, res) => {
	try {
		const user = await userService.getUserById(req.params.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (error) {
		console.error("Get user by ID error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const updateUser = async (req, res) => {
	try {
		const user = await userService.updateUser(req.params.id, req.body);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (error) {
		console.error("Update user error:", error);
		res.status(400).json({ message: error.message });
	}
};

const deleteUser = async (req, res) => {
	try {
		const success = await userService.deleteUser(req.params.id);
		if (!success) return res.status(404).json({ message: "User not found" });
		res.json({ message: "User deleted" });
	} catch (error) {
		console.error("Delete user error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const assignStaffToManager = async (req, res) => {
	try {
		// Handle both POST and PUT requests
		const staffId = req.params.staffId || req.body.staffId;
		const managerId = req.body.managerId;

		if (!staffId || !managerId) {
			return res
				.status(400)
				.json({ message: "Staff ID and Manager ID are required" });
		}

		const user = await userService.assignStaffToManager(staffId, managerId);
		res.json(user);
	} catch (error) {
		console.error("Assign staff to manager error:", error);
		res.status(400).json({ message: error.message });
	}
};

const removeStaffFromManager = async (req, res) => {
	try {
		const { staffId } = req.params;
		const user = await userService.removeStaffFromManager(staffId);
		res.json(user);
	} catch (error) {
		console.error("Remove staff from manager error:", error);
		res.status(400).json({ message: error.message });
	}
};

module.exports = {
	getAllUsers,
	getManagers,
	getStaffByManager,
	createUser,
	getUserById,
	updateUser,
	deleteUser,
	assignStaffToManager,
	removeStaffFromManager,
};
