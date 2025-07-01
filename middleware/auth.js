const authService = require("../services/authService");

const authenticateToken = async (req, res, next) => {
	const token = req.headers.authorization?.replace("Bearer ", "");

	if (!token) {
		return res.status(401).json({ message: "Access token required" });
	}

	try {
		const user = await authService.getUserFromToken(token);
		if (!user) {
			return res.status(403).json({ message: "Invalid or expired token" });
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Authentication error:", error);
		return res.status(403).json({ message: "Invalid or expired token" });
	}
};

const requireRole = (roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		console.log("User role check:", {
			userId: req.user._id,
			userRole: req.user.role,
			requiredRoles: roles,
			hasPermission: roles.includes(req.user.role),
		});

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ message: "Insufficient permissions" });
		}

		next();
	};
};

module.exports = {
	authenticateToken,
	requireRole,
};
