// ProjektarbeteDBB/ProjektarbeteDBB/routes/profile.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");

// Ensure columns bio + avatar_url exist
(function ensureOptionalColumns() {
  const alters = [
    "ALTER TABLE users ADD COLUMN bio TEXT",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
  ];
  for (const sql of alters) {
    try {
      db.run(sql);
    } catch (_) {
      /* ignore if column exists */
    }
  }
})();

/**
 * GET /profile
 */
router.get("/", authenticateToken, (req, res) => {
  try {
    const user = db
      .prepare(
        "SELECT id, username, email, bio, avatar_url FROM users WHERE id = ?"
      )
      .get(req.user.id);
    if (!user) {
      return res
        .status(404)
        .render("error", { message: "User not found", error: {} });
    }
    res.render("profile", {
      title: "Your Profile",
      user,
      isAuthenticated: true,
    });
  } catch (err) {
    console.error("GET /profile failed:", err);
    res
      .status(500)
      .render("error", { message: "Failed to load profile", error: {} });
  }
});

/**
 * POST /profile
 */
router.post("/", authenticateToken, (req, res) => {
  const { username, email, bio } = req.body;
  try {
    db.run("UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?", [
      username,
      email,
      bio,
      req.user.id,
    ]);
    res.redirect("/profile");
  } catch (err) {
    console.error("POST /profile failed:", err);
    let current = {};
    try {
      current =
        db
          .prepare(
            "SELECT id, username, email, bio, avatar_url FROM users WHERE id = ?"
          )
          .get(req.user.id) || {};
    } catch {}
    res.status(400).render("profile", {
      title: "Your Profile",
      user: { ...current, username, email, bio },
      isAuthenticated: true,
      error: "Could not update profile. " + (err.message || err),
    });
  }
});

/**
 * POST /profile/avatar
 */
router.post("/avatar", authenticateToken, (req, res) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      return res.status(400).render("profile", {
        title: "Your Profile",
        user: req.user,
        isAuthenticated: true,
        error: err.message || String(err),
      });
    }
    if (!req.file) {
      return res.status(400).render("profile", {
        title: "Your Profile",
        user: req.user,
        isAuthenticated: true,
        error: "No file uploaded.",
      });
    }
    const avatarPath = "/avatars/" + req.file.filename;
    try {
      db.run("UPDATE users SET avatar_url = ? WHERE id = ?", [
        avatarPath,
        req.user.id,
      ]);
      res.redirect("/profile");
    } catch (e) {
      console.error("Saving avatar failed:", e);
      res.status(500).render("profile", {
        title: "Your Profile",
        user: req.user,
        isAuthenticated: true,
        error: "Failed to save avatar.",
      });
    }
  });
});

module.exports = router;
