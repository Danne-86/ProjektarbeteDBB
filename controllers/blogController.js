const db = require("../db");

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

  const post = db.get(
    `
    SELECT p.id, p.header, p.content, p.created_at, p.hero_image, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `,
    [id]
  );

  if (!post) {
    return res.status(404).render("error", { message: "Post not found" });
  }

  res.render("post", { title: post.header, post });
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
  const mapped = mapExcerpt(posts).map(p => ({ ...p, username: user.username }));

  // Back to feed if no posts
  return res.render("feed", {
    title: `Posts by ${user.username}`,
    posts: mapped
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

module.exports = {
  getFeed,      // GET /feed
  getPostById,  // GET /feed/:id
  getMyPosts,   // used when you want to show only the logged-in user's posts
  createPost,   // POST /blog (or /blog/new) via your router
  getPostsByUsername, // GET /u/:username (public)
};