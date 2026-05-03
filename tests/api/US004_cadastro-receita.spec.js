'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado, criarUsuarioELogar } = require('./helpers/setup');
const {
  receitaValida,
  respostaSemAuth,
  nomeInvalidoCases,
  nomeBoundaryCases,
  ingredientesInvalidosCases,
  ingredientesMinimoValido,
  modoPreparoCases,
  categoriaCases,
  linkCases,
  nivelDificuldadeInvalido,
  nivelDificuldadeAusente,
  nomeCaseInsensitivoDuplicado,
  tempoPreparoInvalido,
  notasAcimaMaximo,
  notasMaximoValido,
} = require('./fixtures/recipes.fixture');

const usuarioA = { nome: 'User A', email: 'a@email.com', senha: 'senha123' };
const usuarioB = { nome: 'User B', email: 'b@email.com', senha: 'senha123' };

describe('US004 – Cadastro de Receita | POST /recipes', () => {
  let tokenA;
  let tokenB;

  beforeEach(async () => {
    limparEstado();
    tokenA = await criarUsuarioELogar(usuarioA);
    tokenB = await criarUsuarioELogar(usuarioB);
  });

  // ─── RN014 – EP: cadastro exige autenticação ──────────────────────────────
  // CT023
  it('[CT023] deve retornar 401 ao tentar cadastrar receita sem autenticação', async () => {
    const res = await request(app).post('/recipes').send(receitaValida);

    assert.strictEqual(res.status, respostaSemAuth.status);
  });

  // ─── CT022 – EP: cadastro válido com campos obrigatórios ──────────────────
  it('[CT022] deve cadastrar receita com todos os campos obrigatórios válidos e retornar 201', async () => {
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(receitaValida);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.message, 'Registro cadastrado com sucesso!');
  });

  // ─── RN016 – EP: nome único por usuário (case-insensitive) ───────────────
  // CT024: mesmo nome para o mesmo usuário → 409
  it('[CT024] deve retornar 409 ao cadastrar receita com nome duplicado para o mesmo usuário', async () => {
    await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(receitaValida);

    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(receitaValida);

    assert.strictEqual(res.status, 409);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes('Registro já existente'), `Esperava "Registro já existente" nos erros: ${JSON.stringify(erros)}`);
  });

  // CT025: mesmo nome para usuário diferente → 201 (permitido)
  it('[CT025] deve permitir cadastrar receita com mesmo nome de outro usuário (retorna 201)', async () => {
    await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(receitaValida);

    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(receitaValida);

    assert.strictEqual(res.status, 201);
  });

  // ─── RN015 – BVA/EP: validações do campo nome ────────────────────────────
  // CTs: CT026, CT027
  nomeInvalidoCases.forEach(({ ct, desc, overrides, expectedStatus }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...receitaValida, ...overrides });

      assert.strictEqual(res.status, expectedStatus);
    });
  });

  // ─── RN017/RN017a – EP/BVA: validações do campo ingredientes ─────────────
  // CTs: CT028, CT029, CT030
  ingredientesInvalidosCases.forEach(({ ct, desc, overrides, input, expectedStatus, expectedErrorMessage }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const body = input || { ...receitaValida, ...overrides };
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(body);

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorMessage) {
        const erros = res.body.errors.map((e) => e.message);
        assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
      }
    });
  });

  // ─── RN019 – EP: nivelDificuldade inválido ────────────────────────────────
  // CT031
  it('[CT031] deve retornar 400 quando nivelDificuldade tem valor inválido', async () => {
    const { overrides, expectedStatus, expectedErrorMessage } = nivelDificuldadeInvalido;
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaValida, ...overrides });

    assert.strictEqual(res.status, expectedStatus);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN021 – EP: tempoPreparo com formato inválido ───────────────────────
  // CT032
  it('[CT032] deve retornar 400 quando tempoPreparo tem formato inválido (ex: "1h30min")', async () => {
    const { input, expectedStatus } = tempoPreparoInvalido;
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(input);

    assert.strictEqual(res.status, expectedStatus);
  });

  // ─── RN023a – BVA: notas acima do máximo (501 chars) ─────────────────────
  // CT033
  it('[CT033] deve retornar 400 quando notas excede 500 caracteres', async () => {
    const { overrides, expectedStatus } = notasAcimaMaximo;
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaValida, ...overrides });

    assert.strictEqual(res.status, expectedStatus);
  });

  // ─── RN015 – BVA: limites válidos do campo nome ───────────────────────────
  // CTs: CT066, CT067
  nomeBoundaryCases.forEach(({ ct, desc, overrides, expectedStatus }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...receitaValida, ...overrides });

      assert.strictEqual(res.status, expectedStatus);
    });
  });

  // ─── RN017a – BVA: mínimo válido de ingredientes (2 itens) ───────────────
  // CT068
  it(`[${ingredientesMinimoValido.ct}] deve retornar ${ingredientesMinimoValido.expectedStatus} quando ${ingredientesMinimoValido.desc}`, async () => {
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaValida, ...ingredientesMinimoValido.overrides });

    assert.strictEqual(res.status, ingredientesMinimoValido.expectedStatus);
  });

  // ─── RN018 – BVA: comprimento do campo modoPreparo (10–2000 chars) ───────
  // CTs: CT069, CT070, CT071
  modoPreparoCases.forEach(({ ct, desc, overrides, expectedStatus }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...receitaValida, ...overrides });

      assert.strictEqual(res.status, expectedStatus);
    });
  });

  // ─── RN020 – EP: campo categoria (enum opcional) ─────────────────────────
  // CTs: CT072, CT073
  categoriaCases.forEach(({ ct, desc, overrides, expectedStatus, expectedErrorField }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...receitaValida, ...overrides });

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorField) {
        const erro = res.body.errors.find((e) => e.field === expectedErrorField);
        assert.ok(erro, `Esperava erro no campo "${expectedErrorField}"`);
      }
    });
  });

  // ─── RN022a – BVA: campo link (opcional, máx 300 chars) ──────────────────
  // CTs: CT074, CT075
  linkCases.forEach(({ ct, desc, overrides, expectedStatus, expectedErrorField }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app)
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ ...receitaValida, ...overrides });

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorField) {
        const erro = res.body.errors.find((e) => e.field === expectedErrorField);
        assert.ok(erro, `Esperava erro no campo "${expectedErrorField}"`);
      }
    });
  });

  // ─── RN016 – EP: nome duplicado case-insensitive (mesmo usuário) ─────────
  // CT084
  it('[CT084] deve retornar 409 ao cadastrar receita com nome em capitalização diferente para o mesmo usuário', async () => {
    await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(receitaValida);

    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaValida, nome: nomeCaseInsensitivoDuplicado.overrides.nome });

    assert.strictEqual(res.status, nomeCaseInsensitivoDuplicado.expectedStatus);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(nomeCaseInsensitivoDuplicado.expectedErrorMessage), `Esperava "${nomeCaseInsensitivoDuplicado.expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN019 – EP: nivelDificuldade ausente (campo obrigatório) ────────────
  // CT085
  it('[CT085] deve retornar 400 quando nivelDificuldade está ausente', async () => {
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(nivelDificuldadeAusente.body);

    assert.strictEqual(res.status, nivelDificuldadeAusente.expectedStatus);
    assert.ok(Array.isArray(res.body.errors) && res.body.errors.length > 0, 'Esperava erros de validação');
  });

  // ─── RN023a – BVA: notas no limite máximo válido (500 chars) ────────────
  // CT087
  it('[CT087] deve retornar 201 ao cadastrar receita com notas no limite máximo (500 chars)', async () => {
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...receitaValida, ...notasMaximoValido.overrides });

    assert.strictEqual(res.status, notasMaximoValido.expectedStatus);
  });
});
