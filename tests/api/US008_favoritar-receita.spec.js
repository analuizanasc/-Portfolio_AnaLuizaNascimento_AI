'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado, criarUsuarioELogar, criarReceita } = require('./helpers/setup');
const {
  receitaParaFavoritar,
  respostaFavoritarSucesso,
  respostaFavoritarPropria,
  respostaFavoritarDuplicado,
  respostaFavoritarInexistente,
  respostaFavoritarSemAuth,
  idReceitaInexistente,
} = require('./fixtures/favorites.fixture');

const usuarioA = { nome: 'User A', email: 'a@email.com', senha: 'senha123' };
const usuarioB = { nome: 'User B', email: 'b@email.com', senha: 'senha123' };

describe('US008 – Favoritar Receita | POST /recipes/:id/favorite', () => {
  let tokenA;
  let tokenB;
  let receitaIdA;

  beforeEach(async () => {
    limparEstado();
    tokenA = await criarUsuarioELogar(usuarioA);
    tokenB = await criarUsuarioELogar(usuarioB);
    receitaIdA = await criarReceita(tokenA, receitaParaFavoritar);
  });

  // ─── RN039 – EP: favoritar exige autenticação ─────────────────────────────
  // CT062
  it('[CT062] deve retornar 401 ao tentar favoritar sem autenticação', async () => {
    const res = await request(app).post(`/recipes/${receitaIdA}/favorite`);

    assert.strictEqual(res.status, respostaFavoritarSemAuth.status);
  });

  // ─── RN040 – EP: usuário não pode favoritar a própria receita ────────────
  // CT059
  it('[CT059] deve retornar 403 ao tentar favoritar a própria receita', async () => {
    const res = await request(app)
      .post(`/recipes/${receitaIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, respostaFavoritarPropria.status);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(respostaFavoritarPropria.expectedErrorMessage), `Esperava "${respostaFavoritarPropria.expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN039 – EP: favoritar receita de outro usuário ──────────────────────
  // CT058
  it('[CT058] deve retornar 200 ao favoritar receita de outro usuário', async () => {
    const res = await request(app)
      .post(`/recipes/${receitaIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, respostaFavoritarSucesso.status);
    assert.strictEqual(res.body.message, respostaFavoritarSucesso.message);
  });

  // ─── RN041 – EP: não permitir favoritar mesma receita duas vezes ─────────
  // CT060
  it('[CT060] deve retornar 409 ao tentar favoritar a mesma receita duas vezes', async () => {
    await request(app)
      .post(`/recipes/${receitaIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .post(`/recipes/${receitaIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, respostaFavoritarDuplicado.status);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(respostaFavoritarDuplicado.expectedErrorMessage), `Esperava "${respostaFavoritarDuplicado.expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── EP: receita inexistente retorna 404 ─────────────────────────────────
  // CT061
  it('[CT061] deve retornar 404 ao tentar favoritar receita inexistente', async () => {
    const res = await request(app)
      .post(`/recipes/${idReceitaInexistente}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, respostaFavoritarInexistente.status);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(respostaFavoritarInexistente.expectedErrorMessage), `Esperava "${respostaFavoritarInexistente.expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN042 – Transição de Estado: receita aparece no scope=me após favoritar
  // CT063
  // Estado inicial:  B não tem receitas no scope=me
  // Ação:            B favorita receita de A
  // Estado final:    receita de A aparece no scope=me de B com isFavorited=true
  it('[CT063] deve exibir receita favoritada no scope=me com isFavorited=true e dados do autor original', async () => {
    await request(app)
      .post(`/recipes/${receitaIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .get('/recipes?scope=me')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Esperava array na resposta');

    const receitaFavoritada = res.body.find((r) => r.id === receitaIdA);
    assert.ok(receitaFavoritada, 'Receita favoritada não encontrada na listagem scope=me');
    assert.strictEqual(receitaFavoritada.isFavorited, true);
    assert.ok(receitaFavoritada.autor && typeof receitaFavoritada.autor === 'object', 'Esperava objeto autor');
    assert.strictEqual(receitaFavoritada.autor.nome, usuarioA.nome);
  });
});
