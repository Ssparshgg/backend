const authService = require("../services/authService");
const userService = require("../services/userService");

const login = async (req, res) => {
	const { username, password } = req.body;

	console.log("Login attempt:", {
		username,
		password: password ? "***" : "undefined",
	});

	try {
		const user = await authService.findUser(username, password);

		console.log(
			"User found:",
			user
				? {
						id: user._id,
						username: user.username,
						role: user.role,
						managerId: user.managerId,
						managedStaff: user.managedStaff,
				  }
				: "null"
		);

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const token = authService.generateToken(user);
		console.log("Generated token for user:", {
			username: user.username,
			role: user.role,
		});

		res.json({
			_id: user._id,
			username: user.username,
			name: user.name,
			email: user.email,
			phone: user.phone,
			role: user.role,
			token: token,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

const logout = (req, res) => {
	// In real app, handle token blacklist or client-side token removal
	res.json({ message: "Logged out" });
};

const register = async (req, res) => {
	try {
		const user = await userService.createUser(req.body);
		const token = authService.generateToken(user);
		res.status(201).json({
			...user,
			token: token,
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(400).json({ message: error.message });
	}
};

const me = async (req, res) => {
	const token = req.headers.authorization?.replace("Bearer ", "");
	if (!token) {
		return res.status(401).json({ message: "No token provided" });
	}

	try {
		const user = await authService.getUserFromToken(token);
		if (!user) {
			return res.status(401).json({ message: "Invalid token" });
		}

		res.json(user);
	} catch (error) {
		console.error("Me error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

module.exports = { login, logout, register, me };
