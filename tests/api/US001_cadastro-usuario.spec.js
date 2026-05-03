'use strict';

const request = require('supertest');
const assert = require('assert');
const { app, limparEstado } = require('./helpers/setup');
const {
  usuarioValido,
  camposObrigatoriosInvalidos,
  nomeBoundaryValues,
  emailFormatoInvalido,
  emailDuplicado,
  senhaAbaixoMinimo,
  senhaBoundaryValues,
  respostaCadastroValido,
} = require('./fixtures/users.fixture');

describe('US001 – Cadastro de Usuário | POST /users', () => {
  beforeEach(() => limparEstado());

  // ─── CT001 – EP: cadastro com todos os dados válidos ─────────────────────
  it('[CT001] deve cadastrar usuário com todos os dados válidos e retornar 201', async () => {
    const res = await request(app).post('/users').send(usuarioValido);

    assert.strictEqual(res.status, respostaCadastroValido.status);
    assert.strictEqual(res.body.message, respostaCadastroValido.message);
    assert.strictEqual(typeof res.body.id, 'string');
  });

  // ─── RN001 – EP: campos obrigatórios ausentes ou vazios ──────────────────
  // CTs: CT002, CT003
  camposObrigatoriosInvalidos.forEach(({ ct, desc, input, expectedStatus, expectedErrorMessage }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app).post('/users').send(input);

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorMessage) {
        const erros = res.body.errors.map((e) => e.message);
        assert.ok(erros.includes(expectedErrorMessage), `Esperava mensagem "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
      }
    });
  });

  // ─── RN002 – BVA: limite de caracteres do campo nome (3–100) ─────────────
  // CTs: CT004, CT005, CT006
  nomeBoundaryValues.forEach(({ ct, desc, input, expectedStatus, expectedErrorMessage }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app).post('/users').send(input);

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorMessage) {
        const erros = res.body.errors.map((e) => e.message);
        assert.ok(erros.includes(expectedErrorMessage), `Esperava mensagem "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
      }
    });
  });

  // ─── RN003 – EP: formato de email inválido ────────────────────────────────
  // CT007
  it('[CT007] deve retornar 400 com erro de formato quando email é inválido', async () => {
    const { input, expectedStatus, expectedErrorMessage } = emailFormatoInvalido;
    const res = await request(app).post('/users').send(input);

    assert.strictEqual(res.status, expectedStatus);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(expectedErrorMessage), `Esperava mensagem "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN003 – EP: email duplicado ──────────────────────────────────────────
  // CT008
  it('[CT008] deve retornar 409 quando email já está cadastrado no sistema', async () => {
    await request(app).post('/users').send(usuarioValido);
    const res = await request(app).post('/users').send(emailDuplicado.input);

    assert.strictEqual(res.status, emailDuplicado.expectedStatus);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(emailDuplicado.expectedErrorMessage), `Esperava mensagem "${emailDuplicado.expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN004 – BVA: senha abaixo do mínimo (5 chars) ───────────────────────
  // CT009
  it('[CT009] deve retornar 400 quando senha tem abaixo do mínimo (5 chars)', async () => {
    const { input, expectedStatus } = senhaAbaixoMinimo;
    const res = await request(app).post('/users').send(input);

    assert.strictEqual(res.status, expectedStatus);
    assert.ok(Array.isArray(res.body.errors) && res.body.errors.length > 0, 'Esperava array de erros não vazio');
  });

  // ─── RN004 – BVA: limite mínimo válido da senha ───────────────────────────
  // CT065
  senhaBoundaryValues.forEach(({ ct, desc, input, expectedStatus }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app).post('/users').send(input);

      assert.strictEqual(res.status, expectedStatus);
    });
  });
});
