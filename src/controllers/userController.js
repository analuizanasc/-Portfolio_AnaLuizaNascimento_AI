const userService = require('../services/userService');
const { validateRegister, validateLogin } = require('../validators/userValidator');

const register = async (req, res) => {
  const errors = validateRegister(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const result = await userService.register(req.body);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

const login = async (req, res) => {
  const errors = validateLogin(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const result = await userService.login(req.body);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

const deleteAccount = (req, res) => {
  const result = userService.deleteAccount(req.userId);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

module.exports = { register, login, deleteAccount };
