const mongoose = require("mongoose");
const User = require("../models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config.env") });

const seedUsers = async () => {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB");

		// Clear existing users
		await User.deleteMany({});
		console.log("Cleared existing users");

		// Create managers first
		const manager1 = new User({
			username: "manager1",
			password: "managerpass",
			name: "John Manager",
			email: "manager@example.com",
			role: "manager",
			phone: "+1-555-0101",
			managedStaff: [],
		});

		const manager2 = new User({
			username: "manager2",
			password: "managerpass",
			name: "Sarah Supervisor",
			email: "sarah@example.com",
			role: "manager",
			phone: "+1-555-0104",
			managedStaff: [],
		});

		await manager1.save();
		await manager2.save();
		console.log("Created managers");

		// Create staff with updated manager assignments
		const staff1 = new User({
			username: "staff1",
			password: "staffpass",
			name: "Jane Staff",
			email: "staff@example.com",
			role: "staff",
			phone: "+1-555-0102",
			managerId: manager1._id,
		});

		const staff2 = new User({
			username: "staff2",
			password: "staffpass",
			name: "Mike Worker",
			email: "mike@example.com",
			role: "staff",
			phone: "+1-555-0103",
			managerId: manager2._id,
		});

		const staff3 = new User({
			username: "staff3",
			password: "staffpass",
			name: "Emily Assistant",
			email: "emily@example.com",
			role: "staff",
			phone: "+1-555-0105",
			managerId: manager1._id,
		});

		await staff1.save();
		await staff2.save();
		await staff3.save();
		console.log("Created staff members");

		// Update managers' managedStaff arrays with new assignments
		await User.findByIdAndUpdate(manager1._id, {
			managedStaff: [staff1._id, staff3._id],
		});

		await User.findByIdAndUpdate(manager2._id, { managedStaff: [staff2._id] });

		console.log("Updated manager-staff relationships");

		// Fetch and display all users with relationships
		const allUsers = await User.find()
			.populate("managerId", "username name")
			.populate("managedStaff", "username name");

		console.log("\nCreated users with relationships:");
		allUsers.forEach((user) => {
			if (user.role === "manager") {
				console.log(`Manager: ${user.username} (${user.name})`);
				console.log(
					`  Managed Staff: ${
						user.managedStaff.map((s) => s.username).join(", ") || "None"
					}`
				);
			} else {
				console.log(`Staff: ${user.username} (${user.name})`);
				console.log(
					`  Manager: ${user.managerId ? user.managerId.username : "None"}`
				);
			}
		});

		console.log("\nDatabase seeded successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error);
		process.exit(1);
	}
};

seedUsers();
