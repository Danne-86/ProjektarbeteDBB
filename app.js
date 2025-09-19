// app.js
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const jwt = require("jsonwebtoken");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const profileRouter = require("./routes/profile");

const { SECRET } = require("./utils/authToken");

const app = express();

// Views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Core middleware (order matters)
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Layouts
app.use(expressLayouts);
app.set("layout", "layouts/base");

// If behind a proxy/HTTPS in prod, uncomment:
// app.set("trust proxy", 1);

// Sessions (used for EJS state)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    name: "sid",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // true on HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Expose auth state from session to all views
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.user = req.session ? req.session.user : null;
  next();
});

// Fallback: if no session, try JWT so EJS can still show logged-in UI
app.use((req, res, next) => {
  if (res.locals.isAuthenticated) return next();
  const token = req.cookies && req.cookies.auth_token;
  if (!token) return next();
  jwt.verify(token, SECRET, (err, user) => {
    if (!err && user) {
      req.user = user;
      res.locals.isAuthenticated = true;
      res.locals.user = user;
    }
    next();
  });
});

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// Routers (mount after sessions/locals)
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/", authRouter);
app.use("/admin", adminRouter);
app.use("/profile", profileRouter);

// 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
