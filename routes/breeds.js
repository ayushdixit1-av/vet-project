const express = require('express');
const router = express.Router();
const breedController = require('../controllers/breedController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

router.get('/', breedController.getBreeds);
router.get('/search', breedController.searchBreeds);
router.get('/:slug', breedController.getBreedBySlug);
router.post('/', verifyToken, isAdmin, breedController.createBreed);
router.put('/:id', verifyToken, isAdmin, breedController.updateBreed);
router.delete('/:id', verifyToken, isAdmin, breedController.deleteBreed);

module.exports = router;
