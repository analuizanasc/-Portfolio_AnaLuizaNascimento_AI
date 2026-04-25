# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm start            # run server (port 3000 by default)
npm run dev          # run with nodemon (hot reload)
npm test             # run all tests with coverage
npm run test:verbose # run tests with verbose output
```

Run a single test file:
```bash
npx jest tests/recipe.test.js --forceExit
```

Override port: `PORT=4000 npm start`

Swagger UI is available at `http://localhost:3000/docs` when server is running.

## Architecture

Layered MVC with in-memory persistence (no database). All data lives in module-level arrays in `src/models/`.

```
server.js              → starts Express on PORT
src/app.js             → mounts routes and Swagger UI
src/routes/            → declares endpoints and applies auth middleware
src/controllers/       → calls validator then service, returns HTTP response
src/services/          → business logic; returns { status, data } or { status, errors }
src/validators/        → pure input validation; returns errors array (empty = valid)
src/models/            → in-memory arrays; exposes CRUD + clear() for test isolation
src/middlewares/auth.js → JWT verification; injects req.userId
```

**Service return convention:** every service function returns `{ status, data }` on success or `{ status, errors }` on failure. Controllers check for `result.errors` to decide which shape to send back.

**Test isolation:** each test file calls `userModel.clear()` and `recipeModel.clear()` in `beforeEach` to reset in-memory state between tests.

**100% coverage is enforced** via Jest `coverageThreshold` in `package.json`. Tests will fail if any statement, branch, function, or line is uncovered.

## Key business rules

- `scope` query param on `GET /recipes` is required; valid values are `me` (own + favorited) or `all`.
- Users cannot favorite their own recipes.
- Deleting an account removes the user's favorites but **preserves their recipes** so other users who favorited them retain access.
- Recipe names are unique per author (case-insensitive).
- Ingredients are normalized to lowercase and trimmed; duplicates are rejected.
- `nivelDificuldade`: `Facil` | `Media` | `Dificil`
- `categoria` (optional): `Doce` | `Salgada` | `Sem_gluten` | `Sem_lactose` | `Sem_acucar_refinado`
- `tempoPreparo` (optional): `MM:SS` format validated by `/^\d{2}:\d{2}$/`

## Error response format

All errors use this shape:
```json
{ "errors": [{ "field": "fieldName", "message": "..." }] }
```
