const express = require('express');
const router = express.Router();
const knowledgeSubcategoryController = require('../controllers/knowledgeSubcategoryController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', knowledgeSubcategoryController.getSubcategories);
router.get('/by-category/:categorySlug', knowledgeSubcategoryController.getSubcategoriesByCategory);
router.get('/:slug', knowledgeSubcategoryController.getSubcategoryBySlug);
router.post('/', verifyToken, isAdmin, knowledgeSubcategoryController.createSubcategory);
router.put('/:id', verifyToken, isAdmin, knowledgeSubcategoryController.updateSubcategory);
router.delete('/:id', verifyToken, isAdmin, knowledgeSubcategoryController.deleteSubcategory);

module.exports = router;
