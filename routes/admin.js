const express = require("express");
const router = express.Router();

/* GET admin dashboard page. */
router.get("/", (req, res, next) => {
  // const { user } = req.session ? req.session : {}; // Uncomment when session is implemented

  // Placeholder for demonstration
  const user = {
    username: "Lorem Ipsum",
    is_admin: true,
  };
  // End of placeholder

  if (!user || !user.is_admin) {
    return res.status(403).send("Access denied");
  }

  // Placeholders for demonstration
  let posts = [
    {
      id: 1,
      title: "Sample Post 1",
      content:
        "This is a sample post with a lot of content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      user: {
        id: 12,
        username: "Sean Banan",
      },
      isFlagged: false,
    },
    {
      id: 2,
      title: "Sample Post 2",
      content:
        "This is a sample post with a lot of content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      user: {
        id: 12,
        username: "Sean Banan",
      },
      isFlagged: true,
    },
    {
      id: 3,
      title: "Sample Post 3",
      content:
        "This is a sample post with a lot of content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      user: {
        id: 13,
        username: "Jane Doe",
      },
      isFlagged: false,
    },
    {
      id: 4,
      title: "Sample Post 4",
      content: "This is a sample post content.",
      user: {
        id: 13,
        username: "Jane Doe",
      },
      isFlagged: true,
    },
  ];

  let comments = [
    {
      id: 1,
      postId: 3,
      content: "This is a sample comment 1.",
      user: {
        id: 11,
        username: "Joe Doe",
      },
      isFlagged: true,
    },
    {
      id: 2,
      postId: 3,
      content: "This is a sample comment 2.",
      user: {
        id: 11,
        username: "Joe Doe",
      },
      isFlagged: false,
    },
    {
      id: 3,
      postId: 3,
      content: "This is a sample comment 3.",
      user: {
        id: 11,
        username: "Joe Doe",
      },
      isFlagged: true,
    },
    {
      id: 4,
      postId: 1,
      content: "This is a sample comment 4.",
      user: {
        id: 11,
        username: "Joe Doe",
      },
      isFlagged: false,
    },
  ];
  // End of placeholders

  const showFlagged = req.query.flagged === "true";
  res.render("admin", { title: "Admin Dashboard", user, posts, comments, showFlagged });
});

router.post("/posts/:id/delete", (req, res, next) => {
  // Delete post logic here
  res.send(`Delete post id ${req.params.id}`);
});

router.post("/posts/:id/unflag", (req, res, next) => {
  // Unflag post logic here
  res.send(`Unflag post id ${req.params.id}`);
});

router.post("/comments/:id/delete", (req, res, next) => {
  // Delete comment logic here
  res.send(`Delete comment id ${req.params.id}`);
});

router.post("/comments/:id/unflag", (req, res, next) => {
  // unflag comment logic here
  res.send(`Unflag comment id ${req.params.id}`);
});
module.exports = router;
