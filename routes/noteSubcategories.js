const express = require('express');
const router = express.Router();
const noteSubcategoryController = require('../controllers/noteSubcategoryController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', noteSubcategoryController.getSubcategories);
router.get('/:categorySlug/:slug', noteSubcategoryController.getSubcategoryBySlug);
router.post('/', verifyToken, isAdmin, noteSubcategoryController.createSubcategory);
router.put('/:id', verifyToken, isAdmin, noteSubcategoryController.updateSubcategory);
router.delete('/:id', verifyToken, isAdmin, noteSubcategoryController.deleteSubcategory);

module.exports = router;
