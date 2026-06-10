const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.post('/create', verifyToken, isAdmin, testController.createTest);
router.get('/', testController.getTests);
router.get('/:id', testController.getTestById);
router.put('/:id', verifyToken, isAdmin, testController.updateTest);
router.delete('/:id', verifyToken, isAdmin, testController.deleteTest);

module.exports = router;