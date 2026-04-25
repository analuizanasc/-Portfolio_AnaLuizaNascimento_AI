const recipeService = require('../src/services/recipeService');
const recipeModel = require('../src/models/recipeModel');
const userModel = require('../src/models/userModel');

beforeEach(() => {
  userModel.clear();
  recipeModel.clear();
});

describe('buildRecipeResponse - autor não encontrado', () => {
  it('deve retornar Desconhecido quando autor não existe no modelo', () => {
    const recipe = {
      id: 'recipe-id',
      nome: 'Receita Órfã',
      link: null,
      ingredientes: ['ovo', 'sal'],
      modoPreparo: 'Modo de preparo qualquer',
      nivelDificuldade: 'Facil',
      categoria: null,
      tempoPreparo: null,
      notas: null,
      autorId: 'id-nao-existente',
    };
    recipeModel.create(recipe);
    const result = recipeService.buildRecipeResponse(recipe, 'outro-user-id');
    expect(result.autor.nome).toBe('Desconhecido');
    expect(result.autor.id).toBe('id-nao-existente');
  });
});

describe('buildRecipeResponse - campos opcionais null', () => {
  it('deve retornar null para link, categoria, tempoPreparo e notas ausentes', async () => {
    userModel.create({ id: 'user1', nome: 'User', email: 'u@u.com', senha: 'hash' });
    const recipe = {
      id: 'recipe2',
      nome: 'Simples',
      link: null,
      ingredientes: ['arroz', 'água'],
      modoPreparo: 'Cozinhe',
      nivelDificuldade: 'Facil',
      categoria: null,
      tempoPreparo: null,
      notas: null,
      autorId: 'user1',
    };
    recipeModel.create(recipe);
    const result = recipeService.buildRecipeResponse(recipe, 'user1');
    expect(result.link).toBeNull();
    expect(result.categoria).toBeNull();
    expect(result.tempoPreparo).toBeNull();
    expect(result.notas).toBeNull();
  });
});

describe('recipeModel.remove - id inexistente', () => {
  it('deve retornar false quando id não existe', () => {
    const result = recipeModel.remove('id-nao-existe');
    expect(result).toBe(false);
  });
});

describe('recipeModel.removeFavoritesForRecipe - favoritos de outras receitas não são removidos', () => {
  it('deve remover apenas favoritos da receita alvo, mantendo os demais', () => {
    recipeModel.addFavorite('user1', 'recipe-a');
    recipeModel.addFavorite('user1', 'recipe-b');

    recipeModel.removeFavoritesForRecipe('recipe-a');

    expect(recipeModel.findFavorite('user1', 'recipe-a')).toBeUndefined();
    expect(recipeModel.findFavorite('user1', 'recipe-b')).toBeDefined();
  });
});

describe('recipeModel.update - id inexistente', () => {
  it('deve retornar null quando id não existe', () => {
    const result = recipeModel.update('id-nao-existe', { nome: 'Qualquer' });
    expect(result).toBeNull();
  });
});

describe('recipeModel.removeFavoritesByUser - favoritos de outros usuários não são removidos', () => {
  it('deve remover apenas favoritos do usuário alvo, mantendo os de outros', () => {
    recipeModel.addFavorite('user-a', 'recipe-1');
    recipeModel.addFavorite('user-b', 'recipe-1');

    recipeModel.removeFavoritesByUser('user-a');

    expect(recipeModel.findFavorite('user-a', 'recipe-1')).toBeUndefined();
    expect(recipeModel.findFavorite('user-b', 'recipe-1')).toBeDefined();
  });
});

describe('userModel.remove - id inexistente', () => {
  it('deve retornar false quando id não existe', () => {
    const userModel = require('../src/models/userModel');
    const result = userModel.remove('id-nao-existe');
    expect(result).toBe(false);
  });
});
