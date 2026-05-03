/**
 * Stress Test — aumenta a carga progressivamente além do normal para encontrar
 * o ponto de ruptura da API.
 *
 * Estágios:
 *   0  →  20 VUs em 1 min   (aquecimento)
 *   20 →  50 VUs em 2 min   (carga alta)
 *   50 → 100 VUs em 2 min   (carga extrema)
 *  100 →   0 VUs em 1 min   (resfriamento)
 *
 * Execução:
 *   k6 run tests/performance/stress.test.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, authHeaders, registerUser, loginUser } from './helpers/auth.js';
import { generateUser, generateRecipe } from './helpers/data.js';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Critérios de aceitação degradam conforme a carga aumenta
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

// Estado por VU: inicializado uma vez e reutilizado em todas as iterações
let token = null;
let initialized = false;

export default function () {
  if (!initialized) {
    initialized = true;
    const user = generateUser(`stress_${__VU}_${Date.now()}`);
    const reg = registerUser(user);
    if (reg.status === 201) {
      token = loginUser(user.email, user.senha);
    }
    if (token) {
      // Semente de dados para o VU
      http.post(
        `${BASE_URL}/recipes`,
        JSON.stringify(generateRecipe(`stress_${__VU}_seed`)),
        { headers: authHeaders(token) }
      );
    }
  }

  if (!token) { sleep(1); return; }

  const auth = authHeaders(token);
  const suffix = `stress_${__VU}_${__ITER}_${Date.now()}`;

  group('Leitura', () => {
    const res = http.get(`${BASE_URL}/recipes?scope=all`, { headers: auth });
    check(res, { 'GET /recipes → 200': (r) => r.status === 200 });
  });

  group('Escrita', () => {
    const recipe = generateRecipe(suffix);
    const createRes = http.post(`${BASE_URL}/recipes`, JSON.stringify(recipe), { headers: auth });
    check(createRes, { 'POST /recipes → 201': (r) => r.status === 201 });

    if (createRes.status === 201) {
      const listRes = http.get(
        `${BASE_URL}/recipes?scope=me&nome=${encodeURIComponent(recipe.nome)}`,
        { headers: auth }
      );
      if (listRes.status === 200) {
        const recipes = JSON.parse(listRes.body);
        if (recipes.length > 0) {
          const id = recipes[0].id;
          const deleteRes = http.del(`${BASE_URL}/recipes/${id}`, null, { headers: auth });
          check(deleteRes, { 'DELETE /recipes/:id → 200': (r) => r.status === 200 });
        }
      }
    }
  });

  sleep(Math.random() * 2);
}
