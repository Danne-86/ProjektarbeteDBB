const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { issueAuthCookie } = require("../utils/authToken");

const router = express.Router();

// Logout: clear JWT + session cookie
router.get("/logout", (req, res) => {
  res.clearCookie("auth_token");
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie("sid"); // session cookie name from app.js
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

// Register (form)
router.get("/register", (req, res) => {
  res.render("register", { title: "Register", errors: [], values: {} });
});

// Register (submit)
router.post("/register", (req, res) => {
  let { username, email, password, passwordConfirm } = req.body;

  username = (username || "").trim();
  email = (email || "").trim().toLowerCase();

  const errors = [];
  const values = { username, email };

  if (!username || username.length < 3)
    errors.push("Username must be at least 3 characters.");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  if (!email || !emailRegex.test(email))
    errors.push("Please enter a valid email address.");
  if (!password || password.length < 8)
    errors.push("Password must be at least 8 characters.");
  if (password !== passwordConfirm) errors.push("Passwords do not match.");

  if (errors.length) {
    return res
      .status(400)
      .render("register", { title: "Register", errors, values });
  }

  db.get(
    "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
    [username],
    (e1, r1) => {
      if (e1) {
        console.error(e1);
        return res.status(500).render("register", {
          title: "Register",
          errors: ["Server error. Try again."],
          values,
        });
      }
      if (r1) {
        return res.status(400).render("register", {
          title: "Register",
          errors: ["Username already taken."],
          values,
        });
      }

      db.get(
        "SELECT id FROM users WHERE email = ? COLLATE NOCASE",
        [email],
        (e2, r2) => {
          if (e2) {
            console.error(e2);
            return res.status(500).render("register", {
              title: "Register",
              errors: ["Server error. Try again."],
              values,
            });
          }
          if (r2) {
            return res.status(400).render("register", {
              title: "Register",
              errors: ["Email already in use."],
              values,
            });
          }

          const hash = bcrypt.hashSync(password, 10);
          db.run(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, hash],
            function (e3) {
              if (e3) {
                console.error(e3);
                return res.status(500).render("register", {
                  title: "Register",
                  errors: ["Server error. Try again."],
                  values,
                });
              }

              // Build user payload for session/JWT
              const payload = {
                id: this.lastID,
                username,
                email,
                is_admin: 0,
                avatar_url: "/avatars/SpongeBob_SquarePants_character.png",
              };

              // Mint JWT cookie for routes protected by JWT middleware
              issueAuthCookie(res, payload);

              // Keep session for server-rendered EJS
              req.session.user = payload;

              return res.redirect("/");
            }
          );
        }
      );
    }
  );
});

// Login (form)
router.get("/login", (req, res) => {
  res.render("login", { title: "Login", errors: [], values: {} });
});

// Login (submit)
router.post("/login", (req, res) => {
  let { email, password } = req.body;
  email = (email || "").trim().toLowerCase();

  const errors = [];
  const values = { email };

  if (!email || !password) {
    errors.push("Email and password are required.");
    return res.status(400).render("login", { title: "Login", errors, values });
  }

  db.get(
    "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
    [email],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).render("login", {
          title: "Login",
          errors: ["Server error. Try again."],
          values,
        });
      }
      if (!user) {
        return res.status(400).render("login", {
          title: "Login",
          errors: ["Invalid credentials."],
          values,
        });
      }

      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) {
        return res.status(400).render("login", {
          title: "Login",
          errors: ["Invalid credentials."],
          values,
        });
      }

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        avatar_url:
          user.avatar_url || "/avatars/SpongeBob_SquarePants_character.png",
      };

      // JWT for protected routes
      issueAuthCookie(res, payload);

      // Session for EJS
      req.session.user = payload;

      return res.redirect("/");
    }
  );
});

module.exports = router;
