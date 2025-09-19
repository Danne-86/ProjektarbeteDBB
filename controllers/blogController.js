const db = require("../db");

// GET /feed – public blog feed
exports.getFeed = (req, res) => {
  const posts = db.all(
    `
    SELECT p.id, p.header, p.content, p.created_at, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
    `
  );

  const mapped = posts.map((p) => ({
    ...p,
    excerpt: (p.content || "").slice(0, 220) + ((p.content || "").length > 220 ? "…" : "")
  }));

  res.render("feed", {
    title: "Blog feed",
    posts: mapped
  });
};

// GET /posts/:id – public single post
exports.getPostById = (req, res) => {
  const { id } = req.params;
  const post = db.get(
    `
    SELECT p.id, p.header, p.content, p.created_at, u.username
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    `,
    [id]
  );

  if (!post) {
    return res.status(404).render("error", { message: "Post not found" });
  }

  res.render("post", {
    title: post.header,
    post
  });
};

// POST /blog/create – create new blog post (authenticated)
exports.createPost = (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).render("login", {
        title: "Login",
        errorMessage: "You must be logged in to create posts."
      });
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return res.render("blogpage", {
        title: "Create Blog Post",
        user: req.user,
        isAuthenticated: true,
        errorMessage: "Title and content are required."
      });
    }

    db.run(
      `INSERT INTO posts (user_id, header, content) VALUES (?, ?, ?)`,
      [req.user.id, title, content]
    );

    return res.render("blogpage", {
      title: "Create Blog Post",
      user: req.user,
      isAuthenticated: true,
      successMessage: "Post created successfully!"
    });
  } catch (err) {
    console.error(err);
    return res.render("blogpage", {
      title: "Create Blog Post",
      user: req.user,
      isAuthenticated: true,
      errorMessage: "Error creating post."
    });
  }
};