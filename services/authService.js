const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function findUser(username, password) {
	try {
		console.log("Looking for user:", username);
		const user = await User.findOne({ username, isActive: true });

		if (!user) {
			console.log("User not found");
			return null;
		}

		// For now, compare plain text passwords (in production, use bcrypt)
		const isValidPassword = user.password === password;
		// const isValidPassword = await bcrypt.compare(password, user.password);

		console.log("Password validation:", isValidPassword);

		return isValidPassword ? user : null;
	} catch (error) {
		console.error("Error finding user:", error);
		return null;
	}
}

function generateToken(user) {
	return jwt.sign(
		{
			id: user._id,
			username: user.username,
			role: user.role,
		},
		JWT_SECRET,
		{ expiresIn: "24h" }
	);
}

function verifyToken(token) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		return null;
	}
}

async function getUserFromToken(token) {
	const decoded = verifyToken(token);
	if (!decoded) return null;

	try {
		return await User.findById(decoded.id).select("-password");
	} catch (error) {
		console.error("Error getting user from token:", error);
		return null;
	}
}

module.exports = {
	findUser,
	generateToken,
	verifyToken,
	getUserFromToken,
};
