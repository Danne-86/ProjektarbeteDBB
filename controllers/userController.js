exports.createPost = (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).render("login", {
        title: "Login",
        errorMessage: "You must be logged in to create posts."
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
        errorMessage: errors.join(" ")
      });
    }

    db.run(
      `INSERT INTO posts (user_id, header, content, hero_image) VALUES (?, ?, ?, ?)`,
      [req.user.id, title, content, heroPath]
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