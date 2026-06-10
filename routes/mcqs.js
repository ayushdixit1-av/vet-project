const express = require('express');
const router = express.Router();
const mcqController = require('../controllers/mcqController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', mcqController.getMcqs);
router.get('/article/:articleId', mcqController.getMcqsByArticle);
router.get('/category/:category', mcqController.getMcqsByCategory);
router.get('/:id', mcqController.getMcqById);
router.post('/', verifyToken, isAdmin, mcqController.createMcq);
router.put('/:id', verifyToken, isAdmin, mcqController.updateMcq);
router.delete('/:id', verifyToken, isAdmin, mcqController.deleteMcq);

module.exports = router;
