const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const {
  PutCommand,
  UpdateCommand,
  QueryCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddbDocClient = require("../config/dynamodb");
const { generateOTP } = require("../utils/otp");
const { generateToken } = require("../utils/jwt");
const { sendOtpMail } = require("./mail.service");

dotenv.config();

const TABLE_NAME = process.env.FREE_USER_TABLE;

/**
 * Get user by email using GSI
 */
const getUserByEmail = async (email) => {
  const response = await ddbDocClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    })
  );

  return response.Items?.[0] || null;
};

/**
 * Register new user OR login existing user
 */
const registerOrLogin = async ({ name, contact, email }) => {
  try {
    if (!email) {
      return {
        success: false,
        message: "Email is required",
      };
    }

    const existingUser = await getUserByEmail(email);

    // Existing & Verified User
    if (existingUser && existingUser.isVerified) {
      const token = generateToken(existingUser);

      return {
        success: true,
        login: true,
        token,
        user: {
          clientId: existingUser.clientId,
          name: existingUser.name,
          contact: existingUser.contact,
          email: existingUser.email,
          isVerified: true,
        },
      };
    }

    // Existing but Not Verified
    if (existingUser) {
      const otp = generateOTP();
      const otpExpiry = Date.now() + 5 * 60 * 1000;

      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            clientId: existingUser.clientId,
          },
          UpdateExpression:
            "SET otp = :otp, otpExpiry = :expiry",
          ExpressionAttributeValues: {
            ":otp": otp,
            ":expiry": otpExpiry,
          },
        })
      );

      await sendOtpMail(email, otp);

      return {
        success: true,
        verifyRequired: true,
        clientId: existingUser.clientId,
        message: "OTP sent successfully",
      };
    }

    // New User Registration
    const clientId =
      "pvc" + uuidv4().replace(/-/g, "").substring(0, 9);

    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    await ddbDocClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          clientId,
          name,
          contact,
          email,
          otp,
          otpExpiry,
          isVerified: false,
          createdAt: new Date().toISOString(),
        },
      })
    );

    await sendOtpMail(email, otp);

    return {
      success: true,
      verifyRequired: true,
      clientId,
      message: "OTP sent successfully",
    };
  } catch (error) {
    console.error("Register/Login Error:", error);

    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};

/**
 * Verify OTP
 */
const verifyOtp = async ({ clientId, otp }) => {
  try {
    if (!clientId || !otp) {
      return {
        success: false,
        message: "Client ID and OTP are required",
      };
    }

    const response = await ddbDocClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          clientId,
        },
      })
    );

    const user = response.Item;

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    if (!user.otp) {
      return {
        success: false,
        message: "OTP not generated",
      };
    }

    if (Date.now() > user.otpExpiry) {
      return {
        success: false,
        message: "OTP expired",
      };
    }

    if (user.otp !== otp) {
      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          clientId,
        },
        UpdateExpression:
          "SET isVerified = :verified REMOVE otp, otpExpiry",
        ExpressionAttributeValues: {
          ":verified": true,
        },
      })
    );

    const token = generateToken(user);

    return {
      success: true,
      token,
      user: {
        clientId: user.clientId,
        name: user.name,
        contact: user.contact,
        email: user.email,
        isVerified: true,
      },
    };
  } catch (error) {
    console.error("OTP Verification Error:", error);

    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};

module.exports = {
  registerOrLogin,
  verifyOtp,
};