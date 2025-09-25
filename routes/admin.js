const express = require("express");
const router = express.Router();

const db = require("../db");
const { ensureAdmin } = require("../middleware/auth");

router.use(ensureAdmin);

router.get("/", (req, res, next) => {
  const posts = db
    .prepare(
      `SELECT posts.*, users.username AS username, users.id AS user_id
      FROM posts
      INNER JOIN users
        ON posts.user_id = users.id
      ORDER BY posts.created_at DESC`
    )
    .all();

  const comments = db
    .prepare(
      `SELECT comments.*, users.username AS username, users.id AS user_id
      FROM comments
      INNER JOIN users
        ON comments.user_id = users.id
      ORDER BY comments.created_at DESC`
    )
    .all();

  const { user } = req;
  const showFlagged = req.query.flagged !== "false";
  res.render("admin", { title: "Admin Dashboard", _user: user, posts, comments, showFlagged });
});

router.post("/posts/delete", (req, res, next) => {
  const { id, showFlagged } = req.body;
  db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
  res.redirect(`/admin?flagged=${showFlagged}`);
});

router.post("/posts/unflag", (req, res, next) => {
  const { id, showFlagged } = req.body;
  db.prepare(`UPDATE posts SET is_flagged = 0 WHERE id = ?`).run(id);
  res.redirect(`/admin?flagged=${showFlagged}`);
});

router.post("/comments/delete", (req, res, next) => {
  const { id, showFlagged } = req.body;
  db.prepare(`DELETE FROM comments WHERE id = ?`).run(id);
  res.redirect(`/admin?flagged=${showFlagged}`);
});

router.post("/comments/unflag", (req, res, next) => {
  const { id, showFlagged } = req.body;
  db.prepare(`UPDATE comments SET is_flagged = 0 WHERE id = ?`).run(id);
  res.redirect(`/admin?flagged=${showFlagged}`);
});

module.exports = router;
