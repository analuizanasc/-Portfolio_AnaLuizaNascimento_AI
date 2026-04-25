const validateRegister = (body) => {
  const errors = [];
  const { nome, email, senha } = body;

  const trimmedNome = typeof nome === 'string' ? nome.trim() : nome;
  const trimmedEmail = typeof email === 'string' ? email.trim() : email;
  const trimmedSenha = typeof senha === 'string' ? senha.trim() : senha;

  if (!trimmedNome || !trimmedEmail || !trimmedSenha) {
    errors.push({ field: 'geral', message: 'Preenchimento obrigatório do(s) campo(s)' });
    return errors;
  }

  if (trimmedNome.length > 100) {
    errors.push({ field: 'nome', message: 'Número máximo de caracteres excedido' });
  } else if (trimmedNome.length < 3) {
    errors.push({ field: 'nome', message: 'Preenchimento obrigatório do(s) campo(s)' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push({ field: 'email', message: 'Formato de e-mail inválido' });
  } else if (trimmedEmail.length > 150) {
    errors.push({ field: 'email', message: 'Número máximo de caracteres excedido' });
  }

  if (trimmedSenha.length > 100) {
    errors.push({ field: 'senha', message: 'Número máximo de caracteres excedido' });
  } else if (trimmedSenha.length < 6) {
    errors.push({ field: 'senha', message: 'Preenchimento obrigatório do(s) campo(s)' });
  }

  return errors;
};

const validateLogin = (body) => {
  const errors = [];
  const { email, senha } = body;

  const trimmedEmail = typeof email === 'string' ? email.trim() : email;
  const trimmedSenha = typeof senha === 'string' ? senha.trim() : senha;

  if (!trimmedEmail || !trimmedSenha) {
    errors.push({ field: 'geral', message: 'Preenchimento obrigatório do(s) campo(s)' });
  }

  return errors;
};

module.exports = { validateRegister, validateLogin };
