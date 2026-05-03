'use strict';

// Receita base do usuário A (para ser favoritada pelo usuário B)
const receitaParaFavoritar = {
  nome: 'Bolo de Chocolate',
  ingredientes: ['farinha', 'açúcar', 'chocolate', 'ovos'],
  modoPreparo: 'Misture todos os ingredientes e leve ao forno por 40 minutos.',
  nivelDificuldade: 'Media',
};

// ─── RN039–RN041 – EP: casos de favoritar ────────────────────────────────────
// CT058: favoritar receita de outro → 200
// CT059: favoritar receita própria → 403
// CT060: favoritar mesma receita duas vezes → 409
// CT061: favoritar receita inexistente → 404
// CT062: favoritar sem token → 401

const respostaFavoritarSucesso = {
  status: 200,
  message: 'Receita favoritada com sucesso',
};

const respostaFavoritarPropria = {
  status: 403,
  expectedErrorMessage: 'Não é permitido favoritar sua própria receita',
};

const respostaFavoritarDuplicado = {
  status: 409,
  expectedErrorMessage: 'Receita já favoritada',
};

const respostaFavoritarInexistente = {
  status: 404,
  expectedErrorMessage: 'Registro não encontrado',
};

const respostaFavoritarSemAuth = {
  status: 401,
};

// ID fixo para receita inexistente
const idReceitaInexistente = '00000000-0000-0000-0000-000000000000';

module.exports = {
  receitaParaFavoritar,
  respostaFavoritarSucesso,
  respostaFavoritarPropria,
  respostaFavoritarDuplicado,
  respostaFavoritarInexistente,
  respostaFavoritarSemAuth,
  idReceitaInexistente,
};
