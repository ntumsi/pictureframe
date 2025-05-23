const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOADS_FOLDER = path.join(__dirname, 'public', 'uploads');

// Create uploads folder if it doesn't exist with proper permissions
if (!fs.existsSync(UPLOADS_FOLDER)) {
  console.log(`Creating uploads folder: ${UPLOADS_FOLDER}`);
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true, mode: 0o755 });
} else {
  // Ensure the uploads folder has the right permissions
  try {
    fs.chmodSync(UPLOADS_FOLDER, 0o755);
    console.log(`Updated permissions for uploads folder: ${UPLOADS_FOLDER}`);
  } catch (err) {
    console.error(`Could not set permissions on uploads folder: ${err.message}`);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads folder exists before saving
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      console.log(`Creating uploads folder on demand: ${UPLOADS_FOLDER}`);
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true, mode: 0o755 });
    }
    
    console.log(`Storage destination: ${UPLOADS_FOLDER}`);
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    // Use a more reliable filename pattern
    console.log('Original filename:', file.originalname);
    const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uuid = uuidv4();
    console.log(`Generated UUID: ${uuid}, extension: ${fileExt}`);
    cb(null, `${uuid}${fileExt}`);
  }
});

// Set up multer with more permissive config
const upload = multer({
  storage,
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB limit
    fieldSize: 25 * 1024 * 1024, // 25MB field size limit
    files: 5 // Allow up to 5 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log('Upload file check:', file.originalname);
    console.log('Mimetype:', file.mimetype, 'Valid:', mimetype);
    console.log('Extension:', path.extname(file.originalname).toLowerCase(), 'Valid:', extname);
    
    if (extname || mimetype) {
      // Allow if either the extension or mimetype is valid
      return cb(null, true);
    } else {
      cb(new Error(`Only image files are allowed! Got: ${file.mimetype}`));
    }
  }
});

// Log the NODE_ENV for debugging
console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode with PID ${process.pid}`);

// Configure CORS to allow requests from other devices on the network
app.use(cors({
  origin: function (origin, callback) {
    // Allow any origin - more permissive for dual-server mode
    callback(null, true);
  },
  credentials: false // Don't send the Access-Control-Allow-Credentials header
}));

// Add server identification header
app.use((req, res, next) => {
  res.setHeader('X-Server', 'PictureFrame/1.0');
  res.setHeader('X-Server-PID', process.pid);
  next();
});

// Let the CORS middleware handle OPTIONS requests automatically
app.options('*', cors());

// Debug middleware for all API routes - place this BEFORE API routes
app.use('/api/*', (req, res, next) => {
  console.log(`API REQUEST: ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  
  // Make sure this is correctly identified as an API route
  res.set('X-API-Route', 'true');
  
  // Add a specific header to API responses
  res.set('X-API-Server', 'picture-frame');
  
  next();
});

// Configure JSON parsing with error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      // Only attempt to parse if there's a body
      if (buf.length > 0) {
        JSON.parse(buf);
      }
    } catch (e) {
      console.error('Invalid JSON received:', e);
      // Don't throw here as it's difficult to handle properly
      // Instead, we'll handle malformed JSON in the routes
      req.invalidJson = true;
    }
  }
}));

// Middleware to check for invalid JSON after parsing
app.use((req, res, next) => {
  if (req.invalidJson) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// Ensure all JSON responses have the correct Content-Type header
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, body);
  };
  next();
});

// Always serve the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  // Set these options to ensure proper file serving
  maxAge: '1d',       // Cache for 1 day
  etag: true,         // Use ETags for caching
  lastModified: true, // Send Last-Modified headers
  fallthrough: true   // Try the next middleware if file not found
}));

// Always serve some common static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Setup for production mode
const isProduction = process.env.NODE_ENV === 'production';
const hasBuildFolder = fs.existsSync(path.join(__dirname, 'build'));

// If we're in production mode OR the build folder exists, serve files from build
if (isProduction || hasBuildFolder) {
  console.log('Serving static files from build folder');
  
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
      const filePath = path.join(__dirname, 'build', file);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        const publicPath = path.join(__dirname, 'public', file);
        if (fs.existsSync(publicPath)) {
          res.sendFile(publicPath);
        } else {
          res.status(404).send('File not found');
        }
      }
    });
  });
}

// Get all images
app.get('/api/images', (req, res) => {
  // Log request for debugging
  console.log('API request received: GET /api/images');
  console.log('Request headers:', req.headers);
  
  try {
    // Check if directory exists
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      console.log(`Creating uploads folder: ${UPLOADS_FOLDER}`);
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
      return res.json([]);
    }
    
    console.log('Uploads folder exists:', fs.existsSync(UPLOADS_FOLDER));
    console.log('Uploads folder path:', UPLOADS_FOLDER);
    
    // List all files in the uploads folder
    fs.readdir(UPLOADS_FOLDER, (err, files) => {
      if (err) {
        console.error('Error reading uploads folder:', err);
        return res.json([]); // Return empty array instead of error for better client resilience
      }
      
      console.log('All files in uploads folder:', files);
      
      // Ensure files is an array
      if (!Array.isArray(files)) {
        console.warn('files is not an array:', files);
        return res.json([]);
      }
      
      // Filter and map files to image objects
      const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      console.log('Image files found:', imageFiles);
      
      // Get base URL for images
      const protocol = req.secure ? 'https' : 'http';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const images = imageFiles.map(file => {
        const urlPath = `/uploads/${file}`;
        
        const imageObject = {
          id: path.parse(file).name,
          name: file,
          path: urlPath,
          url: urlPath, // Keep relative path as primary URL
          fullUrl: `${baseUrl}${urlPath}` // Also provide the full URL as an option
        };
        
        // Verify each image exists
        const fullPath = path.join(UPLOADS_FOLDER, file);
        const fileExists = fs.existsSync(fullPath);
        console.log(`Image ${file} - full path: ${fullPath}, exists: ${fileExists}`);
        
        return imageObject;
      });
      
      console.log(`Returning ${images.length} images:`, images);
      res.setHeader('Content-Type', 'application/json');
      res.json(images);
    });
  } catch (error) {
    console.error('Unexpected error in /api/images:', error);
    res.json([]); // Return empty array instead of error
  }
});

// Upload image - separated into its own route
app.post('/api/upload', (req, res) => {
  console.log('API request received: POST /api/upload');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Set appropriate headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Ensure uploads folder exists
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      console.log(`Creating uploads folder: ${UPLOADS_FOLDER}`);
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true, mode: 0o755 });
    }
    
    console.log('Uploads folder path:', UPLOADS_FOLDER);
    console.log('Uploads folder exists:', fs.existsSync(UPLOADS_FOLDER));
    
    // Handle non-multipart requests
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      console.warn('Upload request has incorrect Content-Type:', req.headers['content-type']);
      return res.status(400).json({ 
        error: 'Content-Type must be multipart/form-data',
        received: req.headers['content-type'] || 'undefined'
      });
    }
    
    // Use multer middleware with error handling
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Error processing upload:', err);
        // Handle multer errors
        if (err instanceof multer.MulterError) {
          // A multer error occurred
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large (max 25MB)' });
          }
          return res.status(400).json({ error: `Upload error: ${err.code}` });
        }
        
        return res.status(400).json({ error: err.message });
      }
      
      console.log('Upload processed');
      
      // Check if file was provided
      if (!req.file) {
        console.warn('No file found in request');
        return res.status(400).json({ error: 'No image found in request' });
      }
      
      // Get the file details
      const urlPath = `/uploads/${req.file.filename}`;
      
      // Build full URL
      const protocol = req.secure ? 'https' : 'http';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const fileDetails = {
        id: path.parse(req.file.filename).name,
        name: req.file.filename,
        path: urlPath,
        url: urlPath,
        fullUrl: `${baseUrl}${urlPath}`
      };
      
      console.log(`File uploaded successfully: ${req.file.filename}`);
      console.log('File details:', fileDetails);
      console.log('File size:', req.file.size);
      console.log('File saved to:', req.file.path);
      
      // Verify the file exists and is accessible
      const fullPath = path.join(UPLOADS_FOLDER, req.file.filename);
      const fileExists = fs.existsSync(fullPath);
      console.log('Full file path:', fullPath);
      console.log('File exists:', fileExists);
      
      // Set file permissions
      try {
        fs.chmodSync(fullPath, 0o644);
        console.log(`Set permissions for uploaded file: ${fullPath}`);
      } catch (err) {
        console.error(`Could not set permissions on file: ${err.message}`);
      }
      
      if (!fileExists) {
        return res.status(500).json({ 
          error: 'File was not saved correctly',
          path: fullPath
        });
      }
      
      res.status(200).json(fileDetails);
    });
  } catch (error) {
    console.error('Unexpected error in /api/upload:', error);
    res.status(500).json({ 
      error: 'Server error during upload',
      message: error.message
    });
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

// IMPORTANT: API routes are defined below

// Serve the React app for any other routes when build folder exists
if (isProduction || hasBuildFolder) {
  // Add a fallback for API routes that aren't handled
  app.all('/api/*', (req, res, next) => {
    // Only proceed to this fallback if no previous route handled it
    console.log(`WARNING: Unhandled API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  });

  // This catch-all route should come last, after all other routes
  app.get('*', (req, res, next) => {
    // Log the request for debugging
    console.log(`Catch-all route handling: ${req.path}`);
    
    // Skip API routes completely - they should have been handled above
    if (req.path.startsWith('/api/')) {
      console.warn(`API route reached catch-all handler: ${req.path}`);
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // First try to serve the exact file if it exists in the build directory
    const filePath = path.join(__dirname, 'build', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      console.log(`Serving file: ${filePath}`);
      return res.sendFile(filePath);
    }
    
    // Check if it's a known client-side route
    if (['/manage', '/'].includes(req.path)) {
      console.log(`Serving index.html for client-side route: ${req.path}`);
      return res.sendFile(path.join(__dirname, 'build', 'index.html'));
    }
    
    // For other routes, try to be helpful
    console.log(`Resource not found: ${req.path}`);
    if (req.accepts('html')) {
      // Otherwise serve the index.html for client-side routing
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    } else {
      res.status(404).send('Resource not found');
    }
  });
}

// Bind to all network interfaces (0.0.0.0) to allow external access
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  
  // Try to get the machine's IP address for LAN access
  try {
    const networkInterfaces = require('os').networkInterfaces();
    const lanIp = Object.values(networkInterfaces)
      .flat()
      .filter(details => details.family === 'IPv4' && !details.internal)
      .map(details => details.address)[0];
    
    if (lanIp) {
      console.log(`Network access: http://${lanIp}:${PORT}`);
    }
  } catch (err) {
    console.log('Could not determine network IP address');
  }
});