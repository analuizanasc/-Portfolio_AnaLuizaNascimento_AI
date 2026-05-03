'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado, criarUsuarioELogar, criarReceita } = require('./helpers/setup');
const { receitaValida, tabelaDecisaoExclusao } = require('./fixtures/recipes.fixture');

const usuarioA = { nome: 'User A', email: 'a@email.com', senha: 'senha123' };
const usuarioB = { nome: 'User B', email: 'b@email.com', senha: 'senha123' };
const ID_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

describe('US006 – Exclusão de Receita | DELETE /recipes/:id', () => {
  let tokenA;
  let tokenB;
  let receitaId;

  beforeEach(async () => {
    limparEstado();
    tokenA = await criarUsuarioELogar(usuarioA);
    tokenB = await criarUsuarioELogar(usuarioB);
    receitaId = await criarReceita(tokenA, receitaValida);
  });

  // ─── Tabela de Decisão (RN028) – CT041, CT042, CT043 ─────────────────────
  // | Autenticado | É Autor | Resultado |
  // |-------------|---------|-----------|
  // | Sim         | Sim     | 200       |
  // | Não         | N/A     | 401       |
  // | Sim         | Não     | 403       |
  tabelaDecisaoExclusao.forEach(({ ct, desc, autenticado, ehAutor, expectedStatus, expectedMessage, expectedErrorMessage }) => {
    it(`[${ct}] ${desc} → HTTP ${expectedStatus}`, async () => {
      let req = request(app).delete(`/recipes/${receitaId}`);

      if (autenticado) {
        const token = ehAutor ? tokenA : tokenB;
        req = req.set('Authorization', `Bearer ${token}`);
      }

      const res = await req;
      assert.strictEqual(res.status, expectedStatus);

      if (expectedMessage) {
        assert.strictEqual(res.body.message, expectedMessage);
      }
      if (expectedErrorMessage) {
        const erros = res.body.errors.map((e) => e.message);
        assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
      }
    });
  });

  // ─── RN028 – EP: receita inexistente retorna 404 ─────────────────────────
  // CT044
  it('[CT044] deve retornar 404 ao excluir receita inexistente', async () => {
    const res = await request(app)
      .delete(`/recipes/${ID_INEXISTENTE}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, 404);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes('Registro não encontrado'), `Esperava "Registro não encontrado" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN029 – Transição de Estado: favoritos removidos em cascata ──────────
  // CT045
  // Estado inicial:  receita existe + favorito de B → receita existe
  // Ação:            DELETE /recipes/:id (pelo autor A)
  // Estado final:    receita não existe + favorito de B → removido
  it('[CT045] deve remover todos os favoritos da receita ao excluí-la (cascata)', async () => {
    await request(app)
      .post(`/recipes/${receitaId}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    await request(app)
      .delete(`/recipes/${receitaId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Receita não deve mais aparecer no scope=me do usuário B
    const res = await request(app)
      .get('/recipes?scope=me')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    assert.ok('data' in res.body, 'Esperava propriedade "data" no body');
    assert.deepStrictEqual(res.body.data, []);
  });
});
