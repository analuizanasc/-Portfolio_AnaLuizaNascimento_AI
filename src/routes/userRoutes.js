const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');

router.post('/users', userController.register);
router.post('/login', userController.login);
router.delete('/users/me', authenticate, userController.deleteAccount);

module.exports = router;
