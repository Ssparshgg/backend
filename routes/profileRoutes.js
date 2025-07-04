const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, profileController.getProfile);
router.put("/", authenticateToken, profileController.updateProfile);

module.exports = router;
