const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");

(function ensureOptionalColumns() {
  const alters = [
    "ALTER TABLE users ADD COLUMN bio TEXT",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
  ];
  for (const sql of alters) {
    try {
      db.run(sql);
    } catch (_) {}
  }
})();

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
      isOwnProfile: true,
      isFollowing: false,
      originalUrl: req.originalUrl,
    });
  } catch (err) {
    console.error("GET /profile failed:", err);
    res
      .status(500)
      .render("error", { message: "Failed to load profile", error: {} });
  }
});

router.post("/", authenticateToken, (req, res) => {
  const { username, bio } = req.body;
  try {
    db.run("UPDATE users SET username = ?, bio = ? WHERE id = ?", [
      username,
      bio,
      req.user.id,
    ]);
    const fresh = db
      .prepare(
        "SELECT id, username, email, bio, avatar_url, is_admin FROM users WHERE id = ?"
      )
      .get(req.user.id);
    if (fresh) {
      req.session.user = fresh;
    }
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
      user: { ...current, username, bio },
      isAuthenticated: true,
      isOwnProfile: true,
      isFollowing: false,
      originalUrl: req.originalUrl,
      error: "Could not update profile. " + (err.message || err),
    });
  }
});

router.post("/avatar", authenticateToken, (req, res) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      return res.status(400).render("profile", {
        title: "Your Profile",
        user: req.user,
        isAuthenticated: true,
        isOwnProfile: true,
        isFollowing: false,
        originalUrl: req.originalUrl,
        error: err.message || String(err),
      });
    }
    if (!req.file) {
      return res.status(400).render("profile", {
        title: "Your Profile",
        user: req.user,
        isAuthenticated: true,
        isOwnProfile: true,
        isFollowing: false,
        originalUrl: req.originalUrl,
        error: "No file uploaded.",
      });
    }
    const avatarPath = "/avatars/" + req.file.filename;
    try {
      db.run("UPDATE users SET avatar_url = ? WHERE id = ?", [
        avatarPath,
        req.user.id,
      ]);
      const fresh = db
        .prepare(
          "SELECT id, username, email, bio, avatar_url, is_admin FROM users WHERE id = ?"
        )
        .get(req.user.id);
      if (fresh) {
        req.session.user = fresh;
      }
      res.redirect("/profile");
    } catch (e) {
      console.error("Saving avatar failed:", e);
      res.status(500).render("profile", {
        title: "Your Profile",
        user: req.user,
        isAuthenticated: true,
        isOwnProfile: true,
        isFollowing: false,
        originalUrl: req.originalUrl,
        error: "Failed to save avatar.",
      });
    }
  });
});

router.get("/:id", authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const profileUser = db
      .prepare("SELECT id, username, bio, avatar_url FROM users WHERE id = ?")
      .get(userId);

    if (!profileUser) {
      return res
        .status(404)
        .render("error", { message: "User not found", error: {} });
    }

    if (profileUser.id === req.user.id) {
      return res.redirect("/profile");
    }

    const follow = db
      .prepare(
        "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?"
      )
      .get(req.user.id, userId);

    res.render("profile", {
      title: profileUser.username + "'s Profile",
      user: profileUser,
      isAuthenticated: true,
      isOwnProfile: false,
      isFollowing: !!follow,
      originalUrl: req.originalUrl,
    });
  } catch (err) {
    console.error("GET /profile/:id failed:", err);
    res
      .status(500)
      .render("error", { message: "Failed to load profile", error: {} });
  }
});

module.exports = router;
