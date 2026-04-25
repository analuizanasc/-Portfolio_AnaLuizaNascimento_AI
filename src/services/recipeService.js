const { v4: uuidv4 } = require('uuid');
const recipeModel = require('../models/recipeModel');
const userModel = require('../models/userModel');

const normalizeIngredients = (ingredientes) =>
  ingredientes.map((i) => i.trim().toLowerCase());

const buildRecipeResponse = (recipe, userId) => {
  const author = userModel.findById(recipe.autorId);
  const fav = recipeModel.findFavorite(userId, recipe.id);
  return {
    id: recipe.id,
    nome: recipe.nome,
    link: recipe.link || null,
    ingredientes: recipe.ingredientes,
    modoPreparo: recipe.modoPreparo,
    nivelDificuldade: recipe.nivelDificuldade,
    categoria: recipe.categoria || null,
    tempoPreparo: recipe.tempoPreparo || null,
    notas: recipe.notas || null,
    isFavorited: !!fav,
    autor: {
      id: author ? author.id : recipe.autorId,
      nome: author ? author.nome : 'Desconhecido',
    },
  };
};

const create = (body, userId) => {
  const nome = body.nome.trim();
  const ingredientes = normalizeIngredients(body.ingredientes);
  const modoPreparo = body.modoPreparo.trim();
  const nivelDificuldade = body.nivelDificuldade;
  const link = body.link ? body.link.trim() : null;
  const categoria = body.categoria || null;
  const tempoPreparo = body.tempoPreparo || null;
  const notas = body.notas ? body.notas.trim() : null;

  const allRecipes = recipeModel.findAll();
  const exists = allRecipes.find(
    (r) => r.nome.toLowerCase() === nome.toLowerCase() && r.autorId === userId
  );
  if (exists) {
    return { status: 409, errors: [{ field: 'nome', message: 'Registro já existente' }] };
  }

  const recipe = recipeModel.create({
    id: uuidv4(),
    nome,
    link,
    ingredientes,
    modoPreparo,
    nivelDificuldade,
    categoria,
    tempoPreparo,
    notas,
    autorId: userId,
  });

  return { status: 201, data: { message: 'Registro cadastrado com sucesso!' } };
};

const remove = (recipeId, userId) => {
  const recipe = recipeModel.findById(recipeId);
  if (!recipe) {
    return { status: 404, errors: [{ field: 'id', message: 'Registro não encontrado' }] };
  }
  if (recipe.autorId !== userId) {
    return { status: 403, errors: [{ field: 'id', message: 'Ação não permitida' }] };
  }
  recipeModel.removeFavoritesForRecipe(recipeId);
  recipeModel.remove(recipeId);
  return { status: 200, data: { message: 'Registro excluído com sucesso' } };
};

const applyFilters = (recipes, nome, ingrediente) => {
  let result = recipes;
  if (nome) {
    const nomeLower = nome.toLowerCase();
    result = result.filter((r) => r.nome.toLowerCase().includes(nomeLower));
  }
  if (ingrediente) {
    const ingLower = ingrediente.toLowerCase();
    result = result.filter((r) =>
      r.ingredientes.some((i) => i.toLowerCase().includes(ingLower))
    );
  }
  return result;
};

const list = (query, userId) => {
  const { scope, nome, ingrediente } = query;

  if (!scope) {
    return {
      status: 400,
      errors: [{ field: 'scope', message: 'O parâmetro scope é obrigatório' }],
    };
  }

  if (scope !== 'me' && scope !== 'all') {
    return {
      status: 400,
      errors: [{ field: 'scope', message: "Valor inválido para scope. Use 'me' ou 'all'" }],
    };
  }

  let pool = [];

  if (scope === 'me') {
    const owned = recipeModel.findAll().filter((r) => r.autorId === userId);
    const favs = recipeModel.findFavoritesByUser(userId);
    const favRecipes = favs
      .map((f) => recipeModel.findById(f.recipeId))
      .filter(Boolean);
    const favIds = new Set(favRecipes.map((r) => r.id));
    const ownedNotFav = owned.filter((r) => !favIds.has(r.id));
    pool = [...ownedNotFav, ...favRecipes];
  } else {
    pool = recipeModel.findAll();
  }

  const filtered = applyFilters(pool, nome, ingrediente);

  if (filtered.length === 0) {
    return {
      status: 200,
      data: {
        message: 'Nenhuma receita encontrada para os filtros informados',
        data: [],
      },
    };
  }

  const result = filtered.map((r) => buildRecipeResponse(r, userId));
  return { status: 200, data: result };
};

const favorite = (recipeId, userId) => {
  const recipe = recipeModel.findById(recipeId);
  if (!recipe) {
    return { status: 404, errors: [{ field: 'id', message: 'Registro não encontrado' }] };
  }

  if (recipe.autorId === userId) {
    return {
      status: 403,
      errors: [{ field: 'id', message: 'Não é permitido favoritar sua própria receita' }],
    };
  }

  const already = recipeModel.findFavorite(userId, recipeId);
  if (already) {
    return { status: 409, errors: [{ field: 'id', message: 'Receita já favoritada' }] };
  }

  recipeModel.addFavorite(userId, recipeId);
  return { status: 200, data: { message: 'Receita favoritada com sucesso' } };
};

const update = (recipeId, body, userId) => {
  const recipe = recipeModel.findById(recipeId);
  if (!recipe) {
    return { status: 404, errors: [{ field: 'id', message: 'Registro não encontrado' }] };
  }
  if (recipe.autorId !== userId) {
    return { status: 403, errors: [{ field: 'id', message: 'Ação não permitida' }] };
  }

  const nome = body.nome.trim();
  const ingredientes = normalizeIngredients(body.ingredientes);
  const modoPreparo = body.modoPreparo.trim();
  const nivelDificuldade = body.nivelDificuldade;
  const link = body.link ? body.link.trim() : null;
  const categoria = body.categoria || null;
  const tempoPreparo = body.tempoPreparo || null;
  const notas = body.notas ? body.notas.trim() : null;

  const duplicate = recipeModel
    .findAll()
    .find(
      (r) =>
        r.nome.toLowerCase() === nome.toLowerCase() &&
        r.autorId === userId &&
        r.id !== recipeId
    );
  if (duplicate) {
    return { status: 409, errors: [{ field: 'nome', message: 'Registro já existente' }] };
  }

  recipeModel.update(recipeId, { nome, link, ingredientes, modoPreparo, nivelDificuldade, categoria, tempoPreparo, notas });
  return { status: 200, data: { message: 'Registro atualizado com sucesso' } };
};

module.exports = { create, update, remove, list, favorite, buildRecipeResponse, applyFilters };
