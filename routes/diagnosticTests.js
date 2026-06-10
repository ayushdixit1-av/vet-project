const express = require('express');
const router = express.Router();
const diagnosticTestController = require('../controllers/diagnosticTestController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', diagnosticTestController.getTests);
router.get('/search', diagnosticTestController.searchTests);
router.get('/:slug', diagnosticTestController.getTestBySlug);
router.post('/', verifyToken, isAdmin, diagnosticTestController.createTest);
router.put('/:id', verifyToken, isAdmin, diagnosticTestController.updateTest);
router.delete('/:id', verifyToken, isAdmin, diagnosticTestController.deleteTest);

module.exports = router;
