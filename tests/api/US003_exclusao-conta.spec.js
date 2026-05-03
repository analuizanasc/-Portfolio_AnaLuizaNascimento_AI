'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado, criarUsuarioELogar, criarReceita } = require('./helpers/setup');
const {
  usuarioA,
  usuarioB,
  receitaCascata,
  respostaExclusaoSucesso,
  respostaExclusaoSemToken,
  respostaAutorDesconhecido,
  respostaTokenAposExclusao,
} = require('./fixtures/deleteAccount.fixture');

describe('US003 – Exclusão de Conta | DELETE /users/me', () => {
  let tokenA;
  let tokenB;

  beforeEach(async () => {
    limparEstado();
    tokenA = await criarUsuarioELogar(usuarioA);
    tokenB = await criarUsuarioELogar(usuarioB);
  });

  // ─── RN010 – EP: usuário autenticado exclui a própria conta ──────────────
  // CT017
  it('[CT017] deve retornar 200 ao excluir a conta com token válido', async () => {
    const res = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, respostaExclusaoSucesso.status);
    assert.strictEqual(res.body.message, respostaExclusaoSucesso.message);
  });

  // ─── RN010 – EP: sem token é rejeitado ───────────────────────────────────
  // CT018
  it('[CT018] deve retornar 401 ao tentar excluir conta sem token', async () => {
    const res = await request(app).delete('/users/me');

    assert.strictEqual(res.status, respostaExclusaoSemToken.status);
  });

  // ─── RN011 – EP: favoritos do usuário em receitas de outros são removidos ─
  // CT019
  it('[CT019] deve remover favoritos feitos pelo usuário ao excluir a conta', async () => {
    const receitaId = await criarReceita(tokenA, receitaCascata);
    await request(app)
      .post(`/recipes/${receitaId}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenB}`);

    // Após excluir conta do usuário B, a conta não existe mais → token ainda válido retorna 404
    const res = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${tokenB}`);
    assert.strictEqual(res.status, 404);
  });

  // ─── RN012 – EP: receitas permanecem com autor "Desconhecido" ────────────
  // CT020
  it('[CT020] deve manter receitas do usuário com autor "Desconhecido" após exclusão da conta', async () => {
    await criarReceita(tokenA, receitaCascata);

    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .get('/recipes?scope=all')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Esperava array de receitas');
    assert.strictEqual(res.body[0].autor.nome, respostaAutorDesconhecido.autorNome);
  });

  // ─── RN013 – EP: token válido após exclusão retorna 404 ──────────────────
  // CT021
  it('[CT021] deve retornar 404 ao usar token válido após a conta ter sido excluída', async () => {
    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, respostaTokenAposExclusao.status);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(respostaTokenAposExclusao.expectedErrorMessage), `Esperava "${respostaTokenAposExclusao.expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN043 – Transição de Estado: favoritos de outros em receitas do autor permanecem ─
  // CT093
  // Estado inicial:  A tem receita + B favoritou receita de A
  // Ação:            A exclui a própria conta
  // Estado final:    receita de A ainda aparece no scope=me de B (favorito de B permanece)
  it('[CT093] deve manter favoritos de outros usuários na receita após o autor excluir a conta', async () => {
    const receitaId = await criarReceita(tokenA, receitaCascata);

    await request(app)
      .post(`/recipes/${receitaId}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .get('/recipes?scope=me')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Esperava array de receitas');
    const receitaFavoritada = res.body.find((r) => r.id === receitaId);
    assert.ok(receitaFavoritada, 'Receita favoritada de A deve permanecer no scope=me de B após A excluir a conta');
    assert.strictEqual(receitaFavoritada.isFavorited, true);
  });
});
