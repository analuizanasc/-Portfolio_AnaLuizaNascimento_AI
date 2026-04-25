const VALID_CATEGORIAS = ['Doce', 'Salgada', 'Sem_gluten', 'Sem_lactose', 'Sem_acucar_refinado'];
const VALID_NIVEIS = ['Facil', 'Media', 'Dificil'];
const TEMPO_REGEX = /^\d{2}:\d{2}$/;

const validateCreate = (body) => {
  const errors = [];
  const { nome, link, ingredientes, modoPreparo, nivelDificuldade, categoria, tempoPreparo, notas } = body;

  const trimmedNome = typeof nome === 'string' ? nome.trim() : nome;

  if (!trimmedNome) {
    errors.push({ field: 'nome', message: 'Preenchimento obrigatório do(s) campo(s)' });
  } else if (trimmedNome.length < 3) {
    errors.push({ field: 'nome', message: 'Preenchimento obrigatório do(s) campo(s)' });
  } else if (trimmedNome.length > 50) {
    errors.push({ field: 'nome', message: 'Número máximo de caracteres excedido' });
  }

  if (link !== undefined && link !== null && link !== '') {
    if (typeof link !== 'string') {
      errors.push({ field: 'link', message: 'Valor inválido para o campo informado' });
    } else if (link.trim().length > 300) {
      errors.push({ field: 'link', message: 'Número máximo de caracteres excedido' });
    }
  }

  if (!ingredientes || !Array.isArray(ingredientes)) {
    errors.push({ field: 'ingredientes', message: 'Lista de ingredientes inválida' });
  } else {
    if (ingredientes.length < 2 || ingredientes.length > 50) {
      errors.push({ field: 'ingredientes', message: 'Lista de ingredientes inválida' });
    } else {
      const normalized = ingredientes.map((i) =>
        typeof i === 'string' ? i.trim().toLowerCase() : i
      );
      const hasInvalidItem = normalized.some(
        (i) => typeof i !== 'string' || i.length < 2 || i.length > 50
      );
      if (hasInvalidItem) {
        errors.push({ field: 'ingredientes', message: 'Lista de ingredientes inválida' });
      } else {
        const unique = new Set(normalized);
        if (unique.size !== normalized.length) {
          errors.push({ field: 'ingredientes', message: 'Lista de ingredientes inválida' });
        }
      }
    }
  }

  const trimmedModo = typeof modoPreparo === 'string' ? modoPreparo.trim() : modoPreparo;
  if (!trimmedModo) {
    errors.push({ field: 'modoPreparo', message: 'Preenchimento obrigatório do(s) campo(s)' });
  } else if (trimmedModo.length < 10) {
    errors.push({ field: 'modoPreparo', message: 'Preenchimento obrigatório do(s) campo(s)' });
  } else if (trimmedModo.length > 2000) {
    errors.push({ field: 'modoPreparo', message: 'Número máximo de caracteres excedido' });
  }

  if (!nivelDificuldade) {
    errors.push({ field: 'nivelDificuldade', message: 'Preenchimento obrigatório do(s) campo(s)' });
  } else if (!VALID_NIVEIS.includes(nivelDificuldade)) {
    errors.push({ field: 'nivelDificuldade', message: 'Valor inválido para o campo informado' });
  }

  if (categoria !== undefined && categoria !== null && categoria !== '') {
    if (!VALID_CATEGORIAS.includes(categoria)) {
      errors.push({ field: 'categoria', message: 'Valor inválido para o campo informado' });
    }
  }

  if (tempoPreparo !== undefined && tempoPreparo !== null && tempoPreparo !== '') {
    if (!TEMPO_REGEX.test(tempoPreparo)) {
      errors.push({ field: 'tempoPreparo', message: 'Valor inválido para o campo informado' });
    }
  }

  if (notas !== undefined && notas !== null && notas !== '') {
    const trimmedNotas = typeof notas === 'string' ? notas.trim() : notas;
    if (typeof trimmedNotas === 'string' && trimmedNotas.length > 500) {
      errors.push({ field: 'notas', message: 'Número máximo de caracteres excedido' });
    }
  }

  return errors;
};

module.exports = { validateCreate, VALID_CATEGORIAS, VALID_NIVEIS };
