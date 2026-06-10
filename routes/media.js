const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', mediaController.getMedia);
router.get('/:id', mediaController.getMediaById);
router.post('/', verifyToken, isAdmin, mediaController.uploadMedia);
router.delete('/:id', verifyToken, isAdmin, mediaController.deleteMedia);

module.exports = router;
