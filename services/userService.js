const User = require("../models/User");

async function getAllUsers() {
	try {
		return await User.find({ isActive: true })
			.select("-password")
			.populate("managerId", "username name")
			.populate("managedStaff", "username name role");
	} catch (error) {
		console.error("Error getting all users:", error);
		return [];
	}
}

async function createUser(data) {
	try {
		const newUser = new User(data);
		await newUser.save();

		// If this is a staff user with a manager, update the manager's managedStaff array
		if (data.role === "staff" && data.managerId) {
			await User.findByIdAndUpdate(data.managerId, {
				$addToSet: { managedStaff: newUser._id },
			});
		}

		const userWithoutPassword = newUser.toObject();
		delete userWithoutPassword.password;
		return userWithoutPassword;
	} catch (error) {
		console.error("Error creating user:", error);
		throw error;
	}
}

async function getUserById(id) {
	try {
		return await User.findById(id)
			.select("-password")
			.populate("managerId", "username name")
			.populate("managedStaff", "username name role");
	} catch (error) {
		console.error("Error getting user by ID:", error);
		return null;
	}
}

async function updateUser(id, data) {
	try {
		const user = await User.findByIdAndUpdate(
			id,
			{ ...data },
			{ new: true, runValidators: true }
		)
			.select("-password")
			.populate("managerId", "username name")
			.populate("managedStaff", "username name role");

		// Handle manager assignment changes
		if (data.managerId !== undefined) {
			await updateManagerStaffRelationship(id, data.managerId);
		}

		return user;
	} catch (error) {
		console.error("Error updating user:", error);
		return null;
	}
}

async function deleteUser(id) {
	try {
		const user = await User.findById(id);
		if (!user) return false;

		// Remove from manager's managedStaff array
		if (user.managerId) {
			await User.findByIdAndUpdate(user.managerId, {
				$pull: { managedStaff: user._id },
			});
		}

		// If it's a manager, reassign their staff to null or another manager
		if (user.role === "manager" && user.managedStaff.length > 0) {
			await User.updateMany(
				{ _id: { $in: user.managedStaff } },
				{ managerId: null }
			);
		}

		// Soft delete
		const result = await User.findByIdAndUpdate(
			id,
			{ isActive: false },
			{ new: true }
		);
		return !!result;
	} catch (error) {
		console.error("Error deleting user:", error);
		return false;
	}
}

// New methods for manager-staff relationships
async function getManagers() {
	try {
		return await User.find({ role: "manager", isActive: true })
			.select("-password")
			.populate("managedStaff", "username name role");
	} catch (error) {
		console.error("Error getting managers:", error);
		return [];
	}
}

async function getStaffByManager(managerId) {
	try {
		// Validate managerId
		if (!managerId || managerId === "undefined" || managerId === "null") {
			console.log("Invalid managerId provided:", managerId);
			return [];
		}

		return await User.find({
			managerId: managerId,
			role: "staff",
			isActive: true,
		})
			.select("-password")
			.populate("managerId", "username name");
	} catch (error) {
		console.error("Error getting staff by manager:", error);
		return [];
	}
}

async function assignStaffToManager(staffId, managerId) {
	try {
		const staff = await User.findById(staffId);
		if (!staff || staff.role !== "staff") {
			throw new Error("Invalid staff user");
		}

		const manager = await User.findById(managerId);
		if (!manager || manager.role !== "manager") {
			throw new Error("Invalid manager user");
		}

		// Remove from previous manager's managedStaff array
		if (staff.managerId) {
			await User.findByIdAndUpdate(staff.managerId, {
				$pull: { managedStaff: staff._id },
			});
		}

		// Update staff's manager
		await User.findByIdAndUpdate(staffId, { managerId: managerId });

		// Add to new manager's managedStaff array
		await User.findByIdAndUpdate(managerId, {
			$addToSet: { managedStaff: staff._id },
		});

		return await getUserById(staffId);
	} catch (error) {
		console.error("Error assigning staff to manager:", error);
		throw error;
	}
}

async function removeStaffFromManager(staffId) {
	try {
		const staff = await User.findById(staffId);
		if (!staff || staff.role !== "staff") {
			throw new Error("Invalid staff user");
		}

		// Remove from manager's managedStaff array
		if (staff.managerId) {
			await User.findByIdAndUpdate(staff.managerId, {
				$pull: { managedStaff: staff._id },
			});
		}

		// Remove manager assignment
		await User.findByIdAndUpdate(staffId, { managerId: null });

		return await getUserById(staffId);
	} catch (error) {
		console.error("Error removing staff from manager:", error);
		throw error;
	}
}

async function updateManagerStaffRelationship(staffId, newManagerId) {
	try {
		const staff = await User.findById(staffId);
		if (!staff || staff.role !== "staff") return;

		// Remove from old manager's managedStaff array
		if (staff.managerId && staff.managerId.toString() !== newManagerId) {
			await User.findByIdAndUpdate(staff.managerId, {
				$pull: { managedStaff: staff._id },
			});
		}

		// Add to new manager's managedStaff array
		if (newManagerId) {
			await User.findByIdAndUpdate(newManagerId, {
				$addToSet: { managedStaff: staff._id },
			});
		}
	} catch (error) {
		console.error("Error updating manager-staff relationship:", error);
	}
}

module.exports = {
	getAllUsers,
	createUser,
	getUserById,
	updateUser,
	deleteUser,
	getManagers,
	getStaffByManager,
	assignStaffToManager,
	removeStaffFromManager,
	updateManagerStaffRelationship,
};
