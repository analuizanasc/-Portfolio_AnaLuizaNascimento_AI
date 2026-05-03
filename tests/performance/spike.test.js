/**
 * Spike Test — simula um pico repentino de tráfego (ex.: campanha viral ou
 * horário de pico inesperado) para verificar como a API se recupera.
 *
 * Estágios:
 *    5 VUs — linha de base (30s)
 *   50 VUs — pico súbito    (1m)
 *    5 VUs — retorno        (30s)
 *   50 VUs — segundo pico   (1m)
 *    0 VUs — finalização    (30s)
 *
 * Execução:
 *   k6 run tests/performance/spike.test.js
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, authHeaders, registerUser, loginUser } from './helpers/auth.js';
import { generateUser, generateRecipe } from './helpers/data.js';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // linha de base
    { duration: '10s', target: 50 },  // pico súbito (rampa rápida)
    { duration: '1m', target: 50 },   // sustenta o pico
    { duration: '10s', target: 5 },   // retorno à base
    { duration: '30s', target: 5 },   // estabilização
    { duration: '10s', target: 50 },  // segundo pico
    { duration: '1m', target: 50 },   // sustenta segundo pico
    { duration: '30s', target: 0 },   // resfriamento
  ],
  thresholds: {
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<3000'],
    // Durante o pico, o p99 pode ser maior; mas o p95 deve se recuperar após o pico
  },
};

let token = null;
let initialized = false;

export default function () {
  if (!initialized) {
    initialized = true;
    const user = generateUser(`spike_${__VU}_${Date.now()}`);
    const reg = registerUser(user);
    if (reg.status === 201) {
      token = loginUser(user.email, user.senha);
    }
  }

  if (!token) { sleep(1); return; }

  const auth = authHeaders(token);

  // Durante um spike, o cenário mais provável é leitura (usuários navegando)
  group('Leitura durante pico', () => {
    const allRes = http.get(`${BASE_URL}/recipes?scope=all`, { headers: auth });
    check(allRes, { 'GET /recipes?scope=all → 200': (r) => r.status === 200 });

    const meRes = http.get(`${BASE_URL}/recipes?scope=me`, { headers: auth });
    check(meRes, { 'GET /recipes?scope=me → 200': (r) => r.status === 200 });
  });

  // Uma fração dos usuários também escreve (ex.: publicam receitas no pico)
  if (__VU % 5 === 0) {
    group('Escrita durante pico (20% dos VUs)', () => {
      const suffix = `spike_${__VU}_${__ITER}_${Date.now()}`;
      const recipe = generateRecipe(suffix);
      const res = http.post(`${BASE_URL}/recipes`, JSON.stringify(recipe), { headers: auth });
      check(res, { 'POST /recipes → 201': (r) => r.status === 201 });
    });
  }

  sleep(0.5 + Math.random());
}
