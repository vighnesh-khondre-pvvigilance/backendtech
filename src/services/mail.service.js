const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP email
 */
const sendOtpMail = async (email, otp) => {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified");

    const mailOptions = {
      from: `"PVprotech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px;">
          <h2>PVprotech Login Verification</h2>

          <p>Your One-Time Password (OTP) is:</p>

          <h1 style="color:#16A34A; letter-spacing:4px;">
            ${otp}
          </h1>

          <p>
            This OTP is valid for
            <strong>5 minutes</strong>.
          </p>

          <hr>

          <p style="font-size:12px;color:#666;">
            If you didn't request this OTP, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent successfully to ${email}`);

    return true;
  } catch (error) {
    console.error("❌ Failed to send OTP");
    console.error(error);

    throw new Error("Failed to send OTP email");
  }
};

module.exports = {
  sendOtpMail,
};