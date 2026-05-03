# Recipe Book API

API REST para gerenciamento de caderno de receitas, com cadastro de usuários, autenticação JWT, gerenciamento de receitas e sistema de favoritos.

---

## Descrição

A API permite:
- Cadastro e autenticação de usuários via JWT
- Criação e exclusão de receitas
- Busca de receitas por nome e/ou ingrediente, com escopo `me` (próprias + favoritadas) ou `all` (todas)
- Favoritar receitas de outros usuários
- Persistência em memória (sem banco de dados)
  
---

## Endpoints

| Método | Rota | Autenticação | Descrição |
|--------|------|:---:|-----------|
| POST | `/users` | Não | Cadastrar usuário |
| DELETE | `/users/me` | Sim | Excluir conta |
| POST | `/login` | Não | Autenticar e obter token JWT |
| GET | `/recipes` | Sim | Listar receitas (scope: `me` ou `all`) |
| POST | `/recipes` | Sim | Cadastrar receita |
| PUT | `/recipes/:id` | Sim | Editar receita |
| DELETE | `/recipes/:id` | Sim | Excluir receita |
| POST | `/recipes/:id/favorite` | Sim | Favoritar receita |

---

## Swagger

Documentação interativa disponível após iniciar o servidor:

```
http://localhost:3000/docs
```

---

## Setup

**Pré-requisitos:** Node.js >= 18

```bash
npm install
```

---

## Execução

```bash
# Produção
npm start

# Desenvolvimento (hot reload)
npm run dev
```

O servidor sobe na porta `3000` por padrão.  
Variável de ambiente opcional: `PORT=4000 npm start`

---

## Testes

A suíte de testes é composta por três camadas: **unitários**, **API (integração)** e **performance**.

---

### Testes Unitários — Jest

Cobrem 100% do código (statements, branches, functions e lines), com foco em serviços, validadores e models.

```bash
# Executar com cobertura
npm test

# Saída verbosa
npm run test:verbose
```

Técnicas aplicadas:
- **Cobertura de Sentença** — todas as linhas executadas
- **Cobertura de Decisão** — todos os branches (if/else) cobertos
- **Cobertura de Caminhos** — fluxos combinados entre validações e regras de negócio

---

### Testes de API — Mocha + Chai

Testes de integração end-to-end que sobem o servidor real e validam os contratos HTTP de cada User Story.

```bash
# Executar testes de API
npm run test:api

# Executar com relatório HTML (gerado em reports/mocha/)
npm run test:api:report

# Executar um arquivo isolado
npx mocha tests/api/US001_cadastro-usuario.spec.js --timeout 10000 --exit
```

| Arquivo | User Story | Cobertura |
|---------|-----------|-----------|
| `US001_cadastro-usuario.spec.js` | Cadastro de usuário | Validações de nome, e-mail, senha; e-mail duplicado |
| `US002_autenticacao.spec.js` | Autenticação | Login válido, credenciais inválidas, token JWT |
| `US003_exclusao-conta.spec.js` | Exclusão de conta | Remoção da conta, preservação das receitas |
| `US004_cadastro-receita.spec.js` | Cadastro de receita | Validações de campos, regras de negócio |
| `US005_edicao-receita.spec.js` | Edição de receita | Atualização, autorização, nome duplicado |
| `US006_exclusao-receita.spec.js` | Exclusão de receita | Permissões, remoção de favoritos associados |
| `US007_listagem-receitas.spec.js` | Listagem de receitas | Scopes `me`/`all`, filtros por nome e ingrediente |
| `US008_favoritar-receita.spec.js` | Favoritar receita | Regras: não favoritar própria, sem duplicatas |

---

### Testes de Performance — K6

Simulam carga real sobre a API para medir latência, throughput e comportamento sob estresse.

**Pré-requisito:** [instalar K6](https://k6.io/docs/get-started/installation/)

```bash
# Smoke — sanidade rápida, 1 VU, todos os endpoints
k6 run tests/performance/smoke.test.js

# Load — carga normal (~2 min, 3 cenários concorrentes)
k6 run tests/performance/load.test.js

# Stress — carga crescente até 100 VUs para encontrar o limite (~6 min)
k6 run tests/performance/stress.test.js

# Spike — dois picos súbitos de 5 → 50 VUs (~4.5 min)
k6 run tests/performance/spike.test.js

# Alterar URL base (ex.: outra porta)
k6 run --env BASE_URL=http://localhost:4000 tests/performance/load.test.js
```

| Arquivo | Tipo | VUs | Duração | Objetivo |
|---------|------|:---:|---------|---------|
| `smoke.test.js` | Smoke | 1 | ~30s | Verificar que todos os endpoints respondem |
| `load.test.js` | Load | até 10 | ~2min | Simular uso normal com múltiplos usuários |
| `stress.test.js` | Stress | até 100 | ~6min | Encontrar o ponto de ruptura da API |
| `spike.test.js` | Spike | 5 → 50 | ~4.5min | Verificar recuperação após pico repentino |


---


