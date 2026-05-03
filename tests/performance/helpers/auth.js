import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function registerUser(userData) {
  return http.post(`${BASE_URL}/users`, JSON.stringify(userData), {
    headers: JSON_HEADERS,
  });
}

export function loginUser(email, senha) {
  const res = http.post(
    `${BASE_URL}/login`,
    JSON.stringify({ email, senha }),
    { headers: JSON_HEADERS }
  );
  if (res.status === 200) {
    return JSON.parse(res.body).token;
  }
  return null;
}

export function setupUser(suffix) {
  const user = {
    nome: `Perf User ${suffix}`.substring(0, 100),
    email: `perf_${suffix}@perf.test`.substring(0, 150),
    senha: 'senha123',
  };
  const reg = registerUser(user);
  if (reg.status !== 201) return null;
  const token = loginUser(user.email, user.senha);
  return token ? { user, token } : null;
}
