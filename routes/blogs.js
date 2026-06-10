const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.post('/', verifyToken, isAdmin, blogController.createBlog);
router.get('/', blogController.getBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/:id', blogController.getBlogById);
router.put('/:id', verifyToken, isAdmin, blogController.updateBlog);
router.delete('/:id', verifyToken, isAdmin, blogController.deleteBlog);

module.exports = router;
