const { validateRegister, validateLogin } = require('../src/validators/userValidator');
const { validateCreate } = require('../src/validators/recipeValidator');

describe('validateRegister', () => {
  it('deve retornar erro quando todos os campos estão ausentes', () => {
    const errors = validateRegister({});
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe('Preenchimento obrigatório do(s) campo(s)');
  });

  it('deve retornar erro quando nome não é string', () => {
    const errors = validateRegister({ nome: null, email: null, senha: null });
    expect(errors[0].message).toBe('Preenchimento obrigatório do(s) campo(s)');
  });

  it('deve retornar sem erros para dados válidos', () => {
    const errors = validateRegister({ nome: 'João', email: 'joao@email.com', senha: '123456' });
    expect(errors.length).toBe(0);
  });
});

describe('validateLogin', () => {
  it('deve retornar erro quando email e senha ausentes', () => {
    const errors = validateLogin({});
    expect(errors[0].message).toBe('Preenchimento obrigatório do(s) campo(s)');
  });

  it('deve retornar sem erros para dados válidos', () => {
    const errors = validateLogin({ email: 'joao@email.com', senha: '123456' });
    expect(errors.length).toBe(0);
  });
});

describe('validateCreate - casos extras', () => {
  const base = {
    nome: 'Bolo Teste',
    ingredientes: ['farinha', 'açúcar'],
    modoPreparo: 'Misture e asse por 30 minutos no forno.',
    nivelDificuldade: 'Facil',
  };

  it('deve retornar sem erros para receita mínima válida', () => {
    const errors = validateCreate(base);
    expect(errors.length).toBe(0);
  });

  it('deve retornar erro quando nome é null', () => {
    const errors = validateCreate({ ...base, nome: null });
    expect(errors.some(e => e.field === 'nome')).toBe(true);
  });

  it('deve aceitar link null', () => {
    const errors = validateCreate({ ...base, link: null });
    expect(errors.length).toBe(0);
  });

  it('deve aceitar categoria null', () => {
    const errors = validateCreate({ ...base, categoria: null });
    expect(errors.length).toBe(0);
  });

  it('deve aceitar tempoPreparo null', () => {
    const errors = validateCreate({ ...base, tempoPreparo: null });
    expect(errors.length).toBe(0);
  });

  it('deve aceitar notas null', () => {
    const errors = validateCreate({ ...base, notas: null });
    expect(errors.length).toBe(0);
  });

  it('deve retornar erro quando ingredientes contém item não-string', () => {
    const errors = validateCreate({ ...base, ingredientes: [123, 'açúcar'] });
    expect(errors.some(e => e.field === 'ingredientes')).toBe(true);
  });

  it('deve retornar erro quando nivelDificuldade é null', () => {
    const errors = validateCreate({ ...base, nivelDificuldade: null });
    expect(errors.some(e => e.field === 'nivelDificuldade')).toBe(true);
  });

  it('deve ignorar notas quando não é string (sem erro de comprimento)', () => {
    const errors = validateCreate({ ...base, notas: 12345 });
    expect(errors.some(e => e.field === 'notas')).toBe(false);
  });
});
