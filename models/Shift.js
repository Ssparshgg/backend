const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
			required: true,
		},
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		status: {
			type: String,
			enum: [
				"proposed",
				"scheduled",
				"pendingApproval",
				"confirmed",
				"rejected",
				"modified",
				"cancelled",
			],
			default: "proposed",
		},
		role: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Shift", shiftSchema);
