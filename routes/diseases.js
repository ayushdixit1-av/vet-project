const express = require('express');
const router = express.Router();
const diseaseController = require('../controllers/diseaseController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', diseaseController.getDiseases);
router.get('/popular', diseaseController.getPopularDiseases);
router.get('/search', diseaseController.searchDiseases);
router.get('/:slug/related', diseaseController.getRelatedDiseases);
router.get('/:slug', diseaseController.getDiseaseBySlug);
router.post('/', verifyToken, isAdmin, diseaseController.createDisease);
router.put('/:id', verifyToken, isAdmin, diseaseController.updateDisease);
router.delete('/:id', verifyToken, isAdmin, diseaseController.deleteDisease);

module.exports = router;
