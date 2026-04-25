const recipeService = require('../services/recipeService');
const { validateCreate } = require('../validators/recipeValidator');

const create = (req, res) => {
  const errors = validateCreate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const result = recipeService.create(req.body, req.userId);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

const remove = (req, res) => {
  const result = recipeService.remove(req.params.id, req.userId);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

const list = (req, res) => {
  const result = recipeService.list(req.query, req.userId);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

const favorite = (req, res) => {
  const result = recipeService.favorite(req.params.id, req.userId);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

const update = (req, res) => {
  const errors = validateCreate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  const result = recipeService.update(req.params.id, req.body, req.userId);
  if (result.errors) {
    return res.status(result.status).json({ errors: result.errors });
  }
  return res.status(result.status).json(result.data);
};

module.exports = { create, update, remove, list, favorite };
