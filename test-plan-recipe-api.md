# Plano de Testes e Estratégia

Este documento apresenta o Plano de Testes e Estratégia para a **Recipe Book API**, uma plataforma para gerenciamento de caderno de receitas onde usuários podem cadastrar, editar, excluir, listar e favoritar receitas.

A estrutura deste plano é adaptada da norma ISO-29119-3 e está organizada nas seguintes seções:
*   [Épico e Histórias de Usuário](#2-histórias-de-usuário-e-estimativa-de-esforço)
*   [Regras de Negócio e Técnicas de Teste](#3-regras-de-negócio-e-técnicas-de-teste)
*   [Condições de Teste](#4-condições-de-teste-e-camadas)
*   [Automação de Testes](#5-automação-de-testes)
*   [Mapeamento de Dados de Teste](#6-mapeamento-de-dados-de-teste)
*   [Testes Exploratórios](#7-testes-exploratórios)

O projeto de automação foca em validar a lógica de negócio, a integridade de dados e a segurança da API usando ferramentas do ecossistema Node.js. As técnicas de design de teste **Partição de Equivalência**, **Análise do Valor Limite**, **Tabela de Decisão** e **Teste de Transição de Estado** foram aplicadas para definir os cenários de teste, garantindo cobertura efetiva das regras de negócio.

---

## 1. Épico e Estimativa Geral de Esforço

| Código | Descrição      | Esforço  |
| :----- | :------------- | :------- |
| EP001  | Recipe Book API | 14 dias |

---

## 2. Histórias de Usuário e Estimativa de Esforço

| Código | Descrição                         | Esforço |
| :----- | :-------------------------------- | :------ |
| US001  | Cadastro de Usuário               | 2 dias  |
| US002  | Autenticação                      | 1 dia   |
| US003  | Exclusão de Conta                 | 2 dias  |
| US004  | Cadastro de Receita               | 3 dias  |
| US005  | Edição de Receita                 | 2 dias  |
| US006  | Exclusão de Receita               | 1 dia   |
| US007  | Listagem e Filtragem de Receitas  | 2 dias  |
| US008  | Favoritar Receita                 | 1 dia   |

---

## 3. Regras de Negócio e Técnicas de Teste

### 3.1. Cadastro de Usuário

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN001** | Os campos `nome`, `email` e `senha` são obrigatórios; se qualquer um estiver ausente ou vazio após trim, o sistema retorna erro geral sem validar os demais campos. | POST /users com campos ausentes ou vazios. | Campo ausente, campo vazio, campo apenas com espaços. | Partição de Equivalência |
| **RN002** | O campo `nome` deve ter entre 3 e 100 caracteres após trim. | `nome` com comprimento variado. | < 3 chars (inválido), 3 chars (mínimo), 100 chars (máximo), > 100 chars (inválido). | Análise do Valor Limite |
| **RN003** | O campo `email` deve corresponder ao padrão `x@x.x`, ter no máximo 150 caracteres e ser único no sistema. | `email` com formatos variados. | Formato inválido, formato válido, e-mail já cadastrado. | Partição de Equivalência |
| **RN004** | O campo `senha` deve ter entre 6 e 100 caracteres após trim e é armazenada com hash bcrypt. | `senha` com comprimento variado. | < 6 chars (inválido), 6 chars (mínimo), > 100 chars (inválido). | Análise do Valor Limite |

### 3.2. Autenticação

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN005** | Os campos `email` e `senha` são obrigatórios no login. | POST /login com campos ausentes ou vazios. | Campo ausente, campo vazio após trim. | Análise do Valor Limite |
| **RN006** | Se o e-mail não existir no sistema, o login retorna 401. | POST /login com e-mail não cadastrado. | E-mail cadastrado, e-mail não cadastrado. | Partição de Equivalência |
| **RN007** | Se a senha não corresponder ao hash armazenado, o login retorna 401. | POST /login com senha incorreta. | Senha correta, senha incorreta. | Partição de Equivalência |
| **RN008** | Login bem-sucedido retorna token JWT com `id` e `email` no payload. | POST /login com credenciais válidas. | N/A (verificação de resposta). | Partição de Equivalência |
| **RN009** | Rotas protegidas exigem token JWT no header `Authorization: Bearer <token>`; token sem prefixo Bearer, inválido ou expirado é rejeitado. | Acesso a rota protegida com variações de token. | Token ausente, sem prefixo Bearer, token inválido/expirado, token válido. | Partição de Equivalência |

### 3.3. Exclusão de Conta

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN010** | Apenas o próprio usuário autenticado pode excluir sua conta. | DELETE /users/me com token. | Token válido do próprio usuário, sem token. | Partição de Equivalência |
| **RN011** | Ao excluir a conta, os favoritos feitos pelo usuário em receitas de outros são removidos automaticamente. | DELETE /users/me. | N/A (verificação de efeito cascata). | Partição de Equivalência |
| **RN012** | As receitas do usuário permanecem no sistema após a exclusão da conta; o autor passa a aparecer como "Desconhecido". | DELETE /users/me. | N/A (verificação de integridade de dados). | Partição de Equivalência |
| **RN013** | Se o token ainda for válido mas a conta já tiver sido removida, o sistema retorna 404. | Uso de token válido após exclusão de conta. | Conta existente, conta excluída. | Partição de Equivalência |

### 3.4. Cadastro de Receita

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN014** | O cadastro de receita requer autenticação. | POST /recipes sem token. | Com token, sem token. | Partição de Equivalência |
| **RN015** | O campo `nome` é obrigatório, deve ter entre 3 e 50 caracteres após trim e não pode ser apenas espaços. | `nome` com valores variados. | Apenas espaços, < 3 chars, 3 chars (mínimo), 50 chars (máximo), > 50 chars. | Análise do Valor Limite |
| **RN016** | O `nome` da receita deve ser único entre as receitas do próprio usuário (case-insensitive); o mesmo nome pode existir em receitas de outros usuários. | `nome` com variações de unicidade. | Nome único para o usuário (válido), nome igual a outra receita do mesmo usuário — incluindo variação de capitalização (inválido), nome igual a receita de outro usuário (válido). | Partição de Equivalência |
| **RN017** | O campo `ingredientes` é obrigatório, deve ser um array, sem itens duplicados; todos os itens são normalizados para lowercase com trim. | `ingredientes` com variações de tipo e unicidade. | Não-array (inválido), array sem duplicatas (válido), array com duplicatas (inválido). | Partição de Equivalência |
| **RN017a** | O array `ingredientes` deve ter entre 2 e 50 itens; cada item deve ter entre 2 e 50 caracteres. | Array com quantidade e comprimento de itens variados. | 1 item, 2 itens (mínimo válido), 50 itens (máximo válido), 51 itens; item com 1 char, 2 chars (mínimo válido), 50 chars (máximo válido). | Análise do Valor Limite |
| **RN018** | O campo `modoPreparo` é obrigatório e deve ter entre 10 e 2000 caracteres após trim. | `modoPreparo` com comprimento variado. | < 10 chars, 10 chars (mínimo), 2000 chars (máximo), > 2000 chars. | Análise do Valor Limite |
| **RN019** | O campo `nivelDificuldade` é obrigatório e deve ser: `Facil`, `Media` ou `Dificil`. | `nivelDificuldade` com valores variados. | Valor válido (um dos 3), valor inválido, ausente. | Partição de Equivalência |
| **RN020** | O campo `categoria` é opcional; quando informado, deve ser um de: `Doce`, `Salgada`, `Sem_gluten`, `Sem_lactose`, `Sem_acucar_refinado`. | `categoria` com valores variados. | Valor válido, valor inválido, ausente/null. | Partição de Equivalência |
| **RN021** | O campo `tempoPreparo` é opcional; quando informado, deve seguir o formato `\d{2}:\d{2}`. | `tempoPreparo` com formatos variados. | Formato correto (ex: "01:30"), formato inválido (ex: "1h30"), ausente/null. | Partição de Equivalência |
| **RN022** | O campo `link` é opcional; quando omitido ou nulo, é aceito sem validação. | `link` presente ou ausente. | Ausente/null (válido), com valor informado (aplicam-se validações). | Partição de Equivalência |
| **RN022a** | Quando informado, o campo `link` deve ter no máximo 300 caracteres; o formato de URL não é validado. | `link` com tamanho variado. | 300 chars (máximo válido), 301 chars (inválido). | Análise do Valor Limite |
| **RN023** | O campo `notas` é opcional; quando omitido ou nulo, é aceito sem validação. | `notas` presente ou ausente. | Ausente/null (válido), com valor informado (aplicam-se validações). | Partição de Equivalência |
| **RN023a** | Quando informado, o campo `notas` deve ter no máximo 500 caracteres após trim. | `notas` com tamanho variado. | 500 chars (máximo válido), 501 chars (inválido). | Análise do Valor Limite |

### 3.5. Edição de Receita

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN024** | A edição requer autenticação e somente o autor da receita pode editá-la. | PUT /recipes/:id. | Autor autenticado, não-autor autenticado, sem token. | Tabela de Decisão |
| **RN025** | Aplicam-se as mesmas validações de campo do cadastro (RN015 a RN023). | Campos com valores inválidos na edição. | Idêntico ao cadastro. | (ver RN015–RN023) |
| **RN026** | Não é possível renomear para um nome já existente em outra receita do mesmo usuário (case-insensitive); manter o mesmo nome não gera conflito. | `nome` duplicado na edição. | Novo nome único, nome de outra receita do mesmo usuário, mesmo nome atual. | Partição de Equivalência |
| **RN027** | Os ingredientes são renormalizados para lowercase ao serem salvos. | `ingredientes` com letras maiúsculas enviados no request. | Ingredientes em maiúsculo, ingredientes já em minúsculo. | Partição de Equivalência |

### 3.6. Exclusão de Receita

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN028** | A exclusão requer autenticação e somente o autor pode excluir sua receita. | DELETE /recipes/:id. | Autor autenticado, não-autor autenticado, sem token. | Tabela de Decisão |
| **RN029** | Ao excluir uma receita, todos os favoritos apontando para ela são removidos automaticamente. | DELETE /recipes/:id. | N/A (verificação de efeito cascata). | Transição de Estado |

### 3.7. Listagem e Filtragem de Receitas

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN030** | A listagem de receitas requer autenticação. | GET /recipes sem token. | Com token, sem token. | Partição de Equivalência |
| **RN031** | O parâmetro `scope` é obrigatório; valores aceitos: `me` ou `all`. | `scope` com valores variados. | Ausente, `me`, `all`, valor inválido. | Partição de Equivalência |
| **RN032** | `scope=me` retorna receitas criadas pelo usuário + receitas favoritadas; `scope=all` retorna todas as receitas do sistema. | GET /recipes com `scope=me` e `scope=all`. | Receitas próprias, receitas favoritadas, receitas de outros usuários. | Partição de Equivalência |
| **RN033** | O filtro `nome` realiza busca parcial, case-insensitive. | `nome` com variações de texto. | Nome exato, nome parcial, nome com capitalização diferente, nome inexistente. | Partição de Equivalência |
| **RN034** | O filtro `ingrediente` realiza busca parcial dentro do array de ingredientes, case-insensitive. | `ingrediente` com variações. | Texto parcial, capitalização diferente, ingrediente inexistente. | Partição de Equivalência |
| **RN035** | Filtros combinados (`nome` + `ingrediente`) aplicam lógica AND. | GET /recipes com dois filtros. | Receitas que atendem ambos, receitas que atendem apenas um. | Tabela de Decisão |
| **RN036** | Quando não há resultados, retorna HTTP 200 com `{ message, data: [] }` em vez de array vazio. | GET /recipes com filtros sem correspondência. | N/A. | Partição de Equivalência |
| **RN037** | O campo `isFavorited` retorna `true` para receitas favoritadas pelo usuário e `false` para receitas próprias ou não favoritadas. | GET /recipes. | Receita favoritada, receita própria, receita de outro não favoritada. | Partição de Equivalência |
| **RN038** | O campo `autor` sempre está presente; exibe "Desconhecido" quando o autor excluiu a conta. | GET /recipes após exclusão do autor. | Autor existente, autor excluído. | Partição de Equivalência |

### 3.8. Favoritar Receita

| ID | Regra de Negócio | Entrada do Sistema | Faixa de Valores | Técnica de Teste |
| :--- | :--- | :--- | :--- | :--- |
| **RN039** | Favoritar receita requer autenticação. | POST /recipes/:id/favorite sem token. | Com token, sem token. | Partição de Equivalência |
| **RN040** | O usuário não pode favoritar sua própria receita. | POST /recipes/:id/favorite com receita própria. | Receita própria, receita de outro usuário. | Partição de Equivalência |
| **RN041** | Não é permitido favoritar a mesma receita duas vezes. | POST /recipes/:id/favorite com receita já favoritada. | Primeira vez (permitido), segunda vez (bloqueado). | Partição de Equivalência |
| **RN042** | Após favoritar, a receita aparece no `scope=me` com `isFavorited: true` e referência ao autor original. | GET /recipes?scope=me após favoritar. | N/A (verificação de efeito). | Transição de Estado |
| **RN043** | Ao excluir a própria conta, os favoritos feitos pelo usuário são removidos; os favoritos de outros em suas receitas permanecem. | DELETE /users/me após favoritar receitas de outros. | N/A (verificação de efeito cascata). | Transição de Estado |

---

## 4. Condições de Teste e Camadas

### 4.1. US001: Cadastro de Usuário

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT001 | Cadastrar usuário com todos os dados válidos                                 | Retorna HTTP 201 com `message` e `id`.                                          | 🔴 Alta    | API    | Sim       |
| CT002 | Tentar cadastrar com campo obrigatório ausente                               | Retorna HTTP 400 com erro geral sem validar os demais campos.                   | 🔴 Alta    | API    | Sim       |
| CT003 | Tentar cadastrar com campo obrigatório vazio após trim (somente espaços)     | Retorna HTTP 400 com erro geral.                                                | 🔴 Alta    | API    | Sim       |
| CT004 | Cadastrar com `nome` no limite mínimo (3 chars)                              | Retorna HTTP 201.                                                               | 🟡 Média   | API    | Sim       |
| CT005 | Tentar cadastrar com `nome` abaixo do mínimo (2 chars)                      | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT006 | Tentar cadastrar com `nome` acima do máximo (101 chars)                     | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT007 | Tentar cadastrar com formato de `email` inválido                             | Retorna HTTP 400 com erro no campo `email`.                                     | 🔴 Alta    | API    | Sim       |
| CT008 | Tentar cadastrar com `email` já existente no sistema                         | Retorna HTTP 409 com erro de e-mail duplicado.                                  | 🔴 Alta    | API    | Sim       |
| CT009 | Tentar cadastrar com `senha` abaixo do mínimo (5 chars)                     | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |

### 4.2. US002: Autenticação

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT010 | Login com credenciais válidas                                                | Retorna HTTP 200 com token JWT contendo `id` e `email` no payload.              | 🔴 Alta    | API    | Sim       |
| CT011 | Tentar login com e-mail não cadastrado                                       | Retorna HTTP 401 com erro no campo `email`.                                     | 🔴 Alta    | API    | Sim       |
| CT012 | Tentar login com senha incorreta                                             | Retorna HTTP 401 com erro no campo `senha`.                                     | 🔴 Alta    | API    | Sim       |
| CT013 | Tentar login sem informar campo obrigatório                                  | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT014 | Acessar rota protegida sem token                                             | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT015 | Acessar rota protegida com token sem prefixo `Bearer`                        | Retorna HTTP 401.                                                               | 🟡 Média   | API    | Sim       |
| CT016 | Acessar rota protegida com token inválido ou expirado                        | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |

### 4.3. US003: Exclusão de Conta

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT017 | Excluir conta com token válido                                               | Retorna HTTP 200 com mensagem de sucesso.                                       | 🔴 Alta    | API    | Sim       |
| CT018 | Tentar excluir conta sem token                                               | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT019 | Excluir conta: verificar que favoritos do usuário em receitas de outros são removidos | Os registros de favorito do usuário não existem mais no sistema.               | 🔴 Alta    | API    | Sim       |
| CT020 | Excluir conta: verificar que receitas do usuário permanecem com autor "Desconhecido" | Receitas existem; campo `autor.nome` retorna "Desconhecido".                  | 🔴 Alta    | API    | Sim       |
| CT021 | Usar token válido após exclusão da conta                                     | Retorna HTTP 404.                                                               | 🟡 Média   | API    | Sim       |

### 4.4. US004: Cadastro de Receita

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT022 | Cadastrar receita com todos os campos obrigatórios válidos                   | Retorna HTTP 201 com mensagem de sucesso.                                       | 🔴 Alta    | API    | Sim       |
| CT023 | Tentar cadastrar receita sem autenticação                                    | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT024 | Tentar cadastrar receita com `nome` duplicado para o mesmo usuário           | Retorna HTTP 409 com erro no campo `nome`.                                      | 🔴 Alta    | API    | Sim       |
| CT025 | Cadastrar receita com mesmo `nome` de outro usuário                          | Retorna HTTP 201 (nomes podem ser iguais entre usuários diferentes).            | 🟡 Média   | API    | Sim       |
| CT026 | Tentar cadastrar receita com `nome` contendo somente espaços                 | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT027 | Tentar cadastrar receita com `nome` acima do máximo (51 chars)              | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT028 | Tentar cadastrar receita com `ingredientes` não sendo um array               | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT029 | Tentar cadastrar receita com apenas 1 ingrediente (abaixo do mínimo)        | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT030 | Tentar cadastrar receita com ingredientes duplicados                         | Retorna HTTP 400 com erro de validação.                                         | 🟡 Média   | API    | Sim       |
| CT031 | Tentar cadastrar receita com `nivelDificuldade` inválido                     | Retorna HTTP 400 com erro de validação.                                         | 🔴 Alta    | API    | Sim       |
| CT032 | Tentar cadastrar receita com `tempoPreparo` em formato inválido              | Retorna HTTP 400 com erro de validação.                                         | 🟢 Baixa  | API    | Sim       |
| CT033 | Tentar cadastrar receita com `notas` acima do máximo (501 chars)            | Retorna HTTP 400 com erro de validação.                                         | 🟢 Baixa  | API    | Sim       |

### 4.5. US005: Edição de Receita

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT034 | Editar receita com dados válidos como autor                                  | Retorna HTTP 200 com mensagem de sucesso.                                       | 🔴 Alta    | API    | Sim       |
| CT035 | Tentar editar receita sem autenticação                                       | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT036 | Tentar editar receita de outro usuário                                       | Retorna HTTP 403 com erro de permissão.                                         | 🔴 Alta    | API    | Sim       |
| CT037 | Tentar editar receita inexistente                                            | Retorna HTTP 404.                                                               | 🟡 Média   | API    | Sim       |
| CT038 | Tentar renomear receita para nome já existente em outra receita do mesmo usuário | Retorna HTTP 409 com erro no campo `nome`.                                 | 🟡 Média   | API    | Sim       |
| CT039 | Editar receita mantendo o mesmo `nome`                                       | Retorna HTTP 200 sem erro de conflito de nome.                                  | 🟡 Média   | API    | Sim       |
| CT040 | Editar receita enviando ingredientes em maiúsculo                            | Retorna HTTP 200; ingredientes salvos em minúsculo.                             | 🟢 Baixa  | API    | Sim       |

### 4.6. US006: Exclusão de Receita

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT041 | Excluir receita própria como autor autenticado                               | Retorna HTTP 200 com mensagem de sucesso.                                       | 🔴 Alta    | API    | Sim       |
| CT042 | Tentar excluir receita sem autenticação                                      | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT043 | Tentar excluir receita de outro usuário                                      | Retorna HTTP 403 com erro de permissão.                                         | 🔴 Alta    | API    | Sim       |
| CT044 | Tentar excluir receita inexistente                                           | Retorna HTTP 404.                                                               | 🟡 Média   | API    | Sim       |
| CT045 | Excluir receita: verificar que todos os favoritos apontando para ela são removidos | Os registros de favorito da receita excluída não existem mais no sistema. | 🔴 Alta    | API    | Sim       |

### 4.7. US007: Listagem e Filtragem de Receitas

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT046 | Listar receitas com `scope=me`                                               | Retorna HTTP 200 com receitas próprias e favoritadas do usuário.                | 🔴 Alta    | API    | Sim       |
| CT047 | Listar receitas com `scope=all`                                              | Retorna HTTP 200 com todas as receitas do sistema.                              | 🔴 Alta    | API    | Sim       |
| CT048 | Tentar listar receitas sem o parâmetro `scope`                               | Retorna HTTP 400 com erro no campo `scope`.                                     | 🔴 Alta    | API    | Sim       |
| CT049 | Tentar listar receitas com `scope` inválido                                  | Retorna HTTP 400 com erro no campo `scope`.                                     | 🟡 Média   | API    | Sim       |
| CT050 | Tentar listar receitas sem autenticação                                      | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT051 | Filtrar receitas por `nome` com busca parcial e case-insensitive             | Retorna apenas receitas cujo nome contém o termo buscado (independente de capitalização). | 🟡 Média | API | Sim |
| CT052 | Filtrar receitas por `ingrediente` com busca parcial e case-insensitive      | Retorna apenas receitas cujos ingredientes contêm o termo buscado.              | 🟡 Média   | API    | Sim       |
| CT053 | Filtrar receitas combinando `nome` e `ingrediente` simultaneamente           | Retorna apenas receitas que atendem a ambos os filtros (lógica AND).            | 🟡 Média   | API    | Sim       |
| CT054 | Buscar receitas com filtros que não retornam resultados                      | Retorna HTTP 200 com `{ message, data: [] }` em vez de array vazio.             | 🟡 Média   | API    | Sim       |
| CT055 | Verificar campo `isFavorited` em receita favoritada no `scope=me`            | O campo `isFavorited` retorna `true`.                                           | 🟡 Média   | API    | Sim       |
| CT056 | Verificar campo `isFavorited` em receita própria                             | O campo `isFavorited` retorna `false`.                                          | 🟡 Média   | API    | Sim       |
| CT057 | Listar receitas após o autor excluir a conta                                 | O campo `autor.nome` exibe "Desconhecido".                                      | 🔴 Alta    | API    | Sim       |

### 4.8. US008: Favoritar Receita

| ID    | Condição de Teste                                                            | Resultado Esperado                                                              | Prioridade | Camada | Automação |
| :---- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :--------- | :----- | :-------- |
| CT058 | Favoritar receita de outro usuário                                           | Retorna HTTP 200 com mensagem de sucesso.                                       | 🔴 Alta    | API    | Sim       |
| CT059 | Tentar favoritar a própria receita                                           | Retorna HTTP 403 com erro de permissão.                                         | 🔴 Alta    | API    | Sim       |
| CT060 | Tentar favoritar a mesma receita duas vezes                                  | Retorna HTTP 409 com erro de receita já favoritada.                             | 🟡 Média   | API    | Sim       |
| CT061 | Tentar favoritar receita inexistente                                         | Retorna HTTP 404.                                                               | 🟡 Média   | API    | Sim       |
| CT062 | Tentar favoritar receita sem autenticação                                    | Retorna HTTP 401.                                                               | 🔴 Alta    | API    | Sim       |
| CT063 | Verificar que receita favoritada aparece no `scope=me` com `isFavorited: true` | Receita aparece na listagem com `isFavorited: true` e dados do autor original. | 🔴 Alta    | API    | Sim       |

---

## 5. Automação de Testes

### 5.1. Ferramentas de Automação

| Ferramenta | Uso                                              | Camada   |
| :--------- | :----------------------------------------------- | :------- |
| Jest       | Framework de testes unitários para Node.js       | Unitário |
| Mocha      | Framework de testes de API para Node.js          | API      |
| Supertest  | Biblioteca para testes de APIs HTTP              | API      |

### 5.2. Casos de Teste Automatizados

A seleção considera apenas os testes de API, baseada em análise de risco do produto, priorizando os fluxos que garantem integridade e segurança do sistema.

| História de Usuário | Casos de Teste de API Automatizados | Ferramentas |
| :------------------ | :--------------------------------------------------------- | :---------- |
| US001               | Todos os casos de criação e validação de campos.           | Mocha, Supertest |
| US002               | Login com credenciais válidas e inválidas; validação de token em rotas protegidas. | Mocha, Supertest |
| US003               | Exclusão de conta e verificação de efeitos cascata nos dados. | Mocha, Supertest |
| US004               | Todos os casos de criação, validação de campos e unicidade de nome. | Mocha, Supertest |
| US005               | Edição como autor, como não-autor e verificação de conflito de nome. | Mocha, Supertest |
| US006               | Exclusão como autor, como não-autor e remoção em cascata de favoritos. | Mocha, Supertest |
| US007               | Listagem por `scope`, parâmetro `scope` ausente/inválido, sem resultados, campos `isFavorited` e `autor`. | Mocha, Supertest |
| US008               | Favoritar, tentativa com receita própria, receita duplicada e receita inexistente. | Mocha, Supertest |

---

## 6. Mapeamento de Dados de Teste

| ID do Teste | Dados de Entrada |
| :---------- | :--------------- |
| CT001       | `{ "nome": "João Silva", "email": "joao@email.com", "senha": "senha123" }` |
| CT002       | `{ "email": "joao@email.com", "senha": "senha123" }` (campo `nome` ausente) |
| CT003       | `{ "nome": "   ", "email": "joao@email.com", "senha": "senha123" }` (somente espaços) |
| CT005       | `{ "nome": "Jo", "email": "joao@email.com", "senha": "senha123" }` (2 chars) |
| CT007       | `{ "nome": "João Silva", "email": "emailinvalido", "senha": "senha123" }` |
| CT008       | `{ "nome": "Outro Usuário", "email": "joao@email.com", "senha": "senha456" }` (e-mail duplicado) |
| CT009       | `{ "nome": "João Silva", "email": "joao@email.com", "senha": "abc12" }` (5 chars) |
| CT011       | `{ "email": "naocadastrado@email.com", "senha": "senha123" }` |
| CT012       | `{ "email": "joao@email.com", "senha": "senhaerrada" }` |
| CT022       | `{ "nome": "Bolo de Chocolate", "ingredientes": ["farinha", "açúcar", "chocolate", "ovos"], "modoPreparo": "Misture todos e leve ao forno por 40 minutos.", "nivelDificuldade": "Media" }` |
| CT029       | `{ "nome": "Bolo Simples", "ingredientes": ["farinha"], "modoPreparo": "Misture e leve ao forno.", "nivelDificuldade": "Facil" }` (1 ingrediente) |
| CT030       | `{ "nome": "Bolo", "ingredientes": ["farinha", "farinha"], "modoPreparo": "Misture e leve ao forno.", "nivelDificuldade": "Facil" }` (ingredientes duplicados) |
| CT031       | `{ "nome": "Bolo", "ingredientes": ["farinha", "açúcar"], "modoPreparo": "Misture e leve ao forno.", "nivelDificuldade": "Extreme" }` (enum inválido) |
| CT032       | `{ "nome": "Bolo", "ingredientes": ["farinha", "açúcar"], "modoPreparo": "Misture e leve ao forno.", "nivelDificuldade": "Facil", "tempoPreparo": "1h30min" }` (formato inválido) |
| CT054       | `GET /recipes?scope=me&nome=xyzinexistente` |

---

## 7. Testes Exploratórios

Para complementar os testes estruturados, será aplicada uma abordagem exploratória utilizando a heurística **VADER**, focada nas áreas críticas da API.

VADER é um acrônimo para:
*   **V**erbs (Verbos): Validar o uso correto e incorreto dos verbos HTTP (`GET`, `POST`, `PUT`, `DELETE`) em cada endpoint.
*   **A**uthorization (Autorização): Testar o controle de acesso tentando ações sem token, com token de outro usuário, e verificando se rotas protegidas não expõem dados não autorizados.
*   **D**ata (Dados): Enviar dados em formatos inesperados, como tipos incorretos (`ingredientes` como string ao invés de array), valores nulos, strings com espaços excessivos, caracteres especiais, e payloads maliciosos (SQL Injection, XSS).
*   **E**rrors (Erros): Verificar se as mensagens de erro são claras, consistentes com o formato `{ errors: [{ field, message }] }` e se os códigos HTTP de status são retornados corretamente em cada cenário.
*   **R**esponsiveness (Responsividade): Analisar o comportamento da API ao receber múltiplas requisições simultâneas e verificar a consistência do estado em operações encadeadas (ex: cadastrar → favoritar → excluir conta → listar).
