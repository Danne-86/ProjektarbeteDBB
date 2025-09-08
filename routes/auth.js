var express = require("express");
var router = express.Router();

router.get("/login", function (req, res) {
  res.render("login", { title: "Login" });
});

router.get("/register", function (req, res) {
  res.render("register", { title: "Register" });
});

router.get("/logout", function (req, res) {
  if (req.session) req.session.destroy(() => res.redirect("/"));
  else res.redirect("/");
});

router.get("/dev-login", (req, res) => {
  req.session.user = { id: 1, name: "Test User" };
  res.redirect("/");
});

router.get("/dev-logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => res.redirect("/"));
  } else {
    res.redirect("/");
  }
});

router.get("/login", (req, res) => res.render("login", { title: "Login" }));
router.get("/register", (req, res) =>
  res.render("register", { title: "Register" })
);

module.exports = router;
