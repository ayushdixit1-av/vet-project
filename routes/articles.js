const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', articleController.getArticles);
router.get('/counts', articleController.getArticleCounts);
router.get('/featured', articleController.getFeaturedArticles);
router.get('/recent', articleController.getRecentArticles);
router.get('/search', articleController.searchArticles);
router.get('/by-category/:slug', articleController.getArticlesByCategory);
router.get('/by-subcategory/:slug', articleController.getArticlesBySubcategory);
router.get('/:slug/related', articleController.getRelatedArticles);
router.get('/:slug', articleController.getArticleBySlug);
router.post('/', verifyToken, isAdmin, articleController.createArticle);
router.put('/:id', verifyToken, isAdmin, articleController.updateArticle);
router.delete('/:id', verifyToken, isAdmin, articleController.deleteArticle);

module.exports = router;
