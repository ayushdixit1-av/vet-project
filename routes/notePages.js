const express = require('express');
const router = express.Router();
const notePageController = require('../controllers/notePageController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', notePageController.getPages);
router.get('/:id', verifyToken, notePageController.getPageById);
router.get('/:categorySlug/:slug', notePageController.getPageBySlug);
router.post('/', verifyToken, isAdmin, notePageController.createPage);
router.put('/:id', verifyToken, isAdmin, notePageController.updatePage);
router.delete('/:id', verifyToken, isAdmin, notePageController.deletePage);

module.exports = router;
