// routes/blog.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getFeed, getPostById, createPost } = require("../controllers/blogController");

// Publika sidor
router.get("/feed", getFeed);
router.get("/posts/:id", getPostById);

// Create post (authenticated)
router.post("/blog/create", authenticateToken, createPost);

module.exports = router;