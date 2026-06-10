const express = require('express');
const router = express.Router();
const noteCategoryController = require('../controllers/noteCategoryController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', noteCategoryController.getCategories);
router.get('/:slug', noteCategoryController.getCategoryBySlug);
router.post('/', verifyToken, isAdmin, noteCategoryController.createCategory);
router.put('/:id', verifyToken, isAdmin, noteCategoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, noteCategoryController.deleteCategory);

module.exports = router;
