'use strict';

// ─── CT001 ─── Dados válidos de cadastro
const usuarioValido = {
  nome: 'João Silva',
  email: 'joao@email.com',
  senha: 'senha123',
};

// ─── RN001 – EP: campos obrigatórios ausentes ou vazios ───────────────────────
// CTs: CT002 e CT003
const camposObrigatoriosInvalidos = [
  {
    ct: 'CT002',
    desc: 'campo nome ausente',
    input: { email: 'joao@email.com', senha: 'senha123' },
    expectedStatus: 400,
    expectedErrorField: 'geral',
    expectedErrorMessage: 'Preenchimento obrigatório do(s) campo(s)',
  },
  {
    ct: 'CT003',
    desc: 'nome somente espaços (vazio após trim)',
    input: { nome: '   ', email: 'joao@email.com', senha: 'senha123' },
    expectedStatus: 400,
    expectedErrorField: 'geral',
    expectedErrorMessage: 'Preenchimento obrigatório do(s) campo(s)',
  },
  {
    ct: 'CT079',
    desc: 'campo email ausente',
    input: { nome: 'João Silva', senha: 'senha123' },
    expectedStatus: 400,
    expectedErrorField: 'geral',
    expectedErrorMessage: 'Preenchimento obrigatório do(s) campo(s)',
  },
  {
    ct: 'CT080',
    desc: 'campo senha ausente',
    input: { nome: 'João Silva', email: 'joao@email.com' },
    expectedStatus: 400,
    expectedErrorField: 'geral',
    expectedErrorMessage: 'Preenchimento obrigatório do(s) campo(s)',
  },
];

// ─── RN002 – BVA: comprimento do campo nome (3–100 chars) ────────────────────
// CTs: CT004, CT005, CT006, CT064
const nomeBoundaryValues = [
  {
    ct: 'CT004',
    desc: 'nome no limite mínimo válido (3 chars)',
    input: { nome: 'Ana', email: 'ana@email.com', senha: 'senha123' },
    expectedStatus: 201,
  },
  {
    ct: 'CT005',
    desc: 'nome abaixo do mínimo (2 chars)',
    input: { nome: 'Jo', email: 'jo@email.com', senha: 'senha123' },
    expectedStatus: 400,
  },
  {
    ct: 'CT006',
    desc: 'nome acima do máximo (101 chars)',
    input: { nome: 'A'.repeat(101), email: 'longo@email.com', senha: 'senha123' },
    expectedStatus: 400,
    expectedErrorMessage: 'Número máximo de caracteres excedido',
  },
  {
    ct: 'CT064',
    desc: 'nome no limite máximo válido (100 chars)',
    input: { nome: 'A'.repeat(100), email: 'cem@email.com', senha: 'senha123' },
    expectedStatus: 201,
  },
];

// ─── RN003 – EP: formato e unicidade do email ─────────────────────────────────
// CT007: email com formato inválido
const emailFormatoInvalido = {
  input: { nome: 'João Silva', email: 'emailinvalido', senha: 'senha123' },
  expectedStatus: 400,
  expectedErrorMessage: 'Formato de e-mail inválido',
};

// CT008: email já cadastrado (usa usuarioValido como base)
const emailDuplicado = {
  input: { nome: 'Outro Usuário', email: 'joao@email.com', senha: 'senha456' },
  expectedStatus: 409,
  expectedErrorMessage: 'E-mail já cadastrado',
};

// ─── RN004 – BVA: comprimento da senha (6–100 chars) ─────────────────────────
// CT009: senha abaixo do mínimo (5 chars)
const senhaAbaixoMinimo = {
  input: { nome: 'João Silva', email: 'joao@email.com', senha: 'abc12' },
  expectedStatus: 400,
};

// CTs: CT065, CT081, CT082
const senhaBoundaryValues = [
  {
    ct: 'CT065',
    desc: 'senha no limite mínimo válido (6 chars)',
    input: { nome: 'João Silva', email: 'joao6@email.com', senha: 'abc123' },
    expectedStatus: 201,
  },
  {
    ct: 'CT081',
    desc: 'senha no limite máximo válido (100 chars)',
    input: { nome: 'João Silva', email: 'joao100@email.com', senha: 'a'.repeat(100) },
    expectedStatus: 201,
  },
  {
    ct: 'CT082',
    desc: 'senha acima do máximo (101 chars)',
    input: { nome: 'João Silva', email: 'joao101@email.com', senha: 'a'.repeat(101) },
    expectedStatus: 400,
  },
];

// Resposta esperada para CT001 (cadastro válido)
const respostaCadastroValido = {
  status: 201,
  message: 'Cadastro realizado com sucesso',
};

module.exports = {
  usuarioValido,
  camposObrigatoriosInvalidos,
  nomeBoundaryValues,
  emailFormatoInvalido,
  emailDuplicado,
  senhaAbaixoMinimo,
  senhaBoundaryValues,
  respostaCadastroValido,
};
