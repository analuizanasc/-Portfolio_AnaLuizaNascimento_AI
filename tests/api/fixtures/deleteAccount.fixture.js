'use strict';

// Usuários base para testes de exclusão de conta
const usuarioA = { nome: 'User A', email: 'a@email.com', senha: 'senha123' };
const usuarioB = { nome: 'User B', email: 'b@email.com', senha: 'senha123' };

// Receita usada nos testes de cascade
const receitaCascata = {
  nome: 'Bolo de Cenoura',
  ingredientes: ['cenoura', 'farinha', 'ovos'],
  modoPreparo: 'Bata tudo no liquidificador e leve ao forno por 40 minutos a 180 graus.',
  nivelDificuldade: 'Facil',
};

// ─── RN010 – EP: apenas o próprio usuário pode excluir a conta ───────────────
// CT017: exclusão com token válido
const respostaExclusaoSucesso = {
  status: 200,
  message: 'Conta excluída com sucesso',
};

// CT018: exclusão sem token
const respostaExclusaoSemToken = {
  status: 401,
};

// ─── RN012 – EP: receitas permanecem com autor "Desconhecido" ────────────────
// CT020
const respostaAutorDesconhecido = {
  autorNome: 'Desconhecido',
};

// ─── RN013 – EP: token válido após exclusão retorna 404 ──────────────────────
// CT021
const respostaTokenAposExclusao = {
  status: 404,
  expectedErrorMessage: 'Registro não encontrado',
};

module.exports = {
  usuarioA,
  usuarioB,
  receitaCascata,
  respostaExclusaoSucesso,
  respostaExclusaoSemToken,
  respostaAutorDesconhecido,
  respostaTokenAposExclusao,
};
