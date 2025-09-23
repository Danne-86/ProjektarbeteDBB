// routes/feed.js
const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");

// /feed → all posts (public)
router.get("/", blogController.getFeed);

// /feed/:id → single post (public)
router.get("/:id", blogController.getPostById);

module.exports = router;
