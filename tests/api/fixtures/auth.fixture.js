'use strict';

// Usuário base para os testes de autenticação
const usuarioBase = {
  nome: 'João',
  email: 'joao@email.com',
  senha: 'senha123',
};

// ─── RN005 – EP: campos obrigatórios no login ─────────────────────────────────
// CT013: campos obrigatórios ausentes no login
const loginCamposObrigatorios = [
  {
    ct: 'CT013a',
    desc: 'email ausente no login',
    input: { senha: 'senha123' },
    expectedStatus: 400,
    expectedErrorMessage: 'Preenchimento obrigatório do(s) campo(s)',
  },
  {
    ct: 'CT013b',
    desc: 'senha ausente no login',
    input: { email: 'joao@email.com' },
    expectedStatus: 400,
    expectedErrorMessage: 'Preenchimento obrigatório do(s) campo(s)',
  },
];

// ─── RN006 – EP: email não cadastrado retorna 401 ────────────────────────────
// CT011
const loginEmailNaoCadastrado = {
  input: { email: 'naocadastrado@email.com', senha: 'senha123' },
  expectedStatus: 401,
  expectedErrorField: 'email',
  expectedErrorMessage: 'E-mail não cadastrado',
};

// ─── RN007 – EP: senha incorreta retorna 401 ─────────────────────────────────
// CT012
const loginSenhaIncorreta = {
  input: { email: 'joao@email.com', senha: 'senhaerrada' },
  expectedStatus: 401,
  expectedErrorField: 'senha',
  expectedErrorMessage: 'Senha incorreta',
};

// ─── RN008 – EP: login bem-sucedido retorna JWT ──────────────────────────────
// CT010
const loginValido = {
  input: { email: 'joao@email.com', senha: 'senha123' },
  expectedStatus: 200,
};

// ─── RN009 – EP: variações de token em rotas protegidas ──────────────────────
// CTs: CT014, CT015, CT016
const tokenVariacoes = [
  {
    ct: 'CT014',
    desc: 'sem token (ausente)',
    token: null,
    expectedStatus: 401,
    expectedErrorMessage: 'Token não fornecido',
  },
  {
    ct: 'CT015',
    desc: 'token sem prefixo Bearer',
    token: 'tokeninvalido',
    expectedStatus: 401,
  },
  {
    ct: 'CT016',
    desc: 'token inválido ou expirado',
    token: 'Bearer invalid.token.here',
    expectedStatus: 401,
    expectedErrorMessage: 'Token inválido ou expirado',
  },
];

module.exports = {
  usuarioBase,
  loginCamposObrigatorios,
  loginEmailNaoCadastrado,
  loginSenhaIncorreta,
  loginValido,
  tokenVariacoes,
};
