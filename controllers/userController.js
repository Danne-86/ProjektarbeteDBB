const db = require("../db");

exports.uploadAvatar = (req, res) => {
  require("../middleware/upload").uploadAvatar(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || err });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const avatarPath = "/avatars/" + req.file.filename;

    const query = `UPDATE users SET avatar = ? WHERE id = ?`;
    db.run(query, [avatarPath, req.user.id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error updating avatar" });
      }

      res.status(200).json({
        message: "Avatar updated successfully",
        avatar: avatarPath,
      });
    });
  });
};

exports.postComment = (req, res) => {
  const { postId, comment } = req.body;

  if (!comment || !postId) {
    return res.status(400).json({ error: "Missing post ID or comment" });
  }

  const query = `INSERT INTO comments (user_id, post_id, comment) VALUES (?, ?, ?)`;
  db.run(query, [req.user.id, postId, comment], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to post comment" });
    }

    res.status(201).json({ message: "Comment posted successfully" });
  });
};

exports.postLike = (req, res) => {
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ error: "Missing post ID" });
  }

  const query = `INSERT INTO likes (user_id, post_id) VALUES (?, ?)`;
  db.run(query, [req.user.id, postId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to like post" });
    }

    res.status(201).json({ message: "Post liked successfully" });
  });
};
