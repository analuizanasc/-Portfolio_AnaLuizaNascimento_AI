'use strict';

const request = require('supertest');
const assert = require('assert');
const jwt = require('jsonwebtoken');
const { app, limparEstado } = require('./helpers/setup');
const {
  usuarioBase,
  loginCamposObrigatorios,
  loginEmailNaoCadastrado,
  loginSenhaIncorreta,
  loginValido,
  tokenVariacoes,
} = require('./fixtures/auth.fixture');

describe('US002 – Autenticação | POST /login e rotas protegidas', () => {
  beforeEach(async () => {
    limparEstado();
    await request(app).post('/users').send(usuarioBase);
  });

  // ─── RN008 – EP: login bem-sucedido retorna JWT com id e email ────────────
  // CT010
  it('[CT010] deve retornar 200 com token JWT contendo id e email no payload', async () => {
    const res = await request(app).post('/login').send(loginValido.input);

    assert.strictEqual(res.status, loginValido.expectedStatus);
    assert.strictEqual(typeof res.body.token, 'string');

    const payload = jwt.decode(res.body.token);
    assert.ok(payload.id, 'Payload JWT deve conter id');
    assert.strictEqual(payload.email, usuarioBase.email);
  });

  // ─── RN006 – EP: email não cadastrado retorna 401 ────────────────────────
  // CT011
  it('[CT011] deve retornar 401 quando email não está cadastrado', async () => {
    const { input, expectedStatus, expectedErrorMessage } = loginEmailNaoCadastrado;
    const res = await request(app).post('/login').send(input);

    assert.strictEqual(res.status, expectedStatus);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN007 – EP: senha incorreta retorna 401 ─────────────────────────────
  // CT012
  it('[CT012] deve retornar 401 quando senha está incorreta', async () => {
    const { input, expectedStatus, expectedErrorMessage } = loginSenhaIncorreta;
    const res = await request(app).post('/login').send(input);

    assert.strictEqual(res.status, expectedStatus);
    const erros = res.body.errors.map((e) => e.message);
    assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
  });

  // ─── RN005 – EP: campos obrigatórios no login ────────────────────────────
  // CT013
  loginCamposObrigatorios.forEach(({ ct, desc, input, expectedStatus, expectedErrorMessage }) => {
    it(`[${ct}] deve retornar ${expectedStatus} quando ${desc}`, async () => {
      const res = await request(app).post('/login').send(input);

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorMessage) {
        const erros = res.body.errors.map((e) => e.message);
        assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
      }
    });
  });

  // ─── RN009 – EP: variações de token em rotas protegidas ──────────────────
  // CTs: CT014, CT015, CT016
  tokenVariacoes.forEach(({ ct, desc, token, expectedStatus, expectedErrorMessage }) => {
    it(`[${ct}] deve retornar ${expectedStatus} ao acessar rota protegida com ${desc}`, async () => {
      let req = request(app).get('/recipes?scope=me');
      if (token) {
        req = req.set('Authorization', token);
      }
      const res = await req;

      assert.strictEqual(res.status, expectedStatus);
      if (expectedErrorMessage) {
        const erros = res.body.errors.map((e) => e.message);
        assert.ok(erros.includes(expectedErrorMessage), `Esperava "${expectedErrorMessage}" nos erros: ${JSON.stringify(erros)}`);
      }
    });
  });
});
