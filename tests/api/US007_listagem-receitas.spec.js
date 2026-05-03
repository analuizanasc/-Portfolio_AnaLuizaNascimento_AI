'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado, criarUsuarioELogar, criarReceita } = require('./helpers/setup');
const {
  receitaUsuarioA,
  receitaUsuarioB,
  scopeInvalidoCases,
  filtroNomeCases,
  filtroIngredienteCases,
  filtroCombinadoCases,
  filtroSemResultado,
} = require('./fixtures/listRecipes.fixture');

const usuarioA = { nome: 'User A', email: 'a@email.com', senha: 'senha123' };
const usuarioB = { nome: 'User B', email: 'b@email.com', senha: 'senha123' };

describe('US007 – Listagem e Filtragem de Receitas | GET /recipes', () => {
  let tokenA;
  let tokenB;
  let receitaIdA;

  beforeEach(async () => {
    limparEstado();
    tokenA = await criarUsuarioELogar(usuarioA);
    tokenB = await criarUsuarioELogar(usuarioB);
    receitaIdA = await criarReceita(tokenA, receitaUsuarioA);
    await criarReceita(tokenB, receitaUsuarioB);
  });

  // ─── RN030 – EP: listagem exige autenticação ──────────────────────────────
  // CT050
  it('[CT050] deve retornar 401 ao tentar listar receitas sem token', async () => {
    const res = await request(app).get('/recipes?scope=me');

    assert.strictEqual(res.status, 401);
  });

  // ─── RN031 – EP: scope obrigatório e valores aceitos ─────────────────────
  // CTs: CT048, CT049
  scopeInvalidoCases.forEach(({ ct, desc, query, expectedStatus, expectedErrorField, expectedErrorMessage }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app)
        .get(`/recipes${query}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, expectedStatus);
      const erro = res.body.errors.find((e) => e.field === expectedErrorField);
      assert.ok(erro, `Esperava erro no campo "${expectedErrorField}"`);
      assert.strictEqual(erro.message, expectedErrorMessage);
    });
  });

  // ─── RN032 – EP: scope=me retorna receitas próprias e favoritadas ─────────
  // CT046
  it('[CT046] deve retornar 200 com receitas próprias ao usar scope=me', async () => {
    const res = await request(app)
      .get('/recipes?scope=me')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Esperava array na resposta');
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].nome, receitaUsuarioA.nome);
  });

  // ─── RN032 – EP: scope=all retorna todas as receitas do sistema ──────────
  // CT047
  it('[CT047] deve retornar 200 com todas as receitas ao usar scope=all', async () => {
    const res = await request(app)
      .get('/recipes?scope=all')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Esperava array na resposta');
    assert.strictEqual(res.body.length, 2);
  });

  // ─── RN033 – EP: filtro nome parcial e case-insensitive ──────────────────
  // CT051
  filtroNomeCases.forEach(({ ct, desc, query, expectedCount, expectedNome }) => {
    it(`[${ct}] deve filtrar por nome: ${desc}`, async () => {
      const res = await request(app)
        .get(`/recipes${query}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body), 'Esperava array na resposta');
      assert.strictEqual(res.body.length, expectedCount);
      if (expectedNome) {
        assert.strictEqual(res.body[0].nome, expectedNome);
      }
    });
  });

  // ─── RN034 – EP: filtro ingrediente parcial e case-insensitive ───────────
  // CT052
  filtroIngredienteCases.forEach(({ ct, desc, query, expectedCount }) => {
    it(`[${ct}] deve filtrar por ingrediente: ${desc}`, async () => {
      const res = await request(app)
        .get(`/recipes${query}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body), 'Esperava array na resposta');
      assert.strictEqual(res.body.length, expectedCount);
    });
  });

  // ─── RN035 – Tabela de Decisão: filtros combinados (AND) ─────────────────
  // CT053
  // | nome        | ingrediente | Resultado      |
  // |-------------|-------------|----------------|
  // | Corresponde | Corresponde | Inclui receita |
  // | Corresponde | Não         | Exclui (empty) |
  // | Não         | Corresponde | Exclui (empty) |
  filtroCombinadoCases.forEach(({ ct, desc, query, expectedCount, expectedResultEmpty }) => {
    it(`[${ct}] filtros combinados AND: ${desc}`, async () => {
      const res = await request(app)
        .get(`/recipes${query}`)
        .set('Authorization', `Bearer ${tokenA}`);

      assert.strictEqual(res.status, 200);

      if (expectedResultEmpty) {
        assert.ok('message' in res.body, 'Esperava propriedade "message" no body');
        assert.deepStrictEqual(res.body.data, []);
      } else {
        assert.ok(Array.isArray(res.body), 'Esperava array na resposta');
        assert.strictEqual(res.body.length, expectedCount);
      }
    });
  });

  // ─── RN036 – EP: sem resultados retorna 200 com message e data:[] ────────
  // CT054
  it('[CT054] deve retornar 200 com message e data:[] quando nenhuma receita é encontrada', async () => {
    const { query, expectedStatus, expectedMessage, expectedData } = filtroSemResultado;
    const res = await request(app)
      .get(`/recipes${query}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, expectedStatus);
    assert.strictEqual(res.body.message, expectedMessage);
    assert.deepStrictEqual(res.body.data, expectedData);
  });

  // ─── RN037 – EP: campo isFavorited ───────────────────────────────────────
  // CT055: isFavorited=true para receita favoritada
  it('[CT055] deve retornar isFavorited=true para receita favoritada pelo usuário no scope=me', async () => {
    await request(app)
      .post(`/recipes/${receitaIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .get('/recipes?scope=me')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    const receitaFavoritada = res.body.find((r) => r.id === receitaIdA);
    assert.ok(receitaFavoritada, 'Receita favoritada não encontrada na listagem');
    assert.strictEqual(receitaFavoritada.isFavorited, true);
  });

  // CT056: isFavorited=false para receita própria
  it('[CT056] deve retornar isFavorited=false para receita própria no scope=me', async () => {
    const res = await request(app)
      .get('/recipes?scope=me')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, 200);
    const receitaA = res.body.find((r) => r.id === receitaIdA);
    assert.ok(receitaA, 'Receita do usuário A não encontrada na listagem');
    assert.strictEqual(receitaA.isFavorited, false);
  });

  // ─── RN038 – EP: campo autor exibe "Desconhecido" após exclusão ──────────
  // CT057
  it('[CT057] deve exibir autor.nome como "Desconhecido" quando o autor excluiu a conta', async () => {
    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .get('/recipes?scope=all')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.strictEqual(res.status, 200);
    const receitaDeA = res.body.find((r) => r.id === receitaIdA);
    assert.ok(receitaDeA, 'Receita do usuário A não encontrada após exclusão');
    assert.strictEqual(receitaDeA.autor.nome, 'Desconhecido');
  });

  // ─── RN037 – EP: isFavorited=false para receita de outro usuário não favoritada em scope=all ─
  // CT094
  it('[CT094] deve retornar isFavorited=false para receita de outro usuário não favoritada em scope=all', async () => {
    const res = await request(app)
      .get('/recipes?scope=all')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body), 'Esperava array na resposta');
    const receitasDeB = res.body.filter((r) => r.id !== receitaIdA);
    assert.ok(receitasDeB.length > 0, 'Esperava pelo menos uma receita de B na listagem');
    receitasDeB.forEach((r) => {
      assert.strictEqual(r.isFavorited, false, `Esperava isFavorited=false para receita "${r.nome}" não favoritada`);
    });
  });
});
