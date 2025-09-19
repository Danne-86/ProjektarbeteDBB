const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "your_jwt_secret";

function issueAuthCookie(res, payload) {
  const token = jwt.sign(payload, SECRET, { expiresIn: "7d" });
  res.cookie("auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return token;
}

module.exports = { issueAuthCookie, SECRET };
