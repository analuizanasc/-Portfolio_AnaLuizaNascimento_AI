'use strict';

const request = require('supertest');
const app = require('../../../src/app');
const userModel = require('../../../src/models/userModel');
const recipeModel = require('../../../src/models/recipeModel');

/**
 * Reseta o estado in-memory entre testes.
 */
const limparEstado = () => {
  userModel.clear();
  recipeModel.clear();
};

/**
 * Cadastra um usuário e retorna o token JWT via login.
 * @param {{ nome: string, email: string, senha: string }} userData
 * @returns {Promise<string>} token JWT
 */
const criarUsuarioELogar = async (userData) => {
  await request(app).post('/users').send(userData);
  const res = await request(app)
    .post('/login')
    .send({ email: userData.email, senha: userData.senha });
  return res.body.token;
};

/**
 * Cadastra uma receita e retorna o id gerado.
 * @param {string} token
 * @param {object} recipeData
 * @returns {Promise<string>} id da receita
 */
const criarReceita = async (token, recipeData) => {
  await request(app)
    .post('/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send(recipeData);
  const receitas = recipeModel.findAll();
  return receitas[receitas.length - 1].id;
};

module.exports = {
  app,
  userModel,
  recipeModel,
  limparEstado,
  criarUsuarioELogar,
  criarReceita,
};
