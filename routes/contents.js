const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const contentController = require('../controllers/contentController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

const ASSETS_DIR = '/var/www/vetcrack/assets';

const contentStorage = multer.diskStorage({
  destination: ASSETS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `content_${Date.now()}${ext}`);
  }
});

const contentUpload = multer({
  storage: contentStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|webm|ogg|avi|mov|pdf|jpg|jpeg|png|gif|webp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

router.post('/add', verifyToken, isAdmin, contentUpload.single('file'), contentController.addContent);
router.get('/:sectionId', contentController.getContents);
router.put('/:id', verifyToken, isAdmin, contentController.updateContent);
router.delete('/:id', verifyToken, isAdmin, contentController.deleteContent);

module.exports = router;
