var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');

// Configure Multer for image uploads
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
var fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

var upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET blog page
router.get('/blog', (req, res) => {
  res.render('blogpage', {
    title: 'Create Blog Post',
    successMessage: null,
    errorMessage: null
  });
});

// POST handle blog creation with image upload
router.post('/blog/create', upload.single('image'), (req, res) => {
  try {
    const { title, content } = req.body;
    let imagePath = null;
    
    // Check if image was uploaded
    if (req.file) {
      imagePath = '/images/' + req.file.filename;
    }
    
    // Here you would save to your database including the imagePath
    console.log('Received blog post:', { title, content, imagePath });
    
    // Render the page with success message
    res.render('blogpage', {
      title: 'Create Blog Post',
      successMessage: 'Your blog post has been published successfully!',
      errorMessage: null
    });
    
  } catch (error) {
    console.error('Error creating blog post:', error);
    
    // Render the page with error message
    res.render('blogpage', {
      title: 'Create Blog Post',
      successMessage: null,
      errorMessage: 'Error creating blog post: ' + error.message
    });
  }
});

// Error handling middleware for Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.render('blogpage', {
        title: 'Create Blog Post',
        successMessage: null,
        errorMessage: 'File size too large. Maximum size is 5MB.'
      });
    }
  } else if (error) {
    return res.render('blogpage', {
      title: 'Create Blog Post',
      successMessage: null,
      errorMessage: error.message
    });
  }
  next();
});

module.exports = router;