// routes/blog.js
const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");
const { uploadPostImage } = require("../middleware/upload");
const blogController = require("../controllers/blogController");

// Publica routes
router.get("/feed", blogController.getFeed);
router.get("/posts/:id", blogController.getPostById);

// Create post route with image upload handling
router.post(
  "/blog/create",
  authenticateToken,
  uploadPostImage.single("image"),
  blogController.createPost
);

module.exports = router;