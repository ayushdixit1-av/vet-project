const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const settingsController = require('../controllers/settingsController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

const ASSETS_DIR = '/var/www/vetcrack/assets';

const storage = multer.diskStorage({
  destination: ASSETS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `founder_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

const courseStorage = multer.diskStorage({
  destination: ASSETS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `course_${Date.now()}${ext}`);
  }
});
const courseUpload = multer({
  storage: courseStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  }
});

router.get('/founder', settingsController.getFounder);
router.put('/founder', verifyToken, isAdmin, settingsController.updateFounder);
router.post('/upload', verifyToken, isAdmin, upload.single('image'), settingsController.uploadImage);
router.post('/upload-course-thumbnail', verifyToken, isAdmin, courseUpload.single('thumbnail'), settingsController.uploadCourseThumbnail);

module.exports = router;