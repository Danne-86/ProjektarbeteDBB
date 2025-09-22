// routes/blog.js
const express = require("express");
const multer = require("multer");
const router = express.Router();

// const { authenticateToken } = require("../middleware/auth");
const { uploadPostImage } = require("../middleware/upload");
const blogController = require("../controllers/blogController");

// Middleware to ensure user is logged in, else redirect to login with returnTo
function requireLoginRedirect(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  const returnTo = encodeURIComponent(req.originalUrl || "/blog");
  return res.redirect(`/login?returnTo=${returnTo}`);
}

// Blog -> feed (public)
router.get("/", blogController.getFeed);

// /blog/new -> post page (requires login)
router.get("/new", requireLoginRedirect, (req, res) => {
  res.render("blogpage", {
    title: "Create Blog Post",
    successMessage: null,
    errorMessage: null,
  });
});

router.post(
  "/",
  requireLoginRedirect,
  uploadPostImage.single("image"),
  blogController.createPost
);
router.get("/:id", blogController.getPostById); 

module.exports = router;
