const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/userModel');

beforeEach(() => {
  userModel.clear();
});

describe('POST /users', () => {
  const validUser = { nome: 'João Silva', email: 'joao@email.com', senha: 'senha123' };

  it('deve cadastrar usuário com dados válidos', async () => {
    const res = await request(app).post('/users').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Cadastro realizado com sucesso');
    expect(res.body.id).toBeDefined();
  });

  it('deve retornar 400 quando nome está ausente', async () => {
    const res = await request(app).post('/users').send({ email: 'a@b.com', senha: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe('Preenchimento obrigatório do(s) campo(s)');
  });

  it('deve retornar 400 quando email está ausente', async () => {
    const res = await request(app).post('/users').send({ nome: 'Test', senha: '123456' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando senha está ausente', async () => {
    const res = await request(app).post('/users').send({ nome: 'Test', email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando nome tem menos de 3 caracteres', async () => {
    const res = await request(app).post('/users').send({ nome: 'AB', email: 'a@b.com', senha: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe('Preenchimento obrigatório do(s) campo(s)');
  });

  it('deve retornar 400 quando nome excede 100 caracteres', async () => {
    const res = await request(app).post('/users').send({ nome: 'A'.repeat(101), email: 'a@b.com', senha: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe('Número máximo de caracteres excedido');
  });

  it('deve retornar 400 quando email tem formato inválido', async () => {
    const res = await request(app).post('/users').send({ nome: 'Test', email: 'invalido', senha: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.message === 'Formato de e-mail inválido')).toBe(true);
  });

  it('deve retornar 400 quando email excede 150 caracteres', async () => {
    const email = 'a'.repeat(145) + '@b.com';
    const res = await request(app).post('/users').send({ nome: 'Test', email, senha: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.message === 'Número máximo de caracteres excedido')).toBe(true);
  });

  it('deve retornar 400 quando senha tem menos de 6 caracteres', async () => {
    const res = await request(app).post('/users').send({ nome: 'Test', email: 'a@b.com', senha: '123' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 quando senha excede 100 caracteres', async () => {
    const res = await request(app).post('/users').send({ nome: 'Test', email: 'a@b.com', senha: 'A'.repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.message === 'Número máximo de caracteres excedido')).toBe(true);
  });

  it('deve retornar 409 quando email já está cadastrado', async () => {
    await request(app).post('/users').send(validUser);
    const res = await request(app).post('/users').send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toBe('E-mail já cadastrado');
  });

  it('deve aplicar trim nos campos', async () => {
    const res = await request(app).post('/users').send({ nome: '  João  ', email: '  joao@email.com  ', senha: '  senha123  ' });
    expect(res.status).toBe(201);
  });
});

describe('POST /login', () => {
  beforeEach(async () => {
    await request(app).post('/users').send({ nome: 'João', email: 'joao@email.com', senha: 'senha123' });
  });

  it('deve retornar token com credenciais válidas', async () => {
    const res = await request(app).post('/login').send({ email: 'joao@email.com', senha: 'senha123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('deve retornar 400 quando email está ausente', async () => {
    const res = await request(app).post('/login').send({ senha: 'senha123' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toBe('Preenchimento obrigatório do(s) campo(s)');
  });

  it('deve retornar 400 quando senha está ausente', async () => {
    const res = await request(app).post('/login').send({ email: 'joao@email.com' });
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 quando email não está cadastrado', async () => {
    const res = await request(app).post('/login').send({ email: 'naoexiste@email.com', senha: 'senha123' });
    expect(res.status).toBe(401);
    expect(res.body.errors[0].message).toBe('E-mail não cadastrado');
  });

  it('deve retornar 401 quando senha está incorreta', async () => {
    const res = await request(app).post('/login').send({ email: 'joao@email.com', senha: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.errors[0].message).toBe('Senha incorreta');
  });
});
