const express = require("express");
const cookieParser = require("cookie-parser");
const router = express.Router();
const blogController = require("../controllers/blogController");

router.use(cookieParser());

// Accept only app-internal URLs
function safeUrl(url, fallback = "/feed") {
  if (!url || typeof url !== "string") return fallback;
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url);
      return u.pathname + (u.search || "") + (u.hash || "");
    }
    return url.startsWith("/") ? url : `/${url}`;
  } catch {
    return fallback;
  }
}

/**
 *    If the request is a GET AND the path does NOT start with /posts/, remember that URL as prevUrl in a cookie.
 */
router.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/posts/")) {
    const here = safeUrl(req.originalUrl, "/feed");
    res.cookie("prevUrl", here, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 1000 * 60 * 60 * 12,
    });
  }
  next();
});

/**
 * 2) When opening a post:
 *    Prefer ?prevUrl
 *    Else use the cookie from the tracker above
 *    Else fallback to '/feed'
 */
function preparePostLocals(req, res, next) {
  const q = req.query.prevUrl ? safeUrl(req.query.prevUrl) : undefined;
  const c = req.cookies.prevUrl ? safeUrl(req.cookies.prevUrl) : undefined;
  const prevUrl = q || c || "/feed";

  res.cookie("prevUrl", prevUrl, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 1000 * 60 * 60 * 12,
  });

  res.locals.prevUrl = prevUrl;
  res.locals.currentUrl = req.originalUrl;
  next();
}

/**
 *   Carry prevUrl from body (if provided) OR fall back to the cookie we track globally
 */
function carryPrevOnPost(req, res, next) {
  const bodyPrev = req.body?.prevUrl ? safeUrl(req.body.prevUrl) : undefined;
  const cookiePrev = req.cookies.prevUrl
    ? safeUrl(req.cookies.prevUrl)
    : undefined;
  const prevUrl = bodyPrev || cookiePrev || "/feed";

  res.cookie("prevUrl", prevUrl, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 1000 * 60 * 60 * 12,
  });

  if (!req.body.redirect) {
    const id = req.params.id || req.params.postId;
    req.body.redirect = id
      ? `/posts/${id}?prevUrl=${encodeURIComponent(prevUrl)}`
      : "/feed";
  }

  next();
}

//  Routes

router.get("/feed", blogController.getFeed);

// /posts/:id → single post (public)
router.get("/posts/:id", preparePostLocals, blogController.getPostById);

// Create comment
router.post(
  "/posts/:id/comment",
  carryPrevOnPost,
  blogController.createComment
);

// Report
router.post("/posts/:id/flag", carryPrevOnPost, blogController.flagPost);
router.post(
  "/posts/:postId/:commentId/flag",
  carryPrevOnPost,
  blogController.flagComment
);

// Like
router.post("/posts/:id/like", carryPrevOnPost, blogController.likePost);

module.exports = router;
