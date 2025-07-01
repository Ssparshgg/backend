const userService = require("../services/userService");

const getProfile = async (req, res) => {
	// User is already authenticated and available in req.user
	try {
		const user = await userService.getUserById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const updateProfile = async (req, res) => {
	// User is already authenticated and available in req.user
	try {
		const user = await userService.updateUser(req.user._id, req.body);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json(user);
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(400).json({ message: error.message });
	}
};

module.exports = {
	getProfile,
	updateProfile,
};
