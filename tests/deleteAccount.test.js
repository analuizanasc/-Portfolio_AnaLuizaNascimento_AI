const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/userModel');
const recipeModel = require('../src/models/recipeModel');

const validRecipe = {
  nome: 'Bolo de Cenoura',
  ingredientes: ['cenoura', 'farinha', 'ovos'],
  modoPreparo: 'Bata tudo no liquidificador e leve ao forno por 40 minutos a 180 graus.',
  nivelDificuldade: 'Facil',
};

beforeEach(async () => {
  userModel.clear();
  recipeModel.clear();
});

const setup = async () => {
  await request(app).post('/users').send({ nome: 'User A', email: 'a@email.com', senha: 'senha123' });
  await request(app).post('/users').send({ nome: 'User B', email: 'b@email.com', senha: 'senha123' });
  const loginA = await request(app).post('/login').send({ email: 'a@email.com', senha: 'senha123' });
  const loginB = await request(app).post('/login').send({ email: 'b@email.com', senha: 'senha123' });
  return { tokenA: loginA.body.token, tokenB: loginB.body.token };
};

describe('DELETE /users/me', () => {
  it('deve excluir a própria conta com sucesso', async () => {
    const { tokenA } = await setup();
    const res = await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Conta excluída com sucesso');
  });

  it('deve manter as receitas do usuário no sistema ao excluir a conta', async () => {
    const { tokenA } = await setup();
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    expect(recipeModel.findAll().length).toBe(1);

    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);
    expect(recipeModel.findAll().length).toBe(1);
  });

  it('deve remover favoritos feitos pelo usuário ao excluir a conta', async () => {
    const { tokenA, tokenB } = await setup();
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    const recipeId = recipeModel.findAll()[0].id;
    await request(app).post(`/recipes/${recipeId}/favorite`).set('Authorization', `Bearer ${tokenB}`);
    expect(recipeModel.findFavorite(userModel.findAll()[1].id, recipeId)).toBeDefined();

    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenB}`);
    expect(recipeModel.findAll().length).toBe(1);
    expect(recipeModel.findFavoritesByUser(userModel.findAll().find(u => u.email === 'b@email.com')?.id ?? 'deleted').length).toBe(0);
  });

  it('deve manter receita e favoritos de outros usuários ao excluir a conta do autor', async () => {
    const { tokenA, tokenB } = await setup();
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    const recipeId = recipeModel.findAll()[0].id;
    await request(app).post(`/recipes/${recipeId}/favorite`).set('Authorization', `Bearer ${tokenB}`);

    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);

    expect(recipeModel.findAll().length).toBe(1);
    const userB = userModel.findAll().find((u) => u.email === 'b@email.com');
    expect(recipeModel.findFavorite(userB.id, recipeId)).toBeDefined();
  });

  it('deve manter receita favoritada acessível no scope=me após o autor excluir a conta', async () => {
    const { tokenA, tokenB } = await setup();
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    const recipeId = recipeModel.findAll()[0].id;
    await request(app).post(`/recipes/${recipeId}/favorite`).set('Authorization', `Bearer ${tokenB}`);

    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app).get('/recipes?scope=me').set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const fav = res.body.find((r) => r.id === recipeId);
    expect(fav).toBeDefined();
    expect(fav.isFavorited).toBe(true);
    expect(fav.autor.nome).toBe('Desconhecido');
  });

  it('deve impedir login após exclusão da conta', async () => {
    const { tokenA } = await setup();
    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);
    const res = await request(app).post('/login').send({ email: 'a@email.com', senha: 'senha123' });
    expect(res.status).toBe(401);
    expect(res.body.errors[0].message).toBe('E-mail não cadastrado');
  });

  it('deve retornar 404 ao tentar excluir conta já removida (token ainda válido)', async () => {
    const { tokenA } = await setup();
    await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);
    const res = await request(app).delete('/users/me').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.errors[0].message).toBe('Registro não encontrado');
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).delete('/users/me');
    expect(res.status).toBe(401);
  });
});
