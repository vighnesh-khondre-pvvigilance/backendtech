const {
  registerOrLogin,
  verifyOtp,
} = require("../services/auth.service");

/**
 * Register new user or login existing user
 * POST /auth/register-login
 */
const registerOrLoginController = async (req, res) => {
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
const verifyOtpController = async (req, res) => {
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

module.exports = {
  registerOrLoginController,
  verifyOtpController,
};