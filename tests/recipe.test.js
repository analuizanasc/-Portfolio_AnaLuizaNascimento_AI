const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/userModel');
const recipeModel = require('../src/models/recipeModel');

let tokenA, tokenB, userAId, userBId;

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

beforeEach(async () => {
  userModel.clear();
  recipeModel.clear();

  await request(app).post('/users').send({ nome: 'User A', email: 'a@email.com', senha: 'senha123' });
  await request(app).post('/users').send({ nome: 'User B', email: 'b@email.com', senha: 'senha123' });

  const loginA = await request(app).post('/login').send({ email: 'a@email.com', senha: 'senha123' });
  const loginB = await request(app).post('/login').send({ email: 'b@email.com', senha: 'senha123' });
  tokenA = loginA.body.token;
  tokenB = loginB.body.token;

  const users = userModel.findAll();
  userAId = users.find(u => u.email === 'a@email.com').id;
  userBId = users.find(u => u.email === 'b@email.com').id;
});

describe('Autenticação middleware', () => {
  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/recipes?scope=me');
    expect(res.status).toBe(401);
    expect(res.body.errors[0].message).toBe('Token não fornecido');
  });

  it('deve retornar 401 sem prefixo Bearer', async () => {
    const res = await request(app).get('/recipes?scope=me').set('Authorization', 'invalid');
    expect(res.status).toBe(401);
  });

  it('deve retornar 401 com token inválido', async () => {
    const res = await request(app).get('/recipes?scope=me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.errors[0].message).toBe('Token inválido ou expirado');
  });
});

describe('POST /recipes', () => {
  it('deve cadastrar receita com dados válidos', async () => {
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(validRecipe);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registro cadastrado com sucesso!');
  });

  it('deve cadastrar receita sem campos opcionais', async () => {
    const res = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        nome: 'Arroz simples',
        ingredientes: ['arroz', 'água'],
        modoPreparo: 'Cozinhe o arroz na água com sal por 20 minutos.',
        nivelDificuldade: 'Facil',
      });
    expect(res.status).toBe(201);
  });

  it('deve retornar 409 quando receita com mesmo nome já existe para o usuário', async () => {
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toBe('Registro já existente');
  });

  it('deve permitir dois usuários com a mesma receita', async () => {
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenB}`).send(validRecipe);
    expect(res.status).toBe(201);
  });

  it('deve retornar 400 quando nome está ausente', async () => {
    const { nome, ...body } = validRecipe;
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(body);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando nome tem menos de 3 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, nome: 'AB' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando nome excede 50 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, nome: 'A'.repeat(51) });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando nome contém apenas espaços', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, nome: '   ' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando ingredientes não é array', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: 'farinha' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.message === 'Lista de ingredientes inválida')).toBe(true);
  });

  it('deve retornar 400 quando ingredientes tem menos de 2 itens', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: ['farinha'] });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando ingredientes excede 50 itens', async () => {
    const ing = Array.from({ length: 51 }, (_, i) => `ingrediente${i}`);
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: ing });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando ingrediente tem menos de 2 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: ['a', 'farinha'] });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando ingrediente excede 50 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: ['a'.repeat(51), 'farinha'] });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando há ingredientes duplicados', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: ['farinha', 'farinha'] });
    expect(res.status).toBe(400);
  });

  it('deve normalizar ingredientes para lowercase', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, ingredientes: ['FARINHA', 'AÇÚCAR', 'CHOCOLATE', 'OVOS'] });
    expect(res.status).toBe(201);
    const recipes = recipeModel.findAll();
    expect(recipes[0].ingredientes).toContain('farinha');
  });

  it('deve retornar 400 quando modoPreparo está ausente', async () => {
    const { modoPreparo, ...body } = validRecipe;
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(body);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando modoPreparo tem menos de 10 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, modoPreparo: 'Curto' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando modoPreparo excede 2000 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, modoPreparo: 'A'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando nivelDificuldade está ausente', async () => {
    const { nivelDificuldade, ...body } = validRecipe;
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(body);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando nivelDificuldade tem valor inválido', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, nivelDificuldade: 'SuperFacil' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.message === 'Valor inválido para o campo informado')).toBe(true);
  });

  it('deve retornar 400 quando categoria tem valor inválido', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, categoria: 'Invalida' });
    expect(res.status).toBe(400);
  });

  it('deve aceitar categoria com valor vazio', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, categoria: '' });
    expect(res.status).toBe(201);
  });

  it('deve retornar 400 quando tempoPreparo tem formato inválido', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, tempoPreparo: '1h30' });
    expect(res.status).toBe(400);
  });

  it('deve aceitar tempoPreparo com valor vazio', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, tempoPreparo: '' });
    expect(res.status).toBe(201);
  });

  it('deve retornar 400 quando notas excede 500 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, notas: 'A'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('deve aceitar notas com valor vazio', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, notas: '' });
    expect(res.status).toBe(201);
  });

  it('deve retornar 400 quando link excede 300 caracteres', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, link: 'a'.repeat(301) });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando link não é string', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, link: 123 });
    expect(res.status).toBe(400);
  });

  it('deve aceitar link com valor vazio', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, link: '' });
    expect(res.status).toBe(201);
  });

  it('deve aceitar link sem http/https', async () => {
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({ ...validRecipe, link: 'www.exemplo.com' });
    expect(res.status).toBe(201);
  });
});

describe('DELETE /recipes/:id', () => {
  let recipeId;

  beforeEach(async () => {
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    recipeId = recipeModel.findAll()[0].id;
  });

  it('deve excluir receita do dono', async () => {
    const res = await request(app).delete(`/recipes/${recipeId}`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Registro excluído com sucesso');
  });

  it('deve retornar 404 para receita inexistente', async () => {
    const res = await request(app).delete('/recipes/00000000-0000-0000-0000-000000000000').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(404);
    expect(res.body.errors[0].message).toBe('Registro não encontrado');
  });

  it('deve retornar 403 quando usuário não é o dono', async () => {
    const res = await request(app).delete(`/recipes/${recipeId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
    expect(res.body.errors[0].message).toBe('Ação não permitida');
  });
});

describe('GET /recipes', () => {
  beforeEach(async () => {
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenB}`).send({
      nome: 'Torta de Banana',
      ingredientes: ['banana', 'massa podre'],
      modoPreparo: 'Faça a massa e recheie com banana. Leve ao forno por 30 minutos.',
      nivelDificuldade: 'Facil',
    });
  });

  it('deve retornar 400 quando scope está ausente', async () => {
    const res = await request(app).get('/recipes').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe('O parâmetro scope é obrigatório');
  });

  it('deve retornar 400 quando scope tem valor inválido', async () => {
    const res = await request(app).get('/recipes?scope=other').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe("Valor inválido para scope. Use 'me' ou 'all'");
  });

  it('deve listar receitas do usuário com scope=me', async () => {
    const res = await request(app).get('/recipes?scope=me').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toBe('Bolo de Chocolate');
  });

  it('deve listar todas as receitas com scope=all', async () => {
    const res = await request(app).get('/recipes?scope=all').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('deve filtrar por nome com busca parcial e case insensitive', async () => {
    const res = await request(app).get('/recipes?scope=all&nome=bolo').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toBe('Bolo de Chocolate');
  });

  it('deve filtrar por ingrediente com busca parcial', async () => {
    const res = await request(app).get('/recipes?scope=all&ingrediente=choco').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('deve aplicar filtros combinados (AND)', async () => {
    const res = await request(app).get('/recipes?scope=all&nome=bolo&ingrediente=chocolate').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('deve retornar mensagem quando nenhuma receita é encontrada', async () => {
    const res = await request(app).get('/recipes?scope=all&nome=inexistente').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Nenhuma receita encontrada para os filtros informados');
    expect(res.body.data).toEqual([]);
  });

  it('deve marcar isFavorited=false para receitas próprias', async () => {
    const res = await request(app).get('/recipes?scope=me').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body[0].isFavorited).toBe(false);
  });

  it('deve incluir o autor na resposta', async () => {
    const res = await request(app).get('/recipes?scope=all').set('Authorization', `Bearer ${tokenA}`);
    expect(res.body[0].autor).toBeDefined();
    expect(res.body[0].autor.nome).toBeDefined();
  });

  it('deve retornar mensagem quando scope=me e usuário não tem receitas', async () => {
    userModel.clear();
    recipeModel.clear();
    await request(app).post('/users').send({ nome: 'User C', email: 'c@email.com', senha: 'senha123' });
    const loginC = await request(app).post('/login').send({ email: 'c@email.com', senha: 'senha123' });
    const tokenC = loginC.body.token;
    const res = await request(app).get('/recipes?scope=me').set('Authorization', `Bearer ${tokenC}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('POST /recipes/:id/favorite', () => {
  let recipeIdA;

  beforeEach(async () => {
    await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(validRecipe);
    recipeIdA = recipeModel.findAll()[0].id;
  });

  it('deve favoritar receita de outro usuário', async () => {
    const res = await request(app)
      .post(`/recipes/${recipeIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Receita favoritada com sucesso');
  });

  it('deve retornar 404 para receita inexistente', async () => {
    const res = await request(app)
      .post('/recipes/00000000-0000-0000-0000-000000000000/favorite')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
    expect(res.body.errors[0].message).toBe('Registro não encontrado');
  });

  it('deve retornar 403 ao tentar favoritar a própria receita', async () => {
    const res = await request(app)
      .post(`/recipes/${recipeIdA}/favorite`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(403);
    expect(res.body.errors[0].message).toBe('Não é permitido favoritar sua própria receita');
  });

  it('deve retornar 409 ao favoritar receita já favoritada', async () => {
    await request(app).post(`/recipes/${recipeIdA}/favorite`).set('Authorization', `Bearer ${tokenB}`);
    const res = await request(app).post(`/recipes/${recipeIdA}/favorite`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toBe('Receita já favoritada');
  });

  it('deve aparecer na listagem de receitas do usuário que favoritou (scope=me)', async () => {
    await request(app).post(`/recipes/${recipeIdA}/favorite`).set('Authorization', `Bearer ${tokenB}`);
    const res = await request(app).get('/recipes?scope=me').set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const fav = res.body.find(r => r.id === recipeIdA);
    expect(fav).toBeDefined();
    expect(fav.isFavorited).toBe(true);
    expect(fav.autor.id).toBe(userAId);
  });

  it('deve marcar isFavorited=true na listagem scope=all para receita favoritada', async () => {
    await request(app).post(`/recipes/${recipeIdA}/favorite`).set('Authorization', `Bearer ${tokenB}`);
    const res = await request(app).get('/recipes?scope=all').set('Authorization', `Bearer ${tokenB}`);
    const fav = res.body.find(r => r.id === recipeIdA);
    expect(fav.isFavorited).toBe(true);
  });

  it('deve excluir favoritos ao deletar a receita', async () => {
    await request(app).post(`/recipes/${recipeIdA}/favorite`).set('Authorization', `Bearer ${tokenB}`);
    await request(app).delete(`/recipes/${recipeIdA}`).set('Authorization', `Bearer ${tokenA}`);
    const res = await request(app).get('/recipes?scope=me').set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('Validador de receita - cobertura adicional', () => {
  it('deve retornar 400 quando ingredientes está ausente', async () => {
    const { ingredientes, ...body } = validRecipe;
    const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send(body);
    expect(res.status).toBe(400);
  });

  it('deve aceitar todas as categorias válidas', async () => {
    const categorias = ['Doce', 'Salgada', 'Sem_gluten', 'Sem_lactose', 'Sem_acucar_refinado'];
    for (const [i, categoria] of categorias.entries()) {
      const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({
        ...validRecipe,
        nome: `Receita ${i}`,
        categoria,
      });
      expect(res.status).toBe(201);
    }
  });

  it('deve aceitar todos os niveis de dificuldade válidos', async () => {
    const niveis = ['Facil', 'Media', 'Dificil'];
    for (const [i, nivelDificuldade] of niveis.entries()) {
      const res = await request(app).post('/recipes').set('Authorization', `Bearer ${tokenA}`).send({
        ...validRecipe,
        nome: `Receita nivel ${i}`,
        nivelDificuldade,
      });
      expect(res.status).toBe(201);
    }
  });
});
