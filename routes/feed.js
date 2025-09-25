// routes/feed.js
const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");

// /feed → all posts (public)
router.get("/feed", blogController.getFeed);

// /posts/:id → single post (public)
router.get("/posts/:id", blogController.getPostById);

// Create comment
router.post("/posts/:id/comment", blogController.createComment);

// Report
router.post("/posts/:id/flag", blogController.flagPost);
router.post("/posts/:postId/:commentId/flag", blogController.flagComment);

// Like
router.post("/posts/:id/like", blogController.likePost);

module.exports = router;
