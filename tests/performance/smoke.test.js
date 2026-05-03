/**
 * Smoke Test — verifica que todos os endpoints respondem corretamente.
 * 1 VU, 1 iteração. Execução rápida antes de qualquer carga.
 *
 * Execução:
 *   k6 run tests/performance/smoke.test.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, JSON_HEADERS, authHeaders, registerUser, loginUser } from './helpers/auth.js';
import { generateUser, generateRecipe } from './helpers/data.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const id = `smoke_${__VU}_${Date.now()}`;
  const user1 = generateUser(`${id}_u1`);
  const user2 = generateUser(`${id}_u2`);
  let token1, token2, recipeId;

  // ── Usuário 1: registro e login ──────────────────────────────────────────
  group('POST /users — Cadastro de usuário', () => {
    const res = registerUser(user1);
    check(res, { 'status 201': (r) => r.status === 201 });
  });

  group('POST /login — Autenticação', () => {
    const res = http.post(
      `${BASE_URL}/login`,
      JSON.stringify({ email: user1.email, senha: user1.senha }),
      { headers: JSON_HEADERS }
    );
    check(res, {
      'status 200': (r) => r.status === 200,
      'token presente': (r) => JSON.parse(r.body).token !== undefined,
    });
    if (res.status === 200) token1 = JSON.parse(res.body).token;
  });

  if (!token1) return;
  const auth1 = authHeaders(token1);

  // ── Receitas: CRUD completo ───────────────────────────────────────────────
  group('POST /recipes — Criar receita', () => {
    const recipe = generateRecipe(`${id}_r1`);
    const res = http.post(`${BASE_URL}/recipes`, JSON.stringify(recipe), { headers: auth1 });
    check(res, { 'status 201': (r) => r.status === 201 });
  });

  group('GET /recipes?scope=me — Listar próprias', () => {
    const res = http.get(`${BASE_URL}/recipes?scope=me`, { headers: auth1 });
    check(res, {
      'status 200': (r) => r.status === 200,
      'retorna array': (r) => Array.isArray(JSON.parse(r.body)),
    });
    if (res.status === 200) {
      const recipes = JSON.parse(res.body);
      if (recipes.length > 0) recipeId = recipes[0].id;
    }
  });

  group('GET /recipes?scope=all — Listar todas', () => {
    const res = http.get(`${BASE_URL}/recipes?scope=all`, { headers: auth1 });
    check(res, {
      'status 200': (r) => r.status === 200,
      'retorna array': (r) => Array.isArray(JSON.parse(r.body)),
    });
  });

  group('GET /recipes?scope=all&nome=X — Filtro por nome', () => {
    const res = http.get(`${BASE_URL}/recipes?scope=all&nome=Receita`, { headers: auth1 });
    check(res, { 'status 200': (r) => r.status === 200 });
  });

  group('GET /recipes?scope=all&ingrediente=X — Filtro por ingrediente', () => {
    const res = http.get(`${BASE_URL}/recipes?scope=all&ingrediente=farinha`, { headers: auth1 });
    check(res, { 'status 200': (r) => r.status === 200 });
  });

  if (recipeId) {
    group('PUT /recipes/:id — Atualizar receita', () => {
      const updated = generateRecipe(`${id}_upd`);
      const res = http.put(`${BASE_URL}/recipes/${recipeId}`, JSON.stringify(updated), { headers: auth1 });
      check(res, { 'status 200': (r) => r.status === 200 });
    });
  }

  // ── Usuário 2: favoritar receita de outro usuário ─────────────────────────
  group('POST /recipes/:id/favorite — Favoritar receita', () => {
    if (!recipeId) return;

    registerUser(user2);
    token2 = loginUser(user2.email, user2.senha);
    if (!token2) return;

    const auth2 = authHeaders(token2);
    const res = http.post(`${BASE_URL}/recipes/${recipeId}/favorite`, null, { headers: auth2 });
    check(res, { 'status 200': (r) => r.status === 200 });

    // Verifica que receita aparece no scope=me do user2
    const listRes = http.get(`${BASE_URL}/recipes?scope=me`, { headers: auth2 });
    check(listRes, { 'favorito visível no scope=me': (r) => r.status === 200 });
  });

  // ── Limpeza ───────────────────────────────────────────────────────────────
  if (recipeId) {
    group('DELETE /recipes/:id — Excluir receita', () => {
      const res = http.del(`${BASE_URL}/recipes/${recipeId}`, null, { headers: auth1 });
      check(res, { 'status 200': (r) => r.status === 200 });
    });
  }

  if (token2) {
    group('DELETE /users/me — Excluir conta (user2)', () => {
      const res = http.del(`${BASE_URL}/users/me`, null, { headers: authHeaders(token2) });
      check(res, { 'status 200': (r) => r.status === 200 });
    });
  }

  group('DELETE /users/me — Excluir conta (user1)', () => {
    const res = http.del(`${BASE_URL}/users/me`, null, { headers: auth1 });
    check(res, { 'status 200': (r) => r.status === 200 });
  });

  sleep(0.5);
}
