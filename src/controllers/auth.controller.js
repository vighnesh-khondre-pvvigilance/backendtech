import { registerOrLogin, verifyOtp, getProfile } from "../services/auth.service.js";

/**
 * Register new user or login existing user
 * POST /auth/register-login
 */
export const registerOrLoginController = async (req, res) => {
  try {
    const result = await registerOrLogin(req.body);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Register/Login Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Verify OTP
 * POST /auth/verify-otp
 */
export const verifyOtpController = async (req, res) => {
  try {
    const result = await verifyOtp(req.body);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Verify OTP Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getProfileController = async (req, res) => {
  try {
    const { freeTechId } = req.params;

    const result = await getProfile(freeTechId);

    res.status(result.success ? 200 : 404).json(result);
 } catch (err) {
  console.error("Get Profile Controller Error:", err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
}
};

