const recipes = [];
const favorites = [];

const findAll = () => recipes;

const findById = (id) => recipes.find((r) => r.id === id);

const create = (recipe) => {
  recipes.push(recipe);
  return recipe;
};

const remove = (id) => {
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) return false;
  recipes.splice(index, 1);
  return true;
};

const findFavoritesByUser = (userId) =>
  favorites.filter((f) => f.userId === userId);

const findFavorite = (userId, recipeId) =>
  favorites.find((f) => f.userId === userId && f.recipeId === recipeId);

const update = (id, data) => {
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) return null;
  Object.assign(recipe, data);
  return recipe;
};

const addFavorite = (userId, recipeId) => {
  const fav = { userId, recipeId };
  favorites.push(fav);
  return fav;
};

const removeFavoritesByUser = (userId) => {
  for (let i = favorites.length - 1; i >= 0; i--) {
    if (favorites[i].userId === userId) {
      favorites.splice(i, 1);
    }
  }
};

const removeFavoritesForRecipe = (recipeId) => {
  for (let i = favorites.length - 1; i >= 0; i--) {
    if (favorites[i].recipeId === recipeId) {
      favorites.splice(i, 1);
    }
  }
};

const clear = () => {
  recipes.length = 0;
  favorites.length = 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  findFavoritesByUser,
  findFavorite,
  addFavorite,
  removeFavoritesByUser,
  removeFavoritesForRecipe,
  clear,
};
