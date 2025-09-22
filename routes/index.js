var express = require("express");
var router = express.Router();
var path = require("path");

const { uploadPostImage } = require("../middleware/upload");
const { error } = require("console");
const { authenticateToken } = require("../middleware/auth");

router.get("/", (req, res) => {
  res.render("", {
    title: "Landing",
  });
});

module.exports = router;
