const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const generateToken = (user) => {
  return jwt.sign(
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

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};