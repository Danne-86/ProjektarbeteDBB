const express = require("express");
const router = express.Router();

const db = require("../db");

router.use((req, res, next) => {
  // TODO: Uncomment when session is implemented
  // const { user } = req.session ? req.session : {};

  // TODO: Remove placeholder for demonstration
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(2);
  req.user = user;
  // End of placeholder

  if (!user.is_admin) {
    return res.status(403).send("Access denied");
  }
  next();
});

/* GET admin dashboard page. */
router.get("/", (req, res, next) => {
  const posts = db
    .prepare(
      `SELECT posts.*, users.username AS username, users.id AS user_id, users.avatar AS user_avatar
      FROM posts
      INNER JOIN users
        ON posts.user_id = users.id`
    )
    .all();

  const comments = db
    .prepare(
      `SELECT comments.*, users.username AS username, users.id AS user_id, users.avatar AS user_avatar
      FROM comments
      INNER JOIN users
        ON comments.user_id = users.id`
    )
    .all();

  const { user } = req;
  const showFlagged = req.query.flagged === "true";
  res.render("admin", { title: "Admin Dashboard", user, posts, comments, showFlagged });
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
