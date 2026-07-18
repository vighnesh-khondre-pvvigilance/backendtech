import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { PutCommand, UpdateCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamo from "../config/dynamodb.js";
import { generateOTP } from "../utils/otp.js";
import { generateToken } from "../utils/jwt.js";
import { sendOtpMail } from "./mail.service.js";

config();

const TABLE_NAME = process.env.FREE_USER_TABLE;

/**
 * Get user by email using GSI
 */
export const getUserByEmail = async (email) => {
  const response = await send(
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
export const registerOrLogin = async ({ name, contact, email }) => {
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
          freeTechId: existingUser.freeTechId,
          name: existingUser.name,
          phone: existingUser.contact,
          email: existingUser.email,
          role: existingUser.role,
        },
      };
    }

    // Existing but Not Verified
    if (existingUser) {
      const otp = generateOTP();
      const otpExpiry = Date.now() + 5 * 60 * 1000;

      await send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            freeTechId: existingUser.freeTechId,
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
        freeTechId: existingUser.freeTechId,
        message: "OTP sent successfully",
      };
    }

    // New User Registration
    const freeTechId =
      "PVF" +
      uuidv4()
        .replace(/-/g, "")
        .substring(0, 9)
        .toUpperCase();

    const otp = generateOTP();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    await send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          freeTechId,
          name,
          contact,
          email,
          role: "FREE",
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
      freeTechId,
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
export const verifyOtp = async ({ freeTechId, otp }) => {
  try {
    if (!freeTechId || !otp) {
      return {
        success: false,
        message: "Free Technician ID and OTP are required",
      };
    }

    const response = await send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          freeTechId,
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

    await send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          freeTechId,
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
        freeTechId: user.freeTechId,
        name: user.name,
        phone: user.contact,
        email: user.email,
        role: user.role,
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

export const getProfile = async (freeTechId) => {
  const response = await send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        freeTechId,
      },
    })
  );

  if (!response.Item) {
    return {
      success: false,
      message: "User not found",
    };
  }

  return {
    success: true,
    user: response.Item,
  };
};

// export default {
//   registerOrLogin,
//   verifyOtp,
//   getProfile
// };