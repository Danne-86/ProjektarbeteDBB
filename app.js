const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");

const app = express();

// Views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Core middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true with HTTPS + app.set('trust proxy', 1)
      sameSite: "lax",
    },
  })
);

// Make auth flags available to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.user = req.session ? req.session.user : null;
  next();
});

// Static
app.use(express.static(path.join(__dirname, "public")));

// Routers
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/", authRouter);

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
