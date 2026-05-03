'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado, criarUsuarioELogar, criarReceita, recipeModel } = require('./helpers/setup');
const {
  receitaValida,
  receitaAlternativa,
  receitaAtualizada,
  tabelaDecisaoEdicao,
  edicaoValidacaoCases,
} = require('./fixtures/recipes.fixture');

const usuarioA = { nome: 'User A', email: 'a@email.com', senha: 'senha123' };
const usuarioB = { nome: 'User B', email: 'b@email.com', senha: 'senha123' };
const ID_INEXISTENTE = '00000000-0000-0000-0000-000000000000';

describe('US005 – Edição de Receita | PUT /recipes/:id', () => {
  let tokenA;
  let tokenB;
  let receitaId;

  beforeEach(async () => {
    limparEstado();
    tokenA = await criarUsuarioELogar(usuarioA);
    tokenB = await criarUsuarioELogar(usuarioB);
    receitaId = await criarReceita(tokenA, receitaValida);
  });

  // ─── Tabela de Decisão (RN024) – CT034, CT035, CT036 ─────────────────────
  // | Autenticado | É Autor | Resultado |
  // |-------------|---------|-----------|
  // | Sim         | Sim     | 200       |
  // | Não         | N/A     | 401       |
  // | Sim         | Não     | 403       |
  tabelaDecisaoEdicao.forEach(({ ct, desc, autenticado, ehAutor, expectedStatus, expectedMessage, expectedErrorMessage }) => {
    it(`[${ct}] ${desc} → HTTP ${expectedStatus}`, async () => {
      let req = request(app).put(`/recipes/${receitaId}`).send(receitaAtualizada);

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

  // ─── RN025 – EP: receita inexistente retorna 404 ─────────────────────────
  // CT037
  it('[CT037] deve retornar 404 ao editar receita inexistente', async () => {
    const res = await request(app)
      .put(`/recipes/${ID_INEXISTENTE}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(receitaAtualizada);

    assert.strictEqual(res.status, 404);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes('Registro não encontrado'), `Esperava "Registro não encontrado" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN026 – EP: renomear para nome de outra receita do mesmo usuário ────
  // CT038
  it('[CT038] deve retornar 409 ao renomear receita para nome já existente de outro registro do mesmo usuário', async () => {
    await criarReceita(tokenA, receitaAlternativa);

    const res = await request(app)
      .put(`/recipes/${receitaId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaAtualizada, nome: receitaAlternativa.nome });

    assert.strictEqual(res.status, 409);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes('Registro já existente'), `Esperava "Registro já existente" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN026 – EP: manter o mesmo nome não gera conflito ───────────────────
  // CT039
  it('[CT039] deve retornar 200 ao editar receita mantendo o mesmo nome (sem conflito)', async () => {
    const res = await request(app)
      .put(`/recipes/${receitaId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaValida, notas: 'Atualizado sem conflito de nome' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Registro atualizado com sucesso');
  });

  // ─── RN027 – EP: ingredientes renormalizados para lowercase ──────────────
  // CT040
  it('[CT040] deve salvar ingredientes em minúsculo ao editar com valores em maiúsculo', async () => {
    const res = await request(app)
      .put(`/recipes/${receitaId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaAtualizada, ingredientes: ['FARINHA', 'AÇÚCAR', 'CHOCOLATE AMARGO', 'OVOS'] });

    assert.strictEqual(res.status, 200);

    const receita = recipeModel.findById(receitaId);
    assert.ok(receita.ingredientes.includes('farinha'), 'Esperava "farinha" nos ingredientes normalizados');
    assert.ok(receita.ingredientes.includes('chocolate amargo'), 'Esperava "chocolate amargo" nos ingredientes normalizados');
  });

  // ─── RN025 – EP: edição aplica as mesmas validações de campo do cadastro ──
  // CTs: CT088, CT089, CT090
  edicaoValidacaoCases.forEach(({ ct, desc, overrides, expectedStatus, expectedErrorField }) => {
    it(`[${ct}] deve retornar ${expectedStatus} ao editar receita com ${desc}`, async () => {
      const res = await request(app)
        .put(`/recipes/${receitaId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...receitaAtualizada, ...overrides });

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorField) {
        const erro = res.body.errors.find((e) => e.field === expectedErrorField);
        assert.ok(erro, `Esperava erro no campo "${expectedErrorField}"`);
      }
    });
  });

  // ─── RN026 – EP: renomear para nome existente com capitalização diferente ─
  // CT091
  it('[CT091] deve retornar 409 ao renomear receita para nome de outra receita com capitalização diferente', async () => {
    await criarReceita(tokenA, receitaAlternativa);

    const res = await request(app)
      .put(`/recipes/${receitaId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaAtualizada, nome: receitaAlternativa.nome.toUpperCase() });

    assert.strictEqual(res.status, 409);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes('Registro já existente'), `Esperava "Registro já existente" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN027 – EP: ingredientes já em minúsculo permanecem iguais ──────────
  // CT092
  it('[CT092] deve manter ingredientes em minúsculo ao editar com valores já em minúsculo', async () => {
    const ingredientesMinusculos = ['farinha', 'açúcar', 'chocolate'];
    const res = await request(app)
      .put(`/recipes/${receitaId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaAtualizada, ingredientes: ingredientesMinusculos });

    assert.strictEqual(res.status, 200);

    const receita = recipeModel.findById(receitaId);
    ingredientesMinusculos.forEach((ing) => {
      assert.ok(receita.ingredientes.includes(ing), `Esperava "${ing}" nos ingredientes: ${JSON.stringify(receita.ingredientes)}`);
    });
  });
});
