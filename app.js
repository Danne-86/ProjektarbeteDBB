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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Sessions
app.use(
  session({
    secret: "dev-secret", // should be in .env file if going to production
    resave: false,
    saveUninitialized: false,
    name: "sid", // cookie name
    cookie: {
      httpOnly: true, // mitigate XSS cookie theft
      sameSite: "lax", // sane default
      secure: false, // keep false since http:// in dev
      maxAge: 1000 * 60 * 60 * 24, // cookies will expire after1 day
    },
  })
);

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.user = req.session ? req.session.user : null;
  next();
});

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
