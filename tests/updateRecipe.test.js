const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/userModel');
const recipeModel = require('../src/models/recipeModel');

const validRecipe = {
  nome: 'Bolo de Chocolate',
  ingredientes: ['farinha', 'açúcar', 'chocolate', 'ovos'],
  modoPreparo: 'Misture todos os ingredientes e leve ao forno por 40 minutos a 180 graus.',
  nivelDificuldade: 'Media',
  categoria: 'Doce',
  tempoPreparo: '01:00',
  notas: 'Servir gelado',
  link: 'https://exemplo.com',
};

const updatedRecipe = {
  nome: 'Bolo de Chocolate Especial',
  ingredientes: ['farinha', 'açúcar', 'chocolate amargo', 'ovos'],
  modoPreparo: 'Misture todos e leve ao forno por 45 minutos a 180 graus com forma untada.',
  nivelDificuldade: 'Dificil',
  categoria: 'Doce',
  tempoPreparo: '01:30',
  notas: 'Servir com sorvete',
  link: 'https://exemplo.com/especial',
};

let tokenA, tokenB, recipeId;

beforeEach(async () => {
  userModel.clear();
  recipeModel.clear();

  await request(app).post('/users').send({ nome: 'User A', email: 'a@email.com', senha: 'senha123' });
  await request(app).post('/users').send({ nome: 'User B', email: 'b@email.com', senha: 'senha123' });

  const loginA = await request(app).post('/login').send({ email: 'a@email.com', senha: 'senha123' });
  const loginB = await request(app).post('/login').send({ email: 'b@email.com', senha: 'senha123' });
  tokenA = loginA.body.token;
  tokenB = loginB.body.token;

  await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
  recipeId = recipeModel.findAll()[0].id;
});

describe('PUT /recipes/:id', () => {
  it('deve atualizar a receita com dados válidos', async () => {
    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(updatedRecipe);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Registro atualizado com sucesso');
  });

  it('deve persistir as alterações na receita', async () => {
    await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(updatedRecipe);
    const recipe = recipeModel.findById(recipeId);
    expect(recipe.nome).toBe('Bolo de Chocolate Especial');
    expect(recipe.nivelDificuldade).toBe('Dificil');
    expect(recipe.ingredientes).toContain('chocolate amargo');
  });

  it('deve permitir atualizar mantendo o mesmo nome (sem conflito consigo mesmo)', async () => {
    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...validRecipe, notas: 'Atualizado' });
    expect(res.status).toBe(200);
  });

  it('deve retornar 409 quando o novo nome já existe em outra receita do usuário', async () => {
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({
      nome: 'Torta de Limão',
      ingredientes: ['limão', 'leite condensado'],
      modoPreparo: 'Misture e leve à geladeira por 2 horas antes de servir.',
      nivelDificuldade: 'Facil',
    });

    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...validRecipe, nome: 'Torta de Limão' });
    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toBe('Registro já existente');
  });

  it('deve retornar 404 para receita inexistente', async () => {
    const res = await request(app)
      .put('/recipes/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(updatedRecipe);
    expect(res.status).toBe(404);
    expect(res.body.errors[0].message).toBe('Registro não encontrado');
  });

  it('deve retornar 403 quando usuário não é o dono', async () => {
    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send(updatedRecipe);
    expect(res.status).toBe(403);
    expect(res.body.errors[0].message).toBe('Ação não permitida');
  });

  it('deve retornar 400 com payload inválido', async () => {
    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...updatedRecipe, nivelDificuldade: 'Invalido' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.message === 'Valor inválido para o campo informado')).toBe(true);
  });

  it('deve retornar 400 quando nome está ausente', async () => {
    const { nome, ...body } = updatedRecipe;
    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).put(`/recipes/${recipeId}`).send(updatedRecipe);
    expect(res.status).toBe(401);
  });

  it('deve normalizar ingredientes para lowercase na atualização', async () => {
    await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...updatedRecipe, ingredientes: ['FARINHA', 'AÇÚCAR', 'CHOCOLATE AMARGO', 'OVOS'] });
    const recipe = recipeModel.findById(recipeId);
    expect(recipe.ingredientes).toContain('farinha');
    expect(recipe.ingredientes).toContain('chocolate amargo');
  });

  it('deve atualizar receita sem campos opcionais (link, categoria, tempoPreparo, notas)', async () => {
    const res = await request(app)
      .put(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        nome: 'Bolo Simples',
        ingredientes: ['farinha', 'ovos', 'açúcar'],
        modoPreparo: 'Misture tudo e leve ao forno por 30 minutos.',
        nivelDificuldade: 'Facil',
      });
    expect(res.status).toBe(200);
    const recipe = recipeModel.findById(recipeId);
    expect(recipe.link).toBeNull();
    expect(recipe.categoria).toBeNull();
    expect(recipe.tempoPreparo).toBeNull();
    expect(recipe.notas).toBeNull();
  });
});
