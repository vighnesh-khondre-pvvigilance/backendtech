import pkg from "jsonwebtoken";
import { config } from "dotenv";

config();

const { sign, verify } = pkg;

export const generateToken = (user) => {
  return sign(
    {
      clientId: user.clientId,
      email: user.email,
      role: "FREE",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const verifyToken = (token) => {
  return verify(token, process.env.JWT_SECRET);
};

// export default {
//   generateToken,
//   verifyToken,
// };