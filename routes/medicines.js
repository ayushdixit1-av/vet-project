const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', medicineController.getMedicines);
router.get('/:id', medicineController.getMedicineById);
router.post('/', verifyToken, isAdmin, medicineController.createMedicine);
router.put('/:id', verifyToken, isAdmin, medicineController.updateMedicine);
router.delete('/:id', verifyToken, isAdmin, medicineController.deleteMedicine);

module.exports = router;
