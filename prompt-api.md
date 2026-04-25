Objetivo:
Criar uma API REST para gerenciamento de caderno de receitas, permitindo cadastro de usuários, autenticação, cadastro e gerenciamento de receitas, busca e interação entre usuários.

---

Contexto:
A API deve permitir:
- Cadastro de usuário
- Login/autenticação
- Cadastro de receitas
- Exclusão de receitas
- Busca de receitas por nome e ingredientes
- Visualização de receitas de outros usuários
- Favoritar receitas de outros usuários
As receitas favoritadas devem aparecer na lista de receitas do usuário como se fossem suas, porém identificadas como "favoritadas".

---

Regras gerais:
- Não faça perguntas, implemente conforme especificação
- Todas as respostas devem ser em JSON
- Validar payload antes da execução da regra de negócio
- Retornar mensagens claras e padronizadas
- Utilizar status codes HTTP adequados
- Aplicar trim em campos string
- IDs devem ser UUID
- Implementar autenticação JWT
- Definição da API está descito abaixo: 

🔐 Cadastro de Usuário:

Campos obrigatórios:
- nome: string (3 a 100 caracteres)
- email: string (formato válido de e-mail, max 150 caracteres)
- senha: string (mínimo 6, máximo 100 caracteres)

Regras:
- email deve ser único

Mensagens:
- "Cadastro realizado com sucesso"
- "Preenchimento obrigatório do(s) campo(s)"
- "E-mail já cadastrado"
- "Número máximo de caracteres excedido"
- "Formato de e-mail inválido"

🔑 Login:

Campos obrigatórios:
- email
- senha

Mensagens:
- "E-mail não cadastrado"
- "Senha incorreta"
- "Preenchimento obrigatório do(s) campo(s)"

Sucesso:
- Retornar token JWT

🍲 Cadastro de Receitas:

Campos:
- nome: string (obrigatório, 3 a 50 caracteres)
- link: string (opcional, max 300 caracteres)
- ingredientes: array[string] (obrigatório)
- modoPreparo: string (obrigatório, min 10, max 2000 caracteres)
- nivelDificuldade: enum (obrigatório)
- categoria: enum (opcional)
- tempoPreparo: string (HH:mm, opcional)
- notas: string (opcional, max 500 caracteres)

Regras:

nome:
- não pode ser vazio
- não pode conter apenas espaços

ingredientes:
- mínimo 2 itens
- máximo 50 itens
- cada item entre 2 e 50 caracteres
- não permitir duplicados
- normalizar para lowercase

link:
- campo opcional
- quando informado:
  - deve ser string
  - máximo 300 caracteres
  - NÃO validar formato de URL
  - NÃO exigir http ou https

modoPreparo:
- obrigatório

tempoPreparo:
- validar formato HH:mm

Enums:

categoria:
- Doce
- Salgada
- Sem_gluten
- Sem_lactose
- Sem_acucar_refinado

nivelDificuldade:
- Facil
- Media
- Dificil

Mensagens (Receitas):

- "Registro cadastrado com sucesso!"
- "Registro já existente"
- "Preenchimento obrigatório do(s) campo(s)"
- "Lista de ingredientes inválida"
- "Valor inválido para o campo informado"

🗑️ Deletar Receita:

Regras:
- Apenas o dono pode excluir

Mensagens:
- "Registro excluído com sucesso"
- "Registro não encontrado"
- "Ação não permitida"

🔍 Busca de Receitas (GET /recipes):

Query params:
- scope (obrigatório)
- nome (opcional)
- ingrediente (opcional)

Valores de scope:
- "me"
- "all"

Regras de Filtro (CRÍTICO):

1. Os filtros podem ser usados:
   - individualmente
   - combinados

2. Quando combinados:
   - aplicar lógica AND
   Exemplo:
   nome="bolo" + ingrediente="banana"
   → retornar apenas receitas que atendam ambos

3. Regras de busca por campo:

nome:
- busca parcial (contains)
- case insensitive

ingrediente:
- busca parcial (contains)
- verificar dentro do array de ingredientes
- case insensitive

4. Comportamento por scope:

Se scope = "me":
- retornar:
  - receitas criadas pelo usuário
  - receitas favoritadas
- aplicar filtros sobre o conjunto combinado

Se scope = "all":
- retornar:
  - todas as receitas
- aplicar filtros
- NÃO incluir automaticamente como favoritas
- apenas marcar isFavorited quando aplicável

Estrutura da resposta:

[
  {
    "id": "uuid",
    "nome": "string",
    "link": "string ou null",
    "ingredientes": [],
    "modoPreparo": "string",
    "nivelDificuldade": "string",
    "categoria": "string",
    "tempoPreparo": "string",
    "notas": "string",
    "isFavorited": true | false,
    "autor": {
      "id": "uuid",
      "nome": "string"
    }
  }
]

Sem resultados:

{
  "message": "Nenhuma receita encontrada para os filtros informados",
  "data": []
}

Validação:

- scope ausente:
  "O parâmetro scope é obrigatório"

- scope inválido:
  "Valor inválido para scope. Use 'me' ou 'all'"

⭐ Favoritar Receita:

Regras:
- usuário autenticado pode favoritar receitas de outros usuários
- não pode favoritar a própria receita
- não permitir duplicidade

Nova Regra IMPORTANTE:
- Ao favoritar uma receita:
  - ela deve aparecer na listagem de receitas do usuário autenticado (GET /recipes)
  - deve ser identificada como favorita (campo: "isFavorited": true)
  - receitas próprias devem ter "isFavorited": false
  - manter referência ao autor original

Mensagens:
- "Receita favoritada com sucesso"
- "Receita já favoritada"
- "Não é permitido favoritar sua própria receita"


👀 Listar Receitas do Usuário (GET /recipes):

Deve retornar:
- receitas criadas pelo usuário
- receitas favoritadas

Formato da resposta:

[
  {
    "id": "uuid",
    "nome": "string",
    "link": "string ou null",
    "ingredientes": [],
    "modoPreparo": "string",
    "nivelDificuldade": "string",
    "categoria": "string",
    "tempoPreparo": "string",
    "notas": "string",
    "isFavorited": true | false,
    "autor": {
      "id": "uuid",
      "nome": "string"
    }
  }
]

Regras:
- receitas próprias:
  - isFavorited = false
- receitas favoritadas:
  - isFavorited = true
  - autor diferente do usuário autenticado

👀 Visualizar Receitas de Outros Usuários:

Regras:
- listar receitas públicas
- incluir nome do autor

---

⚙️ Requisitos Técnicos:

- Node.js + Express
- Arquitetura:
  - routes
  - controllers
  - services
  - models

Persistência:
- memória (arrays)

---

🔐 Autenticação:

- JWT obrigatório em rotas protegidas

---

📄 Documentação:

- Swagger (OpenAPI)
- Arquivo em /docs
- Documentar:
  - endpoints
  - exemplos
  - erros
  - status codes

---

Implementar testes de unidade com técnicas de teste como Cobertura de Sentença e Cobertura de Decisão e cobertura de caminhos. Cobrir 100% do código.

---

📘 README:

Deve conter:
- descrição
- setup
- execução
- testes
- swagger

---

⚠️ Padronização de erro:

{
  "errors": [
    {
      "field": "nome",
      "message": "Mensagem de erro"
    }
  ]
}

---

⚠️ Restrições:

- Não usar banco de dados
- Não implementar upload
- Foco em validação e organização












  

Objetivo Implementar testes automatizados para API Rest com base na regra de negócio e a especificação da API (Swagger).

Contexto 2.1. A Regras de Negócio está descrita abaixo no tópico 3.Regras 2.2. A especificação da API está no arquivo: resources\swagger.json 2.3. A estrutura da resposta está definida no Swagger, e pode ser encontrada nos services contidos na pasta src/services. 2.44. Os testes devem ser automatizados em Javascript com as bibliotecas: mocha, chai, supertest

Regras 3.1. Não me pergunte nada, só faça. 3.2. Faça uso de Data-Driven Testing, extraindo os dados do teste e colocando em arquivos de fixture, para permitir que seja mais fácil controlar as informações usadas no teste (Corpo da Requisição e Corpo da Resposta) 3.3. Crie uma pasta específica para armazenar os testes (src/test) e subpastas para o método POST da API. 3.4. Implemente a execução dos testes com geração de relatório com a biblioteca mochawesome, de modo a rodar com e sem a geração de relatórios. 3.5. Use o arquivo Swagger apresentado no contexto para definir como interagir com a API. 3.6. Mantenha as propriedades da requisição e resposta em português. 3.7. Não me pergunte se desejo prosseguir, apenas implemente o código conforme sua compreensão. 3.8 - É imprescindível a leitura dos arquivos que eu indiquei nas regras e contexto.

3.9. Aplique a heurística VADER, nas regras de negócio abaixo. Essa sigla é uma mnemônica que significa: Verbs (Verbos), Authorization (Autorização), Data (Dados), Errors (Erros) e Responsiveness (Capacidade de resposta). ta (Dados), Errors (Erros) e Responsiveness (Capacidade de resposta).

3.10. Regras de negócio: 3.10.1 - Dando como retorno o statusCode 201 para cadastro com sucesso. Dando como mensagem “Registro cadastrado com sucesso!”. 3.10.2 - Já para cadastro em duplicidade dando como retorno o statusCode 401. Dando como mensagem “Registro já existente ”. 3.10.3 - Para campos obrigatórios não preenchidos, dando o retorno o statusCode 400, e deverá retornar uma mensagem de “Preenchimento obrigatório do(s) campo(s)”. 3.10.4 - O campo “Nome da Receita” deverá ser tipo string, com limite de 50 caracteres, não permitido que seja vazio e deve ser obrigatório 3.10.5 - O campo “Tempo de Preparo” deverá ser do tipo String formatada (HH:mm). 3.10.6 - O campo “Ingredientes” deverá ser do tipo lista/array, não permitido ser vazio, deve conter no mínimo de 2 ingredientes e não podem ser duplicados, sendo este um campo obrigatório 3.10.7 - O campo “Modo de Preparo” deverá ser do tipo memo, deverá ser obrigatório 3.10.8 - O Campo “Categoria” deverá ser do tipo enum: Doce ou Salgada 3.10.9 - O campo “Nível de Dificuldade” deverá ser do tipo enum: Fácil, Média ou Difícil.

3.11. Boas práticas 3.11.1. Os testes devem ser isolados e de formas independentes. 3.11.2. Cada caso de teste deve estar dentro de um bloco “IT” 3.11.3. Cada endpoint deve estar dentro de um bloco describe 3.11.4. O arquivo de README deve ser alterado com as novas inclusões 3.11.5. Centralizar todos os casos dentro de um arquivo no caminho (src/test) 3.11.6. Evite lógica dentro dos testes, se for necessário extraia para helpers. 3.11.7. Organize em AAA: Arrange/Act/Assert 3.11.8. Evite a dependência de dados.

3.12. Execute os testes ao finalizar, e se preciso faça as correções para que rode com sucesso.