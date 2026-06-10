const express = require('express');
const router = express.Router();
const knowledgeCategoryController = require('../controllers/knowledgeCategoryController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', knowledgeCategoryController.getCategories);
router.get('/tree', knowledgeCategoryController.getCategoryTree);
router.get('/:slug', knowledgeCategoryController.getCategoryBySlug);
router.post('/', verifyToken, isAdmin, knowledgeCategoryController.createCategory);
router.put('/:id', verifyToken, isAdmin, knowledgeCategoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, knowledgeCategoryController.deleteCategory);

module.exports = router;
