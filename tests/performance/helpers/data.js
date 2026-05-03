const DIFFICULTIES = ['Facil', 'Media', 'Dificil'];
const CATEGORIES = ['Doce', 'Salgada', 'Sem_gluten', 'Sem_lactose', 'Sem_acucar_refinado'];
const PREP_TIMES = ['15:00', '30:00', '45:00', '60:00', '90:00'];

export function generateUser(suffix) {
  return {
    nome: `Perf User ${suffix}`.substring(0, 100),
    email: `perf_${suffix}@perf.test`.substring(0, 150),
    senha: 'senha123',
  };
}

export function generateRecipe(suffix) {
  const idx = Math.abs(String(suffix).charCodeAt(0) || 0);
  return {
    nome: `Receita ${suffix}`.substring(0, 50),
    ingredientes: ['farinha de trigo', 'ovos inteiros', 'leite integral'],
    modoPreparo: `Modo de preparo da receita ${suffix}. Misture todos os ingredientes em uma tigela grande e asse por 30 minutos no forno preaquecido.`,
    nivelDificuldade: DIFFICULTIES[idx % DIFFICULTIES.length],
    categoria: CATEGORIES[idx % CATEGORIES.length],
    tempoPreparo: PREP_TIMES[idx % PREP_TIMES.length],
  };
}

export function vuId() {
  return `${__VU}_${__ITER}`;
}
