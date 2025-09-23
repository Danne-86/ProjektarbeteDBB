const db = require("../db");

function getFeed(req, res) {
  const posts = db.all(`
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `);

  const mapped = posts.map((p) => ({
    ...p,
    excerpt: (p.content || "").slice(0, 220) + ((p.content || "").length > 220 ? "…" : ""),
  }));

  res.render("feed", { title: "Blog feed", posts: mapped });
}

function getPostById(req, res) {
  const { id } = req.params;
  const post = db
    .prepare(
      `
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    ORDER BY p.created_at DESC`
    )
    .get(id);
  const comments = db
    .prepare(
      `
      SELECT c.id, c.user_id, c.post_id, c.content, c.created_at, c.is_flagged, u.username
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE post_id = ?
      ORDER BY c.created_at DESC`
    )
    .all(id);
  if (!post) return res.status(404).render("error", { error: "Post not found" });

  res.render("post", { title: post.header, post, comments, user: req.user });
}

function createPost(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).render("login", {
        title: "Login",
        errors: ["Please log in to continue."],
        errorMessage: null,
        values: {},
      });
    }

    let { title, content } = req.body;
    title = (title || "").trim();
    content = (content || "").trim();

    const errors = [];
    if (!title) errors.push("Title is required.");
    if (!content) errors.push("Content is required.");
    if (title.length > 120) errors.push("Title must be ≤ 120 characters.");
    if (content.length > 20000) errors.push("Content must be ≤ 20,000 characters.");

    let heroPath = null;
    if (req.file) {
      heroPath = "/posts/" + req.file.filename;
    }

    if (errors.length) {
      return res.render("blogpage", {
        title: "Create Blog Post",
        user: req.user,
        isAuthenticated: true,
        errorMessage: errors.join(" "),
        successMessage: null,
      });
    }

    db.run(`INSERT INTO posts (user_id, header, content, hero_image) VALUES (?, ?, ?, ?)`, [
      req.user.id,
      title,
      content,
      heroPath,
    ]);

    return res.render("blogpage", {
      title: "Create Blog Post",
      user: req.user,
      isAuthenticated: true,
      successMessage: "Post created successfully!",
      errorMessage: null,
    });
  } catch (err) {
    console.error(err);
    return res.render("blogpage", {
      title: "Create Blog Post",
      user: req.user,
      isAuthenticated: true,
      errorMessage: "Error creating post.",
      successMessage: null,
    });
  }
}

function createComment(req, res) {
  try {
    const user = req.user;
    const postId = req.params.id;
    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);

    if (!post) return res.status(404).render("error", { error: "Post not found" });

    if (!user || !user.id) {
      return res.status(401).render("login", {
        title: "Login",
        errors: ["Please log in to continue."],
        errorMessage: null,
        values: {},
      });
    }

    const comment = req.body.comment.trim();

    let errors = [];

    if (!comment) errors.push("Comment is required.");
    if (comment.length > 500) errors.push("Content must be ≤ 500 characters.");

    if (errors.length > 0) {
      return res.status(400).render("post", {
        title: post.header,
        post,
        user,
        isAuthenticated: true,
        errorMessage: errors.join(" "),
        successMessage: null,
      });
    }

    db.prepare("INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)").run(
      user.id,
      postId,
      comment
    );

    res.redirect(`/blog/posts/${postId}`);
  } catch (err) {
    console.error("Error in createComment", err);
    return res.render("post", {
      title: "Error",
      post,
      user,
      isAuthenticated: true,
      errorMessage: "Error creating comment.",
      errorMessage: null,
    });
  }
}

function flagPost(req, res) {
  const { id } = req.params;
  db.prepare(`UPDATE posts SET is_flagged = 1 WHERE id = ?`).run(id);
  res.redirect(`/blog/posts/${id}`);
}

function flagComment(req, res) {
  const { id } = req.params;
  db.prepare(`UPDATE comments SET is_flagged = 1 WHERE id = ?`).run(id);
  res.redirect(`/blog/comments/${id}`);
}

function likePost(req, res) {
  const postId = req.params.id;
  //TODO: UNCOMMENT WHEN DB TABLE LIKES EXISTS
  /*
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).render("login", {
      title: "Login",
      errors: ["Please log in to continue."],
      errorMessage: null,
      values: {},
    });
  }

  const result = db.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(userId, postId);
  if (result.changes === 0)
    db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(userId, postId);
  */
  res.redirect(`/blog/posts/${postId}`);
}

module.exports = { getFeed, getPostById, createPost, createComment, flagPost, flagComment, likePost };
