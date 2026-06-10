const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.post('/create', verifyToken, isAdmin, sectionController.createSection);
router.get('/:courseId', sectionController.getSections);
router.get('/tree/:courseId', sectionController.getSectionTree);
router.put('/:id', verifyToken, isAdmin, sectionController.updateSection);
router.delete('/:id', verifyToken, isAdmin, sectionController.deleteSection);

module.exports = router;
