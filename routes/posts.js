const express = require("express");
const router = express.Router();

const db = require("../db");

// get all posts with comments
router.get("/", (req, res, next) => {
  const { user } = req;

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

  posts.forEach((post) => {
    post.comments = [];
  });

  comments.forEach((comment) => {
    const post = posts.find((p) => p.id === comment.post_id);
    if (post) post.comments.push(comment);
  });

  res.send({ title: "Posts", user, posts });
});

// get one post with comments
router.get("/:postId", (req, res, next) => {
  const { user } = req;
  const { postId } = req.params;

  const post = db
    .prepare(
      `SELECT posts.*, users.username AS username, users.id AS user_id
      FROM posts
      INNER JOIN users ON posts.user_id = users.id
      WHERE posts.id = ?
      ORDER BY posts.created_at DESC
      `
    )
    .get(postId);

  const comments = db
    .prepare(
      `SELECT comments.*, users.username AS username, users.id AS user_id
      FROM comments
      INNER JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC`
    )
    .all(postId);

  post.comments = comments;

  res.send({ title: "Post", user, post });
});

// flag/unflag a post
router.post("/:postId/flag", (req, res, next) => {
  const { postId } = req.params;
  const post = db.prepare("SELECT is_flagged FROM posts WHERE id = ?").get(postId);

  const flagged = post.is_flagged ? 0 : 1;
  db.prepare("UPDATE posts SET is_flagged = @flagged WHERE id = @id").run({ flagged, id: postId });

  res.send(postId, flagged);
});

// flag/unflag a comment
router.post("/:commentId/flag", (req, res, next) => {
  const { commentId } = req.params;
  const comment = db.prepare("SELECT is_flagged FROM comments WHERE id = ?").get(commentId);

  const flagged = comment.is_flagged ? 0 : 1;
  db.prepare("UPDATE comments SET is_flagged = @flagged WHERE id = @id").run({ flagged, id: commentId });

  res.send(commentId, flagged);
});

module.exports = router;
