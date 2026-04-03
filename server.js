const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOADS_FOLDER = path.join(__dirname, 'public', 'uploads');
const CONFIG_FILE = path.join(__dirname, 'public', 'config.json');

// ─── Default configuration ───────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  pin: '',
  slideshow: {
    interval: 10,
    transition: 'fade',
    shuffle: false,
    showCalendar: true,
    background: 'blur',
    backgroundColor: '#000000',
    frame: 'classic-wood',
    mat: true,
    matColor: '#ffffff'
  },
  albums: {
    default: { name: 'All Photos' }
  },
  activeAlbum: 'default'
};

// ─── Config helpers ──────────────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const saved = JSON.parse(raw);
      // Merge with defaults so new fields are always present
      return {
        ...DEFAULT_CONFIG,
        ...saved,
        slideshow: { ...DEFAULT_CONFIG.slideshow, ...(saved.slideshow || {}) },
        albums: { ...DEFAULT_CONFIG.albums, ...(saved.albums || {}) }
      };
    }
  } catch (err) {
    console.error('Error loading config:', err.message);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving config:', err.message);
    return false;
  }
}

// Initialize config on startup
let config = loadConfig();
if (!fs.existsSync(CONFIG_FILE)) {
  saveConfig(config);
}

// ─── Uploads folder setup ────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
}

ensureDir(UPLOADS_FOLDER);
// Ensure the default album folder exists
ensureDir(path.join(UPLOADS_FOLDER, 'default'));

// Migrate any existing loose images into the default album folder
try {
  const looseFiles = fs.readdirSync(UPLOADS_FOLDER).filter(f => {
    const fullPath = path.join(UPLOADS_FOLDER, f);
    return fs.statSync(fullPath).isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(f);
  });
  if (looseFiles.length > 0) {
    console.log(`Migrating ${looseFiles.length} loose images into default album...`);
    for (const file of looseFiles) {
      const src = path.join(UPLOADS_FOLDER, file);
      const dest = path.join(UPLOADS_FOLDER, 'default', file);
      fs.renameSync(src, dest);
    }
    console.log('Migration complete.');
  }
} catch (err) {
  console.error('Error migrating loose files:', err.message);
}

// ─── Multer configuration ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const album = req.params.album || req.body.album || 'default';
    const albumDir = path.join(UPLOADS_FOLDER, album);
    ensureDir(albumDir);
    cb(null, albumDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uuid = uuidv4();
    cb(null, `${uuid}${fileExt}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    fieldSize: 25 * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error(`Only image files are allowed! Got: ${file.mimetype}`));
  }
});

console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode with PID ${process.pid}`);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: false
}));

app.use((req, res, next) => {
  res.setHeader('X-Server', 'PictureFrame/2.0');
  res.setHeader('X-Server-PID', process.pid);
  next();
});

app.options('*', cors());

app.use('/api/*', (req, res, next) => {
  console.log(`API REQUEST: ${req.method} ${req.originalUrl}`);
  res.set('X-API-Route', 'true');
  res.set('X-API-Server', 'picture-frame');
  next();
});

app.use(express.json());

// Ensure all JSON responses have correct Content-Type
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, body);
  };
  next();
});

// PIN verification middleware for protected routes
function requirePin(req, res, next) {
  config = loadConfig(); // reload in case it changed
  if (!config.pin) {
    return next(); // no PIN set, allow access
  }
  const providedPin = req.headers['x-pin'] || req.query.pin;
  if (providedPin === config.pin) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid PIN', requiresPin: true });
}

// ─── Static file serving ─────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  fallthrough: true
}));

const isProduction = process.env.NODE_ENV === 'production';
const hasBuildFolder = fs.existsSync(path.join(__dirname, 'build'));

// IMPORTANT: serve build/ BEFORE public/ so that build/index.html (with JS bundles)
// takes priority over public/index.html (the CRA template without bundles)
if (isProduction || hasBuildFolder) {
  console.log('Serving static files from build folder');
  app.use(express.static(path.join(__dirname, 'build')));
}

// public/ is served second — picks up uploads, vendor-prefixes.css, etc.
// but build/index.html wins over public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// ─── Config API ──────────────────────────────────────────────────────────────

// Get config (public — PIN is stripped)
app.get('/api/config', (req, res) => {
  config = loadConfig();
  const publicConfig = { ...config, pin: undefined, hasPin: !!config.pin };
  res.json(publicConfig);
});

// Update config (protected)
app.put('/api/config', requirePin, (req, res) => {
  config = loadConfig();
  const updates = req.body;

  // Allow updating slideshow settings
  if (updates.slideshow) {
    config.slideshow = { ...config.slideshow, ...updates.slideshow };
  }
  // Allow updating active album
  if (updates.activeAlbum !== undefined) {
    config.activeAlbum = updates.activeAlbum;
  }

  if (saveConfig(config)) {
    const publicConfig = { ...config, pin: undefined, hasPin: !!config.pin };
    res.json(publicConfig);
  } else {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Verify PIN
app.post('/api/pin/verify', (req, res) => {
  config = loadConfig();
  if (!config.pin) {
    return res.json({ valid: true, hasPin: false });
  }
  const { pin } = req.body;
  if (pin === config.pin) {
    return res.json({ valid: true, hasPin: true });
  }
  return res.json({ valid: false, hasPin: true });
});

// Set/change PIN (protected — requires current PIN if one exists)
app.put('/api/pin', requirePin, (req, res) => {
  config = loadConfig();
  const { newPin } = req.body;
  config.pin = newPin || '';
  if (saveConfig(config)) {
    res.json({ success: true, hasPin: !!config.pin });
  } else {
    res.status(500).json({ error: 'Failed to save PIN' });
  }
});

// ─── Album API ───────────────────────────────────────────────────────────────

// List albums
app.get('/api/albums', (req, res) => {
  config = loadConfig();
  try {
    const albumDirs = fs.readdirSync(UPLOADS_FOLDER).filter(f => {
      return fs.statSync(path.join(UPLOADS_FOLDER, f)).isDirectory();
    });

    const albums = albumDirs.map(dir => {
      const albumConfig = config.albums[dir] || { name: dir };
      const files = fs.readdirSync(path.join(UPLOADS_FOLDER, dir))
        .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
      return {
        id: dir,
        name: albumConfig.name,
        imageCount: files.length,
        isActive: config.activeAlbum === dir
      };
    });

    res.json(albums);
  } catch (err) {
    console.error('Error listing albums:', err);
    res.json([]);
  }
});

// Create album (protected)
app.post('/api/albums', requirePin, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Album name is required' });
  }

  // Create a safe directory name from the album name
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!id) {
    return res.status(400).json({ error: 'Invalid album name' });
  }

  const albumDir = path.join(UPLOADS_FOLDER, id);
  if (fs.existsSync(albumDir)) {
    return res.status(409).json({ error: 'Album already exists' });
  }

  ensureDir(albumDir);
  config = loadConfig();
  config.albums[id] = { name };
  saveConfig(config);

  res.json({ id, name, imageCount: 0, isActive: false });
});

// Rename album (protected)
app.put('/api/albums/:id', requirePin, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (id === 'default' && !name) {
    return res.status(400).json({ error: 'Cannot modify default album without a name' });
  }

  config = loadConfig();
  if (!config.albums[id]) {
    config.albums[id] = {};
  }
  config.albums[id].name = name;
  saveConfig(config);

  res.json({ id, name });
});

// Delete album (protected) — moves images to default
app.delete('/api/albums/:id', requirePin, (req, res) => {
  const { id } = req.params;

  if (id === 'default') {
    return res.status(400).json({ error: 'Cannot delete the default album' });
  }

  const albumDir = path.join(UPLOADS_FOLDER, id);
  if (!fs.existsSync(albumDir)) {
    return res.status(404).json({ error: 'Album not found' });
  }

  // Move images to default album
  try {
    const files = fs.readdirSync(albumDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    const defaultDir = path.join(UPLOADS_FOLDER, 'default');
    ensureDir(defaultDir);
    for (const file of files) {
      fs.renameSync(path.join(albumDir, file), path.join(defaultDir, file));
    }
    fs.rmdirSync(albumDir);
  } catch (err) {
    console.error('Error deleting album:', err);
    return res.status(500).json({ error: 'Failed to delete album' });
  }

  config = loadConfig();
  delete config.albums[id];
  if (config.activeAlbum === id) {
    config.activeAlbum = 'default';
  }
  saveConfig(config);

  res.json({ success: true });
});

// ─── Image API ───────────────────────────────────────────────────────────────

// Get images (optionally filtered by album)
app.get('/api/images', (req, res) => {
  try {
    const album = req.query.album;
    const protocol = req.secure ? 'https' : 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    let allImages = [];

    // Determine which directories to scan
    let dirs;
    if (album && album !== 'all') {
      dirs = [album];
    } else {
      // Scan all album directories
      try {
        dirs = fs.readdirSync(UPLOADS_FOLDER).filter(f =>
          fs.statSync(path.join(UPLOADS_FOLDER, f)).isDirectory()
        );
      } catch (err) {
        dirs = ['default'];
      }
    }

    for (const dir of dirs) {
      const dirPath = path.join(UPLOADS_FOLDER, dir);
      if (!fs.existsSync(dirPath)) continue;

      try {
        const files = fs.readdirSync(dirPath)
          .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

        for (const file of files) {
          const urlPath = `/uploads/${dir}/${file}`;
          allImages.push({
            id: path.parse(file).name,
            name: file,
            album: dir,
            path: urlPath,
            url: urlPath,
            fullUrl: `${baseUrl}${urlPath}`
          });
        }
      } catch (err) {
        console.error(`Error reading album ${dir}:`, err);
      }
    }

    console.log(`Returning ${allImages.length} images`);
    res.json(allImages);
  } catch (error) {
    console.error('Unexpected error in /api/images:', error);
    res.json([]);
  }
});

// Upload image (with album support)
app.post('/api/upload', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, X-Pin');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Content-Type must be multipart/form-data',
        received: req.headers['content-type'] || 'undefined'
      });
    }

    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Error processing upload:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large (max 25MB)' });
          }
          return res.status(400).json({ error: `Upload error: ${err.code}` });
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image found in request' });
      }

      // Figure out which album the file landed in
      const album = req.body.album || 'default';
      const urlPath = `/uploads/${album}/${req.file.filename}`;

      const protocol = req.secure ? 'https' : 'http';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const fileDetails = {
        id: path.parse(req.file.filename).name,
        name: req.file.filename,
        album,
        path: urlPath,
        url: urlPath,
        fullUrl: `${baseUrl}${urlPath}`
      };

      // Set file permissions
      try {
        fs.chmodSync(req.file.path, 0o644);
      } catch (err) {
        console.error(`Could not set permissions on file: ${err.message}`);
      }

      console.log(`File uploaded to album "${album}": ${req.file.filename}`);
      res.status(200).json(fileDetails);
    });
  } catch (error) {
    console.error('Unexpected error in /api/upload:', error);
    res.status(500).json({ error: 'Server error during upload', message: error.message });
  }
});

// Delete image (searches across albums)
app.delete('/api/images/:id', (req, res) => {
  try {
    const album = req.query.album;
    let found = false;

    // If album specified, look there first
    const dirsToSearch = album ? [album] : [];

    // Also search all album dirs
    try {
      const allDirs = fs.readdirSync(UPLOADS_FOLDER).filter(f =>
        fs.statSync(path.join(UPLOADS_FOLDER, f)).isDirectory()
      );
      for (const dir of allDirs) {
        if (!dirsToSearch.includes(dir)) dirsToSearch.push(dir);
      }
    } catch (err) {
      // fallback
    }

    for (const dir of dirsToSearch) {
      const dirPath = path.join(UPLOADS_FOLDER, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = fs.readdirSync(dirPath);
      const file = files.find(f => f.startsWith(req.params.id));
      if (file) {
        fs.unlinkSync(path.join(dirPath, file));
        console.log(`Deleted image: ${dir}/${file}`);
        found = true;
        break;
      }
    }

    if (found) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Image not found' });
    }
  } catch (error) {
    console.error('Unexpected error in DELETE /api/images/:id:', error);
    res.json({ success: false, error: 'Server error' });
  }
});

// ─── Catch-all routes ────────────────────────────────────────────────────────
if (isProduction || hasBuildFolder) {
  app.all('/api/*', (req, res) => {
    console.log(`WARNING: Unhandled API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl, method: req.method });
  });

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    const filePath = path.join(__dirname, 'build', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }

    // Serve index.html for all client-side routes
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// ─── Start server ────────────────────────────────────────────────────────────
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);

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
