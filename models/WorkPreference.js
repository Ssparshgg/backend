const mongoose = require("mongoose");

const workPreferenceSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		preferences: {
			monday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
			tuesday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
			wednesday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
			thursday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
			friday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
			saturday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
			sunday: {
				type: [String],
				default: [],
				validate: {
					validator: function (v) {
						return v.every((timeSlot) =>
							/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)
						);
					},
					message: "Time slots must be in format HH:MM-HH:MM",
				},
			},
		},
		staffRequirements: {
			monday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
			tuesday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
			wednesday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
			thursday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
			friday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
			saturday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
			sunday: {
				type: Number,
				default: 0,
				min: 0,
				max: 50,
			},
		},
		notes: {
			type: String,
			trim: true,
			maxlength: 500,
		},
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
workPreferenceSchema.index({ userId: 1 });

// Method to get default preferences
workPreferenceSchema.statics.getDefaultPreferences = function () {
	return {
		monday: [],
		tuesday: [],
		wednesday: [],
		thursday: [],
		friday: [],
		saturday: [],
		sunday: [],
	};
};

// Method to get default staff requirements
workPreferenceSchema.statics.getDefaultStaffRequirements = function () {
	return {
		monday: 0,
		tuesday: 0,
		wednesday: 0,
		thursday: 0,
		friday: 0,
		saturday: 0,
		sunday: 0,
	};
};

// Method to validate time slot format
workPreferenceSchema.methods.validateTimeSlot = function (timeSlot) {
	return /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot);
};

module.exports = mongoose.model("WorkPreference", workPreferenceSchema);
