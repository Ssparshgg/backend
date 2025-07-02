const { GoogleGenAI, Type } = require("@google/genai");

// Initialize Gemini AI
const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY,
});

// Schema for the schedule generation response
const scheduleResponseSchema = {
	type: Type.OBJECT,
	properties: {
		shifts: {
			type: Type.ARRAY,
			items: {
				type: Type.OBJECT,
				properties: {
					title: {
						type: Type.STRING,
						description: "Shift title/description",
					},
					startTime: {
						type: Type.STRING,
						description: "Start time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
					},
					endTime: {
						type: Type.STRING,
						description: "End time in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
					},
					assignedTo: {
						type: Type.STRING,
						description: "User ID of the assigned staff member",
					},
					role: {
						type: Type.STRING,
						description: "Role for this shift",
					},
					description: {
						type: Type.STRING,
						description: "Additional description for the shift",
					},
				},
				required: ["title", "startTime", "endTime", "assignedTo", "role"],
				propertyOrdering: [
					"title",
					"startTime",
					"endTime",
					"assignedTo",
					"role",
					"description",
				],
			},
		},
		summary: {
			type: Type.OBJECT,
			properties: {
				totalShifts: {
					type: Type.INTEGER,
					description: "Total number of shifts generated",
				},
				coverage: {
					type: Type.OBJECT,
					properties: {
						monday: { type: Type.INTEGER },
						tuesday: { type: Type.INTEGER },
						wednesday: { type: Type.INTEGER },
						thursday: { type: Type.INTEGER },
						friday: { type: Type.INTEGER },
						saturday: { type: Type.INTEGER },
						sunday: { type: Type.INTEGER },
					},
					propertyOrdering: [
						"monday",
						"tuesday",
						"wednesday",
						"thursday",
						"friday",
						"saturday",
						"sunday",
					],
				},
				notes: {
					type: Type.STRING,
					description: "Any notes about the schedule generation",
				},
			},
			required: ["totalShifts", "coverage"],
			propertyOrdering: ["totalShifts", "coverage", "notes"],
		},
	},
	required: ["shifts", "summary"],
	propertyOrdering: ["shifts", "summary"],
};

/**
 * Generate schedule using Gemini AI
 * @param {Object} managerPreferences - Manager's work preferences and staff requirements
 * @param {Array} staffPreferences - Array of staff work preferences
 * @param {Date} startDate - Start date for the schedule
 * @param {Date} endDate - End date for the schedule
 * @returns {Object} Generated schedule with shifts and summary
 */
async function generateSchedule(
	managerPreferences,
	staffPreferences,
	startDate,
	endDate
) {
	try {
		// Format the data for Gemini
		const prompt = createSchedulePrompt(
			managerPreferences,
			staffPreferences,
			startDate,
			endDate
		);

		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
			config: {
				responseMimeType: "application/json",
				responseSchema: scheduleResponseSchema,
			},
		});

		const result = JSON.parse(response.text);

		// Validate the response
		if (!result.shifts || !Array.isArray(result.shifts)) {
			throw new Error("Invalid response format from Gemini");
		}

		return result;
	} catch (error) {
		console.error("Error generating schedule with Gemini:", error);
		throw new Error(`Failed to generate schedule: ${error.message}`);
	}
}

/**
 * Create a detailed prompt for Gemini to generate the schedule
 */
function createSchedulePrompt(
	managerPreferences,
	staffPreferences,
	startDate,
	endDate
) {
	const startDateStr = startDate.toISOString().split("T")[0];
	const endDateStr = endDate.toISOString().split("T")[0];

	// Extract manager's available time slots for each day
	const managerTimeSlots = managerPreferences.preferences;
	const managerTimeInstructions = Object.entries(managerTimeSlots)
		.map(([day, slots]) => {
			if (slots.length === 0)
				return `${day.charAt(0).toUpperCase() + day.slice(1)}: Not available`;
			return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${slots.join(
				", "
			)}`;
		})
		.join("\n");

	return `You are an expert scheduling assistant. Generate an optimal work schedule for the following requirements:

SCHEDULE PERIOD: ${startDateStr} to ${endDateStr}
ALL TIMES ARE IN UTC+2 (Central European Time).

MANAGER REQUIREMENTS:
${JSON.stringify(managerPreferences, null, 2)}

MANAGER AVAILABLE TIME SLOTS (STRICT):
${managerTimeInstructions}

STAFF PREFERENCES:
${JSON.stringify(staffPreferences, null, 2)}

INSTRUCTIONS:
1. Create shifts that satisfy the manager's staff requirements for each day
2. Assign staff members based on their availability preferences
3. Ensure fair distribution of work hours among staff
4. Respect staff's preferred time slots when possible
5. Generate shifts that cover the required hours for each day
6. Use realistic shift durations (typically 4-8 hours)
7. Ensure proper coverage for all required time slots
8. DO NOT generate any shift that starts before or ends after the manager's available time slot for that day. All shifts must be fully contained within the manager's available time for that day (see above). For example, if the manager's available time is 09:00-17:00, no shift should start before 09:00 or end after 17:00.

CONSTRAINTS:
- Each shift must have a unique title
- Start and end times must be in ISO format
- Assigned staff must be available during the shift time
- Respect the required number of staff per day
- Avoid scheduling conflicts for individual staff members

Generate a schedule that optimizes coverage while respecting staff preferences and strictly adheres to the manager's available time slots for each day.`;
}

/**
 * Validate and process the generated schedule before saving
 */
function validateGeneratedSchedule(
	schedule,
	managerPreferences,
	staffPreferences
) {
	const validation = {
		isValid: true,
		errors: [],
		warnings: [],
	};

	if (!schedule.shifts || !Array.isArray(schedule.shifts)) {
		validation.isValid = false;
		validation.errors.push("Invalid schedule format: missing shifts array");
		return validation;
	}

	// Validate each shift
	schedule.shifts.forEach((shift, index) => {
		// Check required fields
		if (
			!shift.title ||
			!shift.startTime ||
			!shift.endTime ||
			!shift.assignedTo ||
			!shift.role
		) {
			validation.errors.push(`Shift ${index + 1}: Missing required fields`);
		}

		// Validate date format
		try {
			new Date(shift.startTime);
			new Date(shift.endTime);
		} catch (error) {
			validation.errors.push(`Shift ${index + 1}: Invalid date format`);
		}

		// Check if assigned staff exists in preferences
		const staffExists = staffPreferences.some(
			(staff) => staff.userId === shift.assignedTo
		);
		if (!staffExists) {
			validation.warnings.push(
				`Shift ${index + 1}: Assigned staff not found in preferences`
			);
		}
	});

	validation.isValid = validation.errors.length === 0;
	return validation;
}

/**
 * Parse a natural language shift proposal using Gemini
 * @param {string} naturalLanguage - e.g. "I will work on Thursday 4-5pm"
 * @param {string} userId - The staff user ID
 * @returns {Array} Parsed shift objects: [{ title, startTime, endTime, assignedTo, role, description }]
 */
async function parseShiftProposal(naturalLanguage, userId) {
	const today = new Date();
	const prompt = `You are an expert scheduling assistant. A staff member wants to propose one or more shifts using natural language.\n\nInput: "${naturalLanguage}"\n\nToday is ${
		today.toISOString().split("T")[0]
	} (ISO format, YYYY-MM-DD).\nALL TIMES ARE IN UTC+2 (Central European Time).\n\nParse the input and return a JSON array of shift objects. Each shift object should have:\n- title: string (e.g. "Proposed Shift")\n- startTime: ISO 8601 datetime string (YYYY-MM-DDTHH:mm:ss.sssZ) for the next occurrence of the requested day/time\n- endTime: ISO 8601 datetime string (YYYY-MM-DDTHH:mm:ss.sssZ)\n- assignedTo: the provided userId\n- role: always "staff"\n- description: a short description\n\nIf the input contains multiple days or times, return one shift object for each. If ambiguous, make a reasonable guess. Always return a valid JSON array.`;

	const response = await ai.models.generateContent({
		model: "gemini-2.5-pro",
		contents: prompt,
		config: {
			responseMimeType: "application/json",
		},
	});

	let result;
	try {
		result = JSON.parse(response.text);
	} catch (e) {
		throw new Error("Failed to parse Gemini response as JSON");
	}
	if (!Array.isArray(result) || result.length === 0) {
		throw new Error("Gemini did not return any valid shifts");
	}
	// Ensure all shifts have assignedTo and role
	result = result.map((shift) => ({
		...shift,
		assignedTo: userId,
		role: "staff",
	}));
	return result;
}

module.exports = {
	generateSchedule,
	validateGeneratedSchedule,
	parseShiftProposal,
};
