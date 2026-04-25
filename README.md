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

```bash
# Executar testes com cobertura
npm test

# Saída verbosa
npm run test:verbose
```

Os testes cobrem 100% do código com técnicas de:
- **Cobertura de Sentença** — todas as linhas executadas
- **Cobertura de Decisão** — todos os branches (if/else) cobertos
- **Cobertura de Caminhos** — fluxos combinados entre validações e regras de negócio

---

## Endpoints

| Método | Rota | Autenticação | Descrição |
|--------|------|:---:|-----------|
| POST | `/users` | Não | Cadastrar usuário |
| POST | `/login` | Não | Autenticar e obter token JWT |
| GET | `/recipes` | Sim | Listar receitas (scope: `me` ou `all`) |
| POST | `/recipes` | Sim | Cadastrar receita |
| DELETE | `/recipes/:id` | Sim | Excluir receita |
| POST | `/recipes/:id/favorite` | Sim | Favoritar receita |

---

## Swagger

Documentação interativa disponível após iniciar o servidor:

```
http://localhost:3000/docs
```

---

## Padronização de erro

```json
{
  "errors": [
    {
      "field": "nome",
      "message": "Mensagem de erro"
    }
  ]
}
```
