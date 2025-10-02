// routes/blog.js
const express = require("express");
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

// PRIVATE: my posts
router.get("/", requireLoginRedirect, blogController.getMyPosts);

// PRIVATE: create form
router.get("/new", requireLoginRedirect, (req, res) => {
  res.render("blogpage", {
    title: "Create Blog Post",
    successMessage: null,
    errorMessage: null,
    isEdit: false,
    user: req.user,
    isAuthenticated: true,
  });
});

// PRIVATE: create submit
router.post(
  "/new",
  requireLoginRedirect,
  uploadPostImage.single("image"),
  blogController.createPost
);

// PRIVATE: edit form
router.get("/:id/edit", requireLoginRedirect, blogController.renderEditForm);

// PRIVATE: edit submit
router.post(
  "/:id/edit",
  requireLoginRedirect,
  uploadPostImage.single("image"),
  blogController.updatePost
);

// PRIVATE: delete submit
router.post("/:id/delete", requireLoginRedirect, blogController.deletePost);

module.exports = router;