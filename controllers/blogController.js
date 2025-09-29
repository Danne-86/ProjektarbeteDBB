const db = require("../db");
const fs = require("fs");
const path = require("path");

// remove a file under /public safely (given its web path like "/posts/abc.jpg")
function tryRemovePublicFile(webPath) {
  try {
    if (!webPath) return;
    const abs = path.join(__dirname, "..", "public", webPath.replace(/^\//, ""));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) {}
}

// Helper to add excerpt to posts
function mapExcerpt(rows) {
  return rows.map((p) => ({
    ...p,
    excerpt:
      (p.content || "").slice(0, 220) +
      ((p.content || "").length > 220 ? "…" : ""),
  }));
}

// PUBLIC: GET /feed - all posts
function getFeed(req, res) {
  const posts = db.all(`
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `);

  res.render("feed", { title: "All posts", posts: mapExcerpt(posts) });
}

// PUBLIC: GET /posts/:id - single post by ID
function getPostById(req, res) {
  const { id } = req.params;
  const post = db
    .prepare(
      `
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image, p.is_flagged, p.user_id, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    ORDER BY p.created_at DESC`
    )
    .get(id);

    if (!post) {
      return res.status(404).render("error", { message: "Post not found" });
    }

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
  const likes = db
    .prepare(
      `
    SELECT
      COUNT (*) AS count,
      EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?) AS by_user
    FROM likes
    WHERE post_id = ?`
    )
    .get(req.user?.id || 0, id, id);

  const likesCount = likes?.count;
  const likedByUser = likes?.by_user;

  let isFollowing = false;
  const viewerId = req.user?.id || null;
  const authorId = post?.user_id || null;
  if (viewerId && authorId && viewerId !== authorId) {
    const row = db
      .prepare(
        "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?"
      )
      .get(viewerId, authorId);
    isFollowing = !!row;
  }

  if (!post)
    return res.status(404).render("error", { error: "Post not found" });

  res.render("post", {
    title: post.header,
    post,
    comments,
    user: req.user,
    likesCount,
    likedByUser,
    authorId,
    isFollowing,
  });
}

// PRIVATE: GET /blog - user's posts
function getMyPosts(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.redirect("/feed");

  const posts = db.all(
    `
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `,
    [userId]
  );

  res.render("feed", { title: "My posts", posts: mapExcerpt(posts) });
}

// PUBLIC: GET /u/:username - all posts by username
function getPostsByUsername(req, res) {
  const { username } = req.params;

  const user = db.get(
    `SELECT id, username, avatar_url, created_at FROM users WHERE username = ?`,
    [username]
  );

  if (!user) {
    return res.status(404).render("error", { message: "User not found" });
  }

  const posts = db.all(
    `
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image
    FROM posts p
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    `,
    [user.id]
  );

  // Add username to each post for rendering
  const mapped = mapExcerpt(posts).map((p) => ({
    ...p,
    username: user.username,
  }));

  // Back to feed if no posts
  return res.render("feed", {
    title: `Posts by ${user.username}`,
    posts: mapped,
  });
}

// PRIVATE: POST /blog/new - create new post
function createPost(req, res) {
  try {
    // Guard: must be logged in
    if (!req.user || !req.user.id) {
      return res.status(401).render("login", {
        title: "Login",
        errors: ["Please log in to continue."],
        errorMessage: null,
        values: {},
      });
    }

    // Basic input normalization + validation
    let { title, content } = req.body;
    title = (title || "").trim();
    content = (content || "").trim();

    const errors = [];
    if (!title) errors.push("Title is required.");
    if (!content) errors.push("Content is required.");
    if (title.length > 120) errors.push("Title must be ≤ 120 characters.");
    if (content.length > 20000)
      errors.push("Content must be ≤ 20,000 characters.");

    // Optional hero image
    let heroPath = null;
    if (req.file) {
      heroPath = "/posts/" + req.file.filename;
    }

    if (errors.length) {
      return res.status(400).render("blogpage", {
        title: "Create Blog Post",
        user: req.user,
        isAuthenticated: true,
        errorMessage: errors.join(" "),
        successMessage: null,
      });
    }

    // Persist the post
    db.run(
      `INSERT INTO posts (user_id, header, content, hero_image) VALUES (?, ?, ?, ?)`,
      [req.user.id, title, content, heroPath]
    );

    // Flash success and redirect to the public feed
    req.session.successMessage = "Post created successfully!";
    return res.redirect("/blog");
  } catch (err) {
    console.error(err);
    return res.status(500).render("blogpage", {
      title: "Create Blog Post",
      user: req.user,
      isAuthenticated: true,
      errorMessage: "Error creating post.",
      successMessage: null,
    });
  }
}

// GET /blog/:id/edit – render edit form
function renderEditForm(req, res) {
  if (!req.user?.id) {
    return res.redirect("/login?returnTo=" + encodeURIComponent(req.originalUrl));
  }

  const { id } = req.params;
  const post = db
    .prepare(`SELECT id, user_id, header, content, hero_image FROM posts WHERE id = ?`)
    .get(id);

  if (!post) return res.status(404).render("error", { message: "Post not found" });
  if (post.user_id !== req.user.id) {
    return res.status(403).render("error", { message: "You can't edit this post." });
  }

  // Reuse blogpage.ejs for editing
  res.render("blogpage", {
    title: "Edit Post",
    isEdit: true,
    post,
    user: req.user,
    isAuthenticated: true,
    successMessage: null,
    errorMessage: null,
  });
}

// POST /blog/:id/edit – update post (+ optional new hero image)
function updatePost(req, res) {
  try {
    if (!req.user?.id) {
      return res.redirect("/login?returnTo=" + encodeURIComponent(req.originalUrl));
    }

    const { id } = req.params;
    const existing = db
      .prepare(`SELECT id, user_id, header, content, hero_image FROM posts WHERE id = ?`)
      .get(id);

    if (!existing) return res.status(404).render("error", { message: "Post not found" });
    if (existing.user_id !== req.user.id) {
      return res.status(403).render("error", { message: "You can't edit this post." });
    }

    let { title, content } = req.body;
    title = (title || "").trim();
    content = (content || "").trim();

    const errors = [];
    if (!title) errors.push("Title is required.");
    if (!content) errors.push("Content is required.");
    if (title.length > 120) errors.push("Title must be ≤ 120 characters.");
    if (content.length > 20000) errors.push("Content must be ≤ 20,000 characters.");

    // Replace image if a new one was uploaded; otherwise keep the old one
    let heroPath = existing.hero_image;
    if (req.file) {
      tryRemovePublicFile(existing.hero_image);
      heroPath = "/posts/" + req.file.filename;
    }

    if (errors.length) {
      return res.status(400).render("blogpage", {
        title: "Edit Post",
        isEdit: true,
        post: { ...existing, header: title, content, hero_image: heroPath },
        user: req.user,
        isAuthenticated: true,
        errorMessage: errors.join(" "),
        successMessage: null,
      });
    }

    db.prepare(
      `UPDATE posts
       SET header = ?, content = ?, hero_image = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`
    ).run(title, content, heroPath, id, req.user.id);

    req.session.successMessage = "Post updated.";
    return res.redirect(`/posts/${id}`);
  } catch (err) {
    console.error("updatePost error", err);
    return res.status(500).render("error", { message: "Error updating post" });
  }
}

// POST /blog/:id/delete – delete post (+ image + likes)
function deletePost(req, res) {
  try {
    if (!req.user?.id) {
      return res.redirect("/login?returnTo=" + encodeURIComponent(req.originalUrl));
    }

    const { id } = req.params;
    const existing = db
      .prepare(`SELECT id, user_id, hero_image FROM posts WHERE id = ?`)
      .get(id);

    if (!existing) return res.status(404).render("error", { message: "Post not found" });
    if (existing.user_id !== req.user.id) {
      return res.status(403).render("error", { message: "You can't delete this post." });
    }

    // Remove image best-effort
    tryRemovePublicFile(existing.hero_image);

    // Remove likes (if you don't have FK cascade on likes)
    try { db.prepare(`DELETE FROM likes WHERE post_id = ?`).run(id); } catch (_) {}

    // Comments have ON DELETE CASCADE in your schema; delete post last
    db.prepare(`DELETE FROM posts WHERE id = ? AND user_id = ?`).run(id, req.user.id);

    req.session.successMessage = "Post deleted.";
    return res.redirect("/blog");
  } catch (err) {
    console.error("deletePost error", err);
    return res.status(500).render("error", { message: "Error deleting post" });
  }
}

function createComment(req, res) {
  try {
    const user = req.user;
    const postId = req.params.id;

    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);
    if (!post)
      return res.status(404).render("error", { error: "Post not found" });

    let errors = [];

    const comment = req.body.comment.trim();
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

    db.prepare(
      "INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)"
    ).run(user.id, postId, comment);

    res.redirect(`/posts/${postId}`);
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

function updateComment(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).render("login", {
        title: "Login",
        errors: ["Please log in to continue."],
        errorMessage: null,
        values: {},
      });
    }

    const { postId, commentId } = req.params;
    const existing = db
      .prepare(`SELECT id, user_id, post_id FROM comments WHERE id = ? AND post_id = ?`)
      .get(commentId, postId);

    if (!existing) {
      return res.status(404).render("error", { message: "Comment not found" });
    }

    const isOwnerOrAdmin = existing.user_id === req.user.id || !!req.user.is_admin;
    if (!isOwnerOrAdmin) {
      return res.status(403).render("error", { message: "You can't edit this comment." });
    }

    let content = (req.body.content || "").trim();
    const errors = [];
    if (!content) errors.push("Comment is required.");
    if (content.length > 500) errors.push("Content must be ≤ 500 characters.");

    if (errors.length) {
      req.session.errorMessage = errors.join(" ");
      return res.redirect(`/posts/${postId}#c-${commentId}`);
    }

    db.prepare(`UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(content, commentId);

    return res.redirect(`/posts/${postId}#c-${commentId}`);
  } catch (e) {
    console.error("updateComment error", e);
    return res.status(500).render("error", { message: "Error updating comment" });
  }
}

// DELETE comment: POST /posts/:postId/comments/:commentId/delete
function deleteComment(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).render("login", {
        title: "Login",
        errors: ["Please log in to continue."],
        errorMessage: null,
        values: {},
      });
    }

    const { postId, commentId } = req.params;
    const existing = db
      .prepare(`SELECT id, user_id, post_id FROM comments WHERE id = ? AND post_id = ?`)
      .get(commentId, postId);

    if (!existing) {
      return res.status(404).render("error", { message: "Comment not found" });
    }

    const isOwnerOrAdmin = existing.user_id === req.user.id || !!req.user.is_admin;
    if (!isOwnerOrAdmin) {
      return res.status(403).render("error", { message: "You can't delete this comment." });
    }

    db.prepare(`DELETE FROM comments WHERE id = ?`).run(commentId);
    return res.redirect(`/posts/${postId}`);
  } catch (e) {
    console.error("deleteComment error", e);
    return res.status(500).render("error", { message: "Error deleting comment" });
  }
}

function flagPost(req, res) {
  const { id } = req.params;
  if (!req.user?.id) {
    return res.status(401).render("login", {
      title: "Login",
      errors: ["Please log in to continue."],
      errorMessage: null,
      values: {},
    });
  }
  db.prepare(`UPDATE posts SET is_flagged = 1 WHERE id = ?`).run(id);
  res.redirect(`/posts/${id}`);
}

function flagComment(req, res) {
  if (!req.user?.id) {
    return res.status(401).render("login", {
      title: "Login",
      errors: ["Please log in to continue."],
      errorMessage: null,
      values: {},
    });
  }
  db.prepare(`UPDATE comments SET is_flagged = 1 WHERE id = ?`).run(
    req.params.commentId
  );
  res.redirect(`/posts/${req.params.postId}`);
}

function likePost(req, res) {
  const postId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).render("login", {
      title: "Login",
      errors: ["Please log in to continue."],
      errorMessage: null,
      values: {},
    });
  }

  const result = db
    .prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?")
    .run(userId, postId);
  if (result.changes === 0)
    db.prepare(
      "INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)"
    ).run(userId, postId);

  res.redirect(`/posts/${postId}`);
}

module.exports = {
  getFeed, // GET /feed
  getPostById, // GET /feed/:id
  getMyPosts, // used when you want to show only the logged-in user's posts
  createPost, // POST /blog (or /blog/new) via your router
  createComment,
  getPostsByUsername, // GET /u/:username (public)
  flagPost,
  flagComment,
  likePost,
  renderEditForm,       // GET  /blog/:id/edit
  updatePost,           // POST /blog/:id/edit
  deletePost,           // POST /blog/:id/delete
  updateComment,        // POST /posts/:postId/comments/:commentId/edit
  deleteComment         // POST /posts/:postId/comments/:commentId/delete
};
