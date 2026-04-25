const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticate } = require('../middlewares/auth');

router.get('/recipes', authenticate, recipeController.list);
router.post('/recipes', authenticate, recipeController.create);
router.put('/recipes/:id', authenticate, recipeController.update);
router.delete('/recipes/:id', authenticate, recipeController.remove);
router.post('/recipes/:id/favorite', authenticate, recipeController.favorite);

module.exports = router;
