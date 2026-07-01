const express = require("express");

const {
  registerOrLoginController,
  verifyOtpController,
  getProfileController
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register-login", registerOrLoginController);

router.post("/verify-otp", verifyOtpController);

router.get(
  "/profile/:freeTechId",
 getProfileController
);

module.exports = router;