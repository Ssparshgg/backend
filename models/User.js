const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		role: {
			type: String,
			enum: ["manager", "staff"],
			required: true,
		},
		phone: {
			type: String,
			trim: true,
		},
		// Manager-staff relationship
		managerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
			// Only required for staff users
			required: function () {
				return this.role === "staff";
			},
		},
		// For managers: list of staff they manage
		managedStaff: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

// Virtual for getting staff count (for managers)
userSchema.virtual("staffCount").get(function () {
	return this.managedStaff ? this.managedStaff.length : 0;
});

// Ensure virtuals are serialized
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
