// middleware/auth.js
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).send("Access denied");

  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.status(403).send("Invalid token");
    req.user = user;
    next();
  });
}

function authenticateAdmin(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).send("Access denied");

  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.status(403).send("Invalid token");
    if (!user.is_admin) {
      return res
        .status(403)
        .send("You are not authorized to perform this action");
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, authenticateAdmin };
