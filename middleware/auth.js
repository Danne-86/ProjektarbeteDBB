const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  const token = req.cookies && req.cookies.auth_token;
  if (!token) return res.status(401).send("Access denied");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret",
    (err, user) => {
      if (err) return res.status(403).send("Invalid token");
      req.user = user;
      next();
    }
  );
}

function authenticateAdmin(req, res, next) {
  if (req.session && req.session.user) {
    if (req.session.user.is_admin) {
      req.user = req.session.user;
      return next();
    }
    return res
      .status(403)
      .send("You are not authorized to perform this action");
  }

  const token = req.cookies && req.cookies.auth_token;
  if (!token) return res.status(401).send("Access denied");

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_jwt_secret",
    (err, user) => {
      if (err) return res.status(403).send("Invalid token");
      if (!user.is_admin) {
        return res
          .status(403)
          .send("You are not authorized to perform this action");
      }
      req.user = user;
      next();
    }
  );
}

module.exports = { authenticateToken, authenticateAdmin };
