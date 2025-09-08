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

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
    secret: "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!(req.session && req.session.user);
  res.locals.user = req.session ? req.session.user : null;
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/dev-login", (req, res) => {
  req.session.user = { id: 1, name: "Test User" };
  console.log("Dev login -> session.user:", req.session.user);
  res.redirect("/");
});

app.get("/dev-logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => res.redirect("/"));
  } else {
    res.redirect("/");
  }
});

app.get("/whoami", (req, res) => {
  res.json({
    sessionUser: req.session && req.session.user ? req.session.user : null,
    isAuthenticated: !!(req.session && req.session.user),
  });
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/", authRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
