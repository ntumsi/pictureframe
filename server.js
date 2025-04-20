const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOADS_FOLDER = path.join(__dirname, 'public', 'uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    cb(null, `${uuidv4()}${fileExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Configure CORS to allow requests from other devices on the network
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploads folder explicitly - make sure it's accessible in both dev and prod
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// In production, handle the case where React tries to access uploads from the build directory
if (process.env.NODE_ENV === 'production') {
  app.use('/build/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
}

// For production, serve the React build files
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build folder
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Handle common static files that might get 404 errors
  const staticFiles = [
    'favicon.ico', 
    'manifest.json', 
    'logo192.png', 
    'logo512.png'
  ];
  
  staticFiles.forEach(file => {
    app.get(`/${file}`, (req, res) => {
      res.sendFile(path.join(__dirname, 'build', file));
    });
  });
}

// Get all images
app.get('/api/images', (req, res) => {
  // Log request for debugging
  console.log('API request received: GET /api/images');
  
  try {
    // Check if directory exists
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      console.log(`Creating uploads folder: ${UPLOADS_FOLDER}`);
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
      return res.json([]);
    }
    
    fs.readdir(UPLOADS_FOLDER, (err, files) => {
      if (err) {
        console.error('Error reading uploads folder:', err);
        return res.json([]); // Return empty array instead of error for better client resilience
      }
      
      // Ensure files is an array
      if (!Array.isArray(files)) {
        console.warn('files is not an array:', files);
        return res.json([]);
      }
      
      const images = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          id: path.parse(file).name,
          name: file,
          path: `/uploads/${file}`,
          url: `/uploads/${file}`
        }));
      
      console.log(`Returning ${images.length} images`);
      res.json(images);
    });
  } catch (error) {
    console.error('Unexpected error in /api/images:', error);
    res.json([]); // Return empty array instead of error
  }
});

// Upload image
app.post('/api/upload', (req, res) => {
  console.log('API request received: POST /api/upload');
  
  try {
    // Ensure uploads folder exists
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      console.log(`Creating uploads folder: ${UPLOADS_FOLDER}`);
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
    }
    
    // Use multer middleware with error handling
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        console.warn('No file in upload request');
        return res.status(400).json({ error: 'No image uploaded' });
      }
      
      console.log(`File uploaded successfully: ${req.file.filename}`);
      res.json({
        id: path.parse(req.file.filename).name,
        name: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        url: `/uploads/${req.file.filename}`
      });
    });
  } catch (error) {
    console.error('Unexpected error in /api/upload:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Delete image
app.delete('/api/images/:id', (req, res) => {
  console.log(`API request received: DELETE /api/images/${req.params.id}`);
  
  try {
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      console.warn('Uploads folder not found');
      return res.json({ success: false, error: 'No images directory' });
    }
    
    const files = fs.readdirSync(UPLOADS_FOLDER);
    if (!Array.isArray(files)) {
      console.warn('Files is not an array:', files);
      return res.json({ success: false, error: 'Directory read failed' });
    }
    
    const file = files.find(file => file.startsWith(req.params.id));
    
    if (!file) {
      console.warn(`Image with ID ${req.params.id} not found`);
      return res.json({ success: false, error: 'Image not found' });
    }
    
    const filePath = path.join(UPLOADS_FOLDER, file);
    
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted image: ${file}`);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting file:', err);
      res.json({ success: false, error: 'Failed to delete image' });
    }
  } catch (error) {
    console.error('Unexpected error in /api/images/:id DELETE:', error);
    res.json({ success: false, error: 'Server error' });
  }
});

// For production, serve the React app for any other routes
if (process.env.NODE_ENV === 'production') {
  // This catch-all route should come last, after all other API routes
  app.get('*', (req, res, next) => {
    // Skip API routes - they are handled separately
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // First try to serve the exact file if it exists in the build directory
    const filePath = path.join(__dirname, 'build', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    
    // Otherwise serve the index.html for client-side routing
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});