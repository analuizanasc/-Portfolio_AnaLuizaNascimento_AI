'use strict';

// Receitas criadas no beforeEach para testes de listagem
const receitaUsuarioA = {
  nome: 'Bolo de Chocolate',
  ingredientes: ['farinha', 'açúcar', 'chocolate', 'ovos'],
  modoPreparo: 'Misture todos os ingredientes e leve ao forno por 40 minutos.',
  nivelDificuldade: 'Media',
  categoria: 'Doce',
};

const receitaUsuarioB = {
  nome: 'Torta de Banana',
  ingredientes: ['banana', 'massa podre'],
  modoPreparo: 'Faça a massa e recheie com banana. Leve ao forno por 30 minutos.',
  nivelDificuldade: 'Facil',
};

// ─── RN031 – EP: parâmetro scope obrigatório e valores aceitos ────────────────
// CT048 e CT049
const scopeInvalidoCases = [
  {
    ct: 'CT048',
    desc: 'scope ausente',
    query: '',
    expectedStatus: 400,
    expectedErrorField: 'scope',
    expectedErrorMessage: 'O parâmetro scope é obrigatório',
  },
  {
    ct: 'CT049',
    desc: 'scope com valor inválido',
    query: '?scope=invalido',
    expectedStatus: 400,
    expectedErrorField: 'scope',
    expectedErrorMessage: "Valor inválido para scope. Use 'me' ou 'all'",
  },
];

// ─── RN033 – EP: filtro nome busca parcial case-insensitive ──────────────────
// CT051
const filtroNomeCases = [
  {
    ct: 'CT051a',
    desc: 'busca parcial pelo nome (minúsculo)',
    query: '?scope=all&nome=bolo',
    expectedCount: 1,
    expectedNome: 'Bolo de Chocolate',
  },
  {
    ct: 'CT051b',
    desc: 'busca com capitalização diferente',
    query: '?scope=all&nome=BOLO',
    expectedCount: 1,
    expectedNome: 'Bolo de Chocolate',
  },
];

// ─── RN034 – EP: filtro ingrediente busca parcial case-insensitive ────────────
// CT052
const filtroIngredienteCases = [
  {
    ct: 'CT052a',
    desc: 'busca parcial por ingrediente',
    query: '?scope=all&ingrediente=choco',
    expectedCount: 1,
  },
  {
    ct: 'CT052b',
    desc: 'busca com capitalização diferente',
    query: '?scope=all&ingrediente=CHOCO',
    expectedCount: 1,
  },
];

// ─── RN035 – Tabela de Decisão: filtros combinados (AND) ─────────────────────
// CT053
// | nome filtro   | ingrediente filtro | Resultado       |
// |---------------|--------------------|-----------------|
// | Corresponde   | Corresponde        | Inclui receita  |
// | Corresponde   | Não corresponde    | Exclui receita  |
// | Não corresponde | Corresponde      | Exclui receita  |
const filtroCombinadoCases = [
  {
    ct: 'CT053a',
    desc: 'ambos filtros correspondem → inclui (AND)',
    query: '?scope=all&nome=bolo&ingrediente=chocolate',
    expectedCount: 1,
  },
  {
    ct: 'CT053b',
    desc: 'nome corresponde mas ingrediente não → exclui',
    query: '?scope=all&nome=bolo&ingrediente=banana',
    expectedResultEmpty: true,
  },
  {
    ct: 'CT053c',
    desc: 'ingrediente corresponde mas nome não → exclui',
    query: '?scope=all&nome=torta&ingrediente=chocolate',
    expectedResultEmpty: true,
  },
];

// ─── RN036 – EP: sem resultados retorna 200 com message e data:[] ────────────
// CT054
const filtroSemResultado = {
  query: '?scope=me&nome=xyzinexistente',
  expectedStatus: 200,
  expectedMessage: 'Nenhuma receita encontrada para os filtros informados',
  expectedData: [],
};

module.exports = {
  receitaUsuarioA,
  receitaUsuarioB,
  scopeInvalidoCases,
  filtroNomeCases,
  filtroIngredienteCases,
  filtroCombinadoCases,
  filtroSemResultado,
};
