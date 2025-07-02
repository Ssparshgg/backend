const express = require("express");
const cors = require("cors");
const https = require("https");
const http = require("http");
const fs = require("fs");
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
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Connect to MongoDB
connectDB();

// Updated CORS configuration
app.use(
	cors({
		origin: [
			"https://staffmanagement-iota.vercel.app",
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

// Check if SSL certificates exist
const certPath = "/etc/letsencrypt/live/sparsh.anshtyagi.me/fullchain.pem";
const keyPath = "/etc/letsencrypt/live/sparsh.anshtyagi.me/privkey.pem";

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
	// HTTPS Server
	const options = {
		key: fs.readFileSync(keyPath),
		cert: fs.readFileSync(certPath),
	};

	https.createServer(options, app).listen(HTTPS_PORT, () => {
		console.log(
			`HTTPS Server running on https://sparsh.anshtyagi.me:${HTTPS_PORT}`
		);
	});

	// HTTP Server - redirect to HTTPS
	http
		.createServer((req, res) => {
			res.writeHead(301, {
				Location:
					"https://" +
					req.headers["host"].replace(`:${PORT}`, `:${HTTPS_PORT}`) +
					req.url,
			});
			res.end();
		})
		.listen(PORT, () => {
			console.log(`HTTP Server running on port ${PORT} - redirecting to HTTPS`);
		});
} else {
	// Fallback to HTTP if certificates don't exist
	app.listen(PORT, () => {
		console.log(
			`HTTP Server running on http://localhost:${PORT} (No SSL certificates found)`
		);
	});
}

//nohup npm start > server.log &
//209.38.41.249
