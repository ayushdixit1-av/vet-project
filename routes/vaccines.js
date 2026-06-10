const express = require('express');
const router = express.Router();
const vaccineController = require('../controllers/vaccineController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', vaccineController.getVaccines);
router.get('/search', vaccineController.searchVaccines);
router.get('/:slug', vaccineController.getVaccineBySlug);
router.post('/', verifyToken, isAdmin, vaccineController.createVaccine);
router.put('/:id', verifyToken, isAdmin, vaccineController.updateVaccine);
router.delete('/:id', verifyToken, isAdmin, vaccineController.deleteVaccine);

module.exports = router;
