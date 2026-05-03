/**
 * Load Test — simula carga normal de uso com múltiplos cenários concorrentes.
 *
 * Cenários:
 *   navegacao_receitas  — usuários navegando (leitura), 10 VUs por 2 min
 *   gestao_receitas     — criação e exclusão de receitas, ramp 0→8 VUs
 *   ciclo_completo      — jornada completa: registro → CRUD → exclusão de conta
 *
 * Execução:
 *   k6 run tests/performance/load.test.js
 *   k6 run --env BASE_URL=http://localhost:4000 tests/performance/load.test.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, JSON_HEADERS, authHeaders, registerUser, loginUser } from './helpers/auth.js';
import { generateUser, generateRecipe } from './helpers/data.js';

export const options = {
  scenarios: {
    navegacao_receitas: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'navegacaoReceitas',
      tags: { scenario: 'navegacao' },
    },
    gestao_receitas: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '1m', target: 8 },
        { duration: '20s', target: 0 },
      ],
      exec: 'gestaoReceitas',
      startTime: '10s',
      tags: { scenario: 'gestao' },
    },
    ciclo_completo: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 3,
      exec: 'cicloCompleto',
      startTime: '20s',
      tags: { scenario: 'ciclo' },
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{scenario:navegacao}': ['p(95)<400'],
    'http_req_duration{scenario:gestao}': ['p(95)<700'],
    'http_req_duration{scenario:ciclo}': ['p(95)<1200'],
  },
};

// ── Estado por VU (cada VU tem seu próprio contexto JS) ──────────────────────

let navToken = null;
let navReady = false;

let gestaoToken = null;
let gestaoReady = false;

// ── Cenário 1: Navegação (leitura intensiva) ──────────────────────────────────

export function navegacaoReceitas() {
  if (!navReady) {
    navReady = true;
    const user = generateUser(`nav_${__VU}_${Date.now()}`);
    const reg = registerUser(user);
    if (reg.status === 201) {
      navToken = loginUser(user.email, user.senha);
    }
    // Cria receitas para ter dados a navegar
    if (navToken) {
      for (let i = 0; i < 3; i++) {
        http.post(
          `${BASE_URL}/recipes`,
          JSON.stringify(generateRecipe(`nav_${__VU}_init_${i}`)),
          { headers: authHeaders(navToken) }
        );
      }
    }
  }

  if (!navToken) { sleep(2); return; }

  group('Navegação', () => {
    const res = http.get(`${BASE_URL}/recipes?scope=all`, { headers: authHeaders(navToken) });
    check(res, { 'browse all → 200': (r) => r.status === 200 });
  });

  sleep(1 + Math.random() * 2);
}

// ── Cenário 2: Gestão de receitas (escrita + leitura) ─────────────────────────

export function gestaoReceitas() {
  if (!gestaoReady) {
    gestaoReady = true;
    const user = generateUser(`gestao_${__VU}_${Date.now()}`);
    const reg = registerUser(user);
    if (reg.status === 201) {
      gestaoToken = loginUser(user.email, user.senha);
    }
  }

  if (!gestaoToken) { sleep(2); return; }

  const auth = authHeaders(gestaoToken);
  const recipeSuffix = `gestao_${__VU}_${__ITER}_${Date.now()}`;
  const recipe = generateRecipe(recipeSuffix);

  group('Gestão de Receitas', () => {
    // Criar
    const createRes = http.post(`${BASE_URL}/recipes`, JSON.stringify(recipe), { headers: auth });
    check(createRes, { 'criar receita → 201': (r) => r.status === 201 });

    // Listar e buscar ID pelo nome
    const listRes = http.get(
      `${BASE_URL}/recipes?scope=me&nome=${encodeURIComponent(recipe.nome)}`,
      { headers: auth }
    );
    check(listRes, { 'listar minhas → 200': (r) => r.status === 200 });

    if (listRes.status === 200) {
      const recipes = JSON.parse(listRes.body);
      if (recipes.length > 0) {
        const id = recipes[0].id;

        // Atualizar
        const updatedRecipe = generateRecipe(`${recipeSuffix}_upd`);
        const updateRes = http.put(
          `${BASE_URL}/recipes/${id}`,
          JSON.stringify(updatedRecipe),
          { headers: auth }
        );
        check(updateRes, { 'atualizar receita → 200': (r) => r.status === 200 });

        // Excluir
        const deleteRes = http.del(`${BASE_URL}/recipes/${id}`, null, { headers: auth });
        check(deleteRes, { 'excluir receita → 200': (r) => r.status === 200 });
      }
    }
  });

  sleep(1 + Math.random() * 1.5);
}

// ── Cenário 3: Jornada completa do usuário ────────────────────────────────────

export function cicloCompleto() {
  const id = `ciclo_${__VU}_${__ITER}_${Date.now()}`;
  const user = generateUser(id);
  let token, recipeId;

  group('Registro e Login', () => {
    const regRes = registerUser(user);
    check(regRes, { 'registro → 201': (r) => r.status === 201 });
    if (regRes.status !== 201) return;

    token = loginUser(user.email, user.senha);
    check(token, { 'token obtido': (t) => t !== null });
  });

  if (!token) return;
  const auth = authHeaders(token);

  group('Criação de Receita', () => {
    const recipe = generateRecipe(`${id}_r1`);
    const createRes = http.post(`${BASE_URL}/recipes`, JSON.stringify(recipe), { headers: auth });
    check(createRes, { 'criar → 201': (r) => r.status === 201 });

    const listRes = http.get(
      `${BASE_URL}/recipes?scope=me&nome=${encodeURIComponent(recipe.nome)}`,
      { headers: auth }
    );
    if (listRes.status === 200) {
      const recipes = JSON.parse(listRes.body);
      if (recipes.length > 0) recipeId = recipes[0].id;
    }
  });

  group('Listagem e Filtros', () => {
    const meRes = http.get(`${BASE_URL}/recipes?scope=me`, { headers: auth });
    check(meRes, { 'scope=me → 200': (r) => r.status === 200 });

    const allRes = http.get(`${BASE_URL}/recipes?scope=all`, { headers: auth });
    check(allRes, { 'scope=all → 200': (r) => r.status === 200 });

    const filtroRes = http.get(`${BASE_URL}/recipes?scope=all&ingrediente=farinha`, { headers: auth });
    check(filtroRes, { 'filtro ingrediente → 200': (r) => r.status === 200 });
  });

  if (recipeId) {
    group('Atualização de Receita', () => {
      const updatedRecipe = generateRecipe(`${id}_upd`);
      const res = http.put(`${BASE_URL}/recipes/${recipeId}`, JSON.stringify(updatedRecipe), { headers: auth });
      check(res, { 'atualizar → 200': (r) => r.status === 200 });
    });

    group('Favoritar Receita (segundo usuário)', () => {
      const user2 = generateUser(`${id}_u2`);
      registerUser(user2);
      const token2 = loginUser(user2.email, user2.senha);
      if (token2) {
        const favRes = http.post(
          `${BASE_URL}/recipes/${recipeId}/favorite`,
          null,
          { headers: authHeaders(token2) }
        );
        check(favRes, { 'favoritar → 200': (r) => r.status === 200 });
        http.del(`${BASE_URL}/users/me`, null, { headers: authHeaders(token2) });
      }
    });

    group('Exclusão de Receita', () => {
      const res = http.del(`${BASE_URL}/recipes/${recipeId}`, null, { headers: auth });
      check(res, { 'excluir receita → 200': (r) => r.status === 200 });
    });
  }

  group('Exclusão de Conta', () => {
    const res = http.del(`${BASE_URL}/users/me`, null, { headers: auth });
    check(res, { 'excluir conta → 200': (r) => r.status === 200 });
  });

  sleep(1);
}
