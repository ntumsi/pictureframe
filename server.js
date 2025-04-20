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

// Serve uploads folder explicitly
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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
  fs.readdir(UPLOADS_FOLDER, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve images' });
    }
    
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        id: path.parse(file).name,
        name: file,
        path: `/uploads/${file}`,
        url: `/uploads/${file}`
      }));
    
    res.json(images);
  });
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  
  res.json({
    id: path.parse(req.file.filename).name,
    name: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    url: `/uploads/${req.file.filename}`
  });
});

// Delete image
app.delete('/api/images/:id', (req, res) => {
  const files = fs.readdirSync(UPLOADS_FOLDER);
  const file = files.find(file => file.startsWith(req.params.id));
  
  if (!file) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  const filePath = path.join(UPLOADS_FOLDER, file);
  
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
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