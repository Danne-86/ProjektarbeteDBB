const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/:id/follow", authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id, 10);
  const back = req.body.redirect || req.get("referer") || "/";

  try {
    if (followerId === followingId) return res.redirect(back);

    const exists = db
      .prepare(
        "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?"
      )
      .get(followerId, followingId);
    if (exists) return res.redirect(back);

    db.prepare(
      "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)"
    ).run(followerId, followingId);

    res.redirect(back);
  } catch (err) {
    console.error("POST /:id/follow failed:", err);
    res.redirect(back);
  }
});

router.post("/:id/unfollow", authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id, 10);
  const back = req.body.redirect || req.get("referer") || "/";

  try {
    db.prepare(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?"
    ).run(followerId, followingId);

    res.redirect(back);
  } catch (err) {
    console.error("POST /:id/unfollow failed:", err);
    res.redirect(back);
  }
});

module.exports = router;
