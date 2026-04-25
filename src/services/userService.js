const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const recipeModel = require('../models/recipeModel');

const JWT_SECRET = process.env.JWT_SECRET || 'recipe-secret-key';

const register = async (body) => {
  const nome = body.nome.trim();
  const email = body.email.trim();
  const senha = body.senha.trim();

  const existing = userModel.findByEmail(email);
  if (existing) {
    return { status: 409, errors: [{ field: 'email', message: 'E-mail já cadastrado' }] };
  }

  const hash = await bcrypt.hash(senha, 10);
  const user = userModel.create({ id: uuidv4(), nome, email, senha: hash });

  return { status: 201, data: { message: 'Cadastro realizado com sucesso', id: user.id } };
};

const login = async (body) => {
  const email = body.email.trim();
  const senha = body.senha.trim();

  const user = userModel.findByEmail(email);
  if (!user) {
    return { status: 401, errors: [{ field: 'email', message: 'E-mail não cadastrado' }] };
  }

  const valid = await bcrypt.compare(senha, user.senha);
  if (!valid) {
    return { status: 401, errors: [{ field: 'senha', message: 'Senha incorreta' }] };
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  return { status: 200, data: { token } };
};

const deleteAccount = (userId) => {
  const user = userModel.findById(userId);
  if (!user) {
    return { status: 404, errors: [{ field: 'id', message: 'Registro não encontrado' }] };
  }

  // Remove apenas os favoritos feitos pelo usuário em receitas de outros.
  // Receitas de autoria do usuário permanecem no sistema para que quem já
  // as havia favoritado continue tendo acesso a elas.
  recipeModel.removeFavoritesByUser(userId);
  userModel.remove(userId);

  return { status: 200, data: { message: 'Conta excluída com sucesso' } };
};

module.exports = { register, login, deleteAccount, JWT_SECRET };
