// routes/feed.js
const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");

// /feed → all posts (public)
router.get("/feed", blogController.getFeed);

// /posts/:id → single post (public)
router.get("/posts/:id", blogController.getPostById);

module.exports = router;
