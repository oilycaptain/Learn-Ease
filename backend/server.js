// backend/server.js
const express = require('express');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

// Try to mount optional routes only if they exist
let chatRoutes = null;
let fileRoutes = null;
try { chatRoutes = require('./routes/chat'); } catch {}
try { fileRoutes = require('./routes/files'); } catch {}

const app = express();

/**
 * DEV-FRIENDLY UNIVERSAL CORS
 * - Reflects the requesting Origin (e.g., http://localhost:5173)
 * - Allows credentials (Authorization header / cookies)
 * - Handles preflight (OPTIONS) for every route BEFORE anything else
 */
const allowOrigin = (origin) => {
  if (!origin) return true; // tools like curl/postman
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  return true; // relax for dev; lock down later if needed
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Vary', 'Origin'); // avoid cache poisoning by proxies/CDNs
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }
  if (req.method === 'OPTIONS') {
    // Preflight request — respond immediately with no body
    return res.sendStatus(204);
  }
  next();
});

// Body parser
app.use(express.json({ limit: '2mb' }));
// Serve uploaded files publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
if (chatRoutes) app.use('/api/chat', chatRoutes);
if (fileRoutes) app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve frontend in production (optional)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (_req, res) => res.sendFile(path.join(clientBuildPath, 'index.html')));
}

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
