const express = require("express");
const router = express.Router();

const db = require("../db");

router.use((req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send("Forbidden: Admins only");
  }
  next();
});

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
  //TODO: Backend logic for delete post route
  res.send(`delete post route id: ${req.body.id}`);
});

router.post("/posts/unflag", (req, res, next) => {
  //TODO: Backend logic for unflag post route
  res.send(`unflag post route id: ${req.body.id}`);
});

router.post("/comments/delete", (req, res, next) => {
  //TODO: Backend logic for delete comment route
  res.send(`delete comment route id: ${req.body.id}`);
});

router.post("/comments/unflag", (req, res, next) => {
  //TODO: Backend logic for unflag comment route
  res.send(`unflag  comment route id: ${req.body.id}`);
});

module.exports = router;
