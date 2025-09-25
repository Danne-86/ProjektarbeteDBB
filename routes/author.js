const express = require("express");
const router = express.Router();
const { getPostsByUsername } = require("../controllers/blogController");

router.get("/:username", getPostsByUsername);

module.exports = router;