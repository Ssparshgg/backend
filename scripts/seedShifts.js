const mongoose = require("mongoose");
const Shift = require("../models/Shift");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../config.env") });

const seedShifts = async () => {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("Connected to MongoDB");

		// Clear existing shifts
		await Shift.deleteMany({});
		console.log("Cleared all shifts");

		console.log("\nAll shifts deleted successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Error deleting shifts:", error);
		process.exit(1);
	}
};

seedShifts();
