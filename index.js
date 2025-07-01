const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });
const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const profileRoutes = require("./routes/profileRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const aiScheduleRoutes = require("./routes/aiScheduleRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Updated CORS configuration to allow your Netlify domain
app.use(
	cors({
		origin: [
			"https://staffmanagement-iota.vercel.app/",
			"http://localhost:8080",
			"http://localhost:3000",
		],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/ai-schedule", aiScheduleRoutes);
app.use("/api/ai-shift", shiftRoutes);

app.get("/api/hello", (req, res) => {
	res.json({ message: "Hello from Express backend!" });
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

//nohup npm start > server.log &

//209.38.41.249
