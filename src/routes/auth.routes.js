const express = require("express");

const {
  registerOrLoginController,
  verifyOtpController,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register-login", registerOrLoginController);

router.post("/verify-otp", verifyOtpController);

module.exports = router;