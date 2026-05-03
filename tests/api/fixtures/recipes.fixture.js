'use strict';

// ─── Receita base válida (CT022) ──────────────────────────────────────────────
const receitaValida = {
  nome: 'Bolo de Chocolate',
  ingredientes: ['farinha', 'açúcar', 'chocolate', 'ovos'],
  modoPreparo: 'Misture todos os ingredientes e leve ao forno por 40 minutos.',
  nivelDificuldade: 'Media',
  categoria: 'Doce',
  tempoPreparo: '01:00',
  notas: 'Servir gelado',
  link: 'https://exemplo.com/receita',
};

// Receita alternativa para testes que precisam de um segundo registro
const receitaAlternativa = {
  nome: 'Torta de Limão',
  ingredientes: ['limão', 'leite condensado'],
  modoPreparo: 'Misture e leve à geladeira por 2 horas antes de servir.',
  nivelDificuldade: 'Facil',
};

// Receita para o usuário B (testes multi-usuário)
const receitaUsuarioB = {
  nome: 'Arroz com Frango',
  ingredientes: ['arroz', 'frango', 'temperos'],
  modoPreparo: 'Cozinhe o frango e refogue com o arroz até ficar bem temperado.',
  nivelDificuldade: 'Facil',
};

// ─── RN014 – EP: cadastro exige autenticação ──────────────────────────────────
// CT023
const respostaSemAuth = { status: 401 };

// ─── RN015/RN016 – EP/BVA: validações do campo nome ─────────────────────────
// CTs: CT024, CT025, CT026, CT027
const nomeInvalidoCases = [
  {
    ct: 'CT026',
    desc: 'nome somente espaços',
    overrides: { nome: '   ' },
    expectedStatus: 400,
  },
  {
    ct: 'CT027',
    desc: 'nome acima do máximo (51 chars)',
    overrides: { nome: 'A'.repeat(51) },
    expectedStatus: 400,
  },
  {
    ct: 'CT083',
    desc: 'nome abaixo do mínimo (2 chars)',
    overrides: { nome: 'Bo' },
    expectedStatus: 400,
  },
];

// ─── RN015 – BVA: limites válidos do campo nome ───────────────────────────────
// CTs: CT066, CT067
const nomeBoundaryCases = [
  {
    ct: 'CT066',
    desc: 'nome no limite mínimo válido (3 chars)',
    overrides: { nome: 'Bom' },
    expectedStatus: 201,
  },
  {
    ct: 'CT067',
    desc: 'nome no limite máximo válido (50 chars)',
    overrides: { nome: 'A'.repeat(50) },
    expectedStatus: 201,
  },
];

// ─── RN017a – BVA: ingredientes com exatamente 2 itens (mínimo válido) ───────
// CT068
const ingredientesMinimoValido = {
  ct: 'CT068',
  desc: 'array com exatamente 2 ingredientes (mínimo válido)',
  overrides: { ingredientes: ['farinha', 'açúcar'] },
  expectedStatus: 201,
};

// ─── RN017/RN017a – EP/BVA: validações do campo ingredientes ─────────────────
// CTs: CT028, CT029, CT030
const ingredientesInvalidosCases = [
  {
    ct: 'CT028',
    desc: 'ingredientes não é array (string)',
    overrides: { ingredientes: 'farinha' },
    expectedStatus: 400,
    expectedErrorMessage: 'Lista de ingredientes inválida',
  },
  {
    ct: 'CT029',
    desc: '1 ingrediente (abaixo do mínimo de 2)',
    input: {
      nome: 'Bolo Simples',
      ingredientes: ['farinha'],
      modoPreparo: 'Misture e leve ao forno.',
      nivelDificuldade: 'Facil',
    },
    expectedStatus: 400,
  },
  {
    ct: 'CT030',
    desc: 'ingredientes duplicados',
    input: {
      nome: 'Bolo',
      ingredientes: ['farinha', 'farinha'],
      modoPreparo: 'Misture e leve ao forno.',
      nivelDificuldade: 'Facil',
    },
    expectedStatus: 400,
  },
];

// ─── RN018 – BVA: modoPreparo (10–2000 chars) ────────────────────────────────
// CTs: CT069, CT070, CT071
const modoPreparoCases = [
  {
    ct: 'CT069',
    desc: 'modoPreparo com 9 chars (abaixo do mínimo)',
    overrides: { modoPreparo: 'Misturar.' },
    expectedStatus: 400,
  },
  {
    ct: 'CT070',
    desc: 'modoPreparo com 10 chars (mínimo válido)',
    overrides: { modoPreparo: 'Misture t.' },
    expectedStatus: 201,
  },
  {
    ct: 'CT071',
    desc: 'modoPreparo com 2001 chars (acima do máximo)',
    overrides: { modoPreparo: 'A'.repeat(2001) },
    expectedStatus: 400,
  },
];

// ─── RN020 – EP: categoria (enum opcional) ────────────────────────────────────
// CTs: CT072, CT073
const categoriaCases = [
  {
    ct: 'CT072',
    desc: 'categoria com valor válido "Doce"',
    overrides: { categoria: 'Doce' },
    expectedStatus: 201,
  },
  {
    ct: 'CT073',
    desc: 'categoria com valor inválido "Carnivora"',
    overrides: { categoria: 'Carnivora' },
    expectedStatus: 400,
    expectedErrorField: 'categoria',
  },
];

// ─── RN022 – BVA: link (opcional, máx 300 chars) ─────────────────────────────
// CTs: CT074, CT075
const linkCases = [
  {
    ct: 'CT074',
    desc: 'link com 300 chars (máximo válido)',
    overrides: { link: 'https://exemplo.com/' + 'a'.repeat(280) },
    expectedStatus: 201,
  },
  {
    ct: 'CT075',
    desc: 'link com 301 chars (acima do máximo)',
    overrides: { link: 'https://exemplo.com/' + 'a'.repeat(281) },
    expectedStatus: 400,
    expectedErrorField: 'link',
  },
];

// ─── RN019 – EP: nivelDificuldade inválido ────────────────────────────────────
// CT031
const nivelDificuldadeInvalido = {
  overrides: { nivelDificuldade: 'Extreme' },
  expectedStatus: 400,
  expectedErrorMessage: 'Valor inválido para o campo informado',
};

// ─── RN021 – EP: tempoPreparo formato inválido ────────────────────────────────
// CT032
const tempoPreparoInvalido = {
  input: {
    nome: 'Bolo',
    ingredientes: ['farinha', 'açúcar'],
    modoPreparo: 'Misture e leve ao forno.',
    nivelDificuldade: 'Facil',
    tempoPreparo: '1h30min',
  },
  expectedStatus: 400,
};

// ─── RN023a – BVA: notas acima do máximo ─────────────────────────────────────
// CT033
const notasAcimaMaximo = {
  overrides: { notas: 'A'.repeat(501) },
  expectedStatus: 400,
};

// ─── Dados para edição (US005) ────────────────────────────────────────────────
const receitaAtualizada = {
  nome: 'Bolo de Chocolate Especial',
  ingredientes: ['farinha', 'açúcar', 'chocolate amargo', 'ovos'],
  modoPreparo: 'Misture todos e leve ao forno por 45 minutos a 180 graus com forma untada.',
  nivelDificuldade: 'Dificil',
  categoria: 'Doce',
  tempoPreparo: '01:30',
  notas: 'Servir com sorvete',
  link: 'https://exemplo.com/especial',
};

// ─── Tabela de Decisão para edição (CT034-CT036) ──────────────────────────────
// | Autenticado | É Autor | Resultado |
// |-------------|---------|-----------|
// | Sim         | Sim     | 200       |  → CT034
// | Não         | N/A     | 401       |  → CT035
// | Sim         | Não     | 403       |  → CT036
const tabelaDecisaoEdicao = [
  {
    ct: 'CT034',
    desc: 'editar receita com dados válidos como autor',
    autenticado: true,
    ehAutor: true,
    expectedStatus: 200,
    expectedMessage: 'Registro atualizado com sucesso',
  },
  {
    ct: 'CT035',
    desc: 'editar receita sem autenticação',
    autenticado: false,
    ehAutor: false,
    expectedStatus: 401,
  },
  {
    ct: 'CT036',
    desc: 'editar receita de outro usuário',
    autenticado: true,
    ehAutor: false,
    expectedStatus: 403,
    expectedErrorMessage: 'Ação não permitida',
  },
];

// ─── Tabela de Decisão para exclusão (CT041-CT043) ────────────────────────────
// | Autenticado | É Autor | Resultado |
// |-------------|---------|-----------|
// | Sim         | Sim     | 200       |  → CT041
// | Não         | N/A     | 401       |  → CT042
// | Sim         | Não     | 403       |  → CT043
const tabelaDecisaoExclusao = [
  {
    ct: 'CT041',
    desc: 'excluir receita própria como autor autenticado',
    autenticado: true,
    ehAutor: true,
    expectedStatus: 200,
    expectedMessage: 'Registro excluído com sucesso',
  },
  {
    ct: 'CT042',
    desc: 'excluir receita sem autenticação',
    autenticado: false,
    ehAutor: false,
    expectedStatus: 401,
  },
  {
    ct: 'CT043',
    desc: 'excluir receita de outro usuário',
    autenticado: true,
    ehAutor: false,
    expectedStatus: 403,
    expectedErrorMessage: 'Ação não permitida',
  },
];

// ─── RN016 – EP: nome duplicado com capitalização diferente (CT084) ──────────
const nomeCaseInsensitivoDuplicado = {
  overrides: { nome: 'BOLO DE CHOCOLATE' },
  expectedStatus: 409,
  expectedErrorMessage: 'Registro já existente',
};

// ─── RN019 – EP: nivelDificuldade ausente (CT085) ────────────────────────────
const nivelDificuldadeAusente = {
  body: {
    nome: 'Bolo Simples',
    ingredientes: ['farinha', 'açúcar'],
    modoPreparo: 'Misture e leve ao forno por 30 minutos.',
  },
  expectedStatus: 400,
};

// ─── RN023a – BVA: notas no limite máximo válido (CT087) ─────────────────────
const notasMaximoValido = {
  overrides: { notas: 'a'.repeat(500) },
  expectedStatus: 201,
};

// ─── RN025 – EP: edição aplica as mesmas validações do cadastro (CT088–CT090) ─
const edicaoValidacaoCases = [
  {
    ct: 'CT088',
    desc: 'modoPreparo com 9 chars (abaixo do mínimo)',
    overrides: { modoPreparo: 'Misturar.' },
    expectedStatus: 400,
  },
  {
    ct: 'CT089',
    desc: 'categoria com valor inválido',
    overrides: { categoria: 'Invalida' },
    expectedStatus: 400,
    expectedErrorField: 'categoria',
  },
  {
    ct: 'CT090',
    desc: 'nivelDificuldade com valor inválido',
    overrides: { nivelDificuldade: 'Extreme' },
    expectedStatus: 400,
  },
];

module.exports = {
  receitaValida,
  receitaAlternativa,
  receitaUsuarioB,
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
  edicaoValidacaoCases,
  receitaAtualizada,
  tabelaDecisaoEdicao,
  tabelaDecisaoExclusao,
};
