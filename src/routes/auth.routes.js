import express from 'express'

import { registerOrLoginController,
  verifyOtpController,
  getProfileController } from '../controllers/auth.controller.js'

const router = express.Router();

router.post("/register-login", registerOrLoginController);

router.post("/verify-otp", verifyOtpController);

router.get(
  "/profile/:freeTechId",
 getProfileController
);

export default router;