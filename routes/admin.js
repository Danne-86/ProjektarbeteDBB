const express = require("express");
const router = express.Router();

const db = require("../db");

router.use((req, res, next) => {
  // const { user } = req.session ? req.session : {};  // TODO: Uncomment when session is implemented

  // TODO: Remove placeholder for demonstration
  const user = {
    username: "lorem ipsum",
    is_admin: true,
  };
  req.user = user;
  // End of placeholder

  if (!user.is_admin) {
    return res.status(403).send("Access denied");
  }
  next();
});

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
