var express = require("express");
var router = express.Router();
var path = require("path");

const { uploadPostImage } = require("../middleware/upload");
const { error } = require("console");
const { authenticateToken } = require("../middleware/auth");
const db = require('better-sqlite3')('database.db');

/* GET home page. */
router.get('/', function (req, res, next) {
  const posts = db.prepare(`
        SELECT p.*, u.avatar 
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
    `).all();

  res.render('index', {
    title: 'Inkflow',
    posts
  });
});

router.get("/", (req, res) => {
  return res.redirect("/feed");
});

// GET blog page
router.get("/blog", (req, res) => {
  res.render("blogpage", {
    title: "Create Blog Post",
    successMessage: null,
    errorMessage: null,
  });
});

// POST handle blog creation with image upload
router.post("/blog/create", authenticateToken, (req, res) => {
  uploadPostImage(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.render("blogpage", {
            title: "Create Blog Post",
            user: req.user,
            isAuthenticated: true,
            errorMessage: "File size too large. Maximum size is 10MB.",
          });
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.render("blogpage", {
            title: "Create Blog Post",
            user: req.user,
            isAuthenticated: true,
            errorMessage: "Too many files. Maximum 5 images allowed.",
          });
        }
      }
      return res.render("blogpage", {
        title: "Create Blog Post",
        user: req.user,
        isAuthenticated: true,
        errorMessage: "Error uploading image: " + err.message,
      });
    }

    try {
      const { title, content } = req.body;
      let imagePaths = [];

      // Check if images were uploaded (using req.files instead of req.file)
      if (req.files && req.files.length > 0) {
        // Map all uploaded files to their paths
        imagePaths = req.files.map((file) => "/posts/" + file.filename);
      } else {
        return res.render("blogpage", {
          title: "Create Blog Post",
          user: req.user,
          isAuthenticated: true,
          errorMessage: "No images uploaded",
        });
      }

      // Continue with saving the blog post, etc.
      // res.render('blogpage', { ...successMessage... });
    } catch (error) {
      return res.render("blogpage", {
        title: "Create Blog Post",
        user: req.user,
        isAuthenticated: true,
        errorMessage: "Error: " + error.message,
      });
    }
  });
});

// Error handling middleware for Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.render("blogpage", {
        title: "Create Blog Post",
        successMessage: null,
        errorMessage: "File size too large. Maximum size is 10MB.",
      });
    }
  } else if (error) {
    return res.render("blogpage", {
      title: "Create Blog Post",
      successMessage: null,
      errorMessage: error.message,
    });
  }
  next();
});

module.exports = router;
