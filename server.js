const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

const { initSchema } = require('./db/schema');
const pool = require('./db/pool');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const sectionRoutes = require('./routes/sections');
const pdfRoutes = require('./routes/pdfs');
const contentRoutes = require('./routes/contents');
const paymentRoutes = require('./routes/payment');
const reviewRoutes = require('./routes/reviews');
const blogRoutes = require('./routes/blogs');
const settingsRoutes = require('./routes/settings');
const testRoutes = require('./routes/tests');
const testAttemptRoutes = require('./routes/testAttempts');
const faqRoutes = require('./routes/faqs');
const medicineRoutes = require('./routes/medicines');
const knowledgeCategoryRoutes = require('./routes/knowledgeCategories');
const knowledgeSubcategoryRoutes = require('./routes/knowledgeSubcategories');
const articleRoutes = require('./routes/articles');
const diseaseRoutes = require('./routes/diseases');
const vaccineRoutes = require('./routes/vaccines');
const breedRoutes = require('./routes/breeds');
const procedureRoutes = require('./routes/procedures');
const diagnosticTestRoutes = require('./routes/diagnosticTests');
const noteRoutes = require('./routes/notes');
const noteCategoryRoutes = require('./routes/noteCategories');
const noteSubcategoryRoutes = require('./routes/noteSubcategories');
const notePageRoutes = require('./routes/notePages');
const mcqRoutes = require('./routes/mcqs');
const mediaRoutes = require('./routes/media');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');
const seoRoutes = require('./routes/seo');
const chatRoutes = require('./routes/chat');
const creditRoutes = require('./routes/credits');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  validate: { xForwardedForHeader: false }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: function(res, path, stat) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Serve React build
const clientDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDistPath, {
  maxAge: 0,
  etag: false,
  lastModified: false
}));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/test-attempts', testAttemptRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/knowledge-categories', knowledgeCategoryRoutes);
app.use('/api/knowledge-subcategories', knowledgeSubcategoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/breeds', breedRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/diagnostic-tests', diagnosticTestRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/note-categories', noteCategoryRoutes);
app.use('/api/note-subcategories', noteSubcategoryRoutes);
app.use('/api/note-pages', notePageRoutes);
app.use('/api/mcqs', mcqRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/credits', creditRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'Error', database: 'Disconnected', error: err.message });
  }
});

app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_WEB_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  });
});

// Legacy routes for old frontend pages
app.get('/medicines', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'medicines.html'));
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'blog-view.html'));
});

// Legacy routes for notes pages
app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'notes.html'));
});

app.get('/notes/:categorySlug/:pageSlug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'note-view.html'));
});

app.get('/notes/:categorySlug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'note-category.html'));
});

// React SPA catch-all - serve index.html for all non-API routes
app.get(/^\/(?!api\/).*/, (req, res) => {
  const reactIndex = path.join(clientDistPath, 'index.html');
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  
  // Try React build first, fall back to public
  res.sendFile(reactIndex, (err) => {
    if (err) {
      res.sendFile(publicIndex);
    }
  });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');
    await initSchema();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`VetCrack server running on port ${PORT}`);
  });
}

start();
