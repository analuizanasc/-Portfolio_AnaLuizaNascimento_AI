PROMPT:

Objetivo: usar /supertest-skill para criar casos de teste com superTest

Contexto:
-O arquivo @test-plan-recipe-api.md  tem um plano de teste que deve ser seguido para a criação dos tests solicitados.
- Os casos de testes que devem ser criados devem ser criados a partir da utilização da técnica de teste elencada em cada regra no plano de teste.
- Utilizar as massas no fixtures 
- Utilize o swagger da aplicação contido em /docs/swagger.yaml para obter as informações relevantes do teste.

Regras 
- Não me pergunte nada, só faça. 
- Faça uso de Data-Driven Testing, extraindo os dados do teste e colocando em arquivos de fixture, para permitir que seja mais fácil controlar as informações usadas no teste (Corpo da Requisição e Corpo da Resposta) 
- Crie uma pasta específica para armazenar os testes (src/test/api)
- Implemente a execução dos testes com geração de relatório com a biblioteca mochawesome, de modo a rodar com e sem a geração de relatórios. 
- Use o arquivo Swagger apresentado no contexto para definir como interagir com a API. 
-  Não me pergunte se desejo prosseguir, apenas implemente o código.














Regras de Negócio da API
Autenticação
Toda rota de receita e exclusão de conta exige token JWT no header Authorization: Bearer <token>
Token sem prefixo Bearer é rejeitado
Token inválido ou expirado é rejeitado
O token expira em 8 horas
Cadastro de Usuário — POST /users
nome, email e senha são obrigatórios; se qualquer um estiver ausente ou vazio (após trim), retorna erro geral sem validar os demais campos
nome: mínimo 3, máximo 100 caracteres (após trim)
email: deve corresponder ao padrão x@x.x; máximo 150 caracteres; deve ser único no sistema
senha: mínimo 6, máximo 100 caracteres (após trim); armazenada com hash bcrypt
Trim aplicado nos três campos antes de qualquer validação
Login — POST /login
email e senha são obrigatórios (após trim)
Se o e-mail não existir no sistema: erro 401
Se a senha não bater com o hash: erro 401
Em caso de sucesso: retorna token JWT com id e email no payload
Exclusão de Conta — DELETE /users/me
Apenas o próprio usuário autenticado pode excluir sua conta
Favoritos feitos pelo usuário em receitas de outros são removidos
As receitas criadas pelo usuário permanecem no sistema — quem já havia favoritado continua com acesso; o autor passa a aparecer como "Desconhecido"
Se o token ainda for válido mas a conta já tiver sido removida: retorna 404
Cadastro de Receita — POST /recipes
Requer autenticação
nome: obrigatório, mínimo 3, máximo 50 caracteres (após trim); não pode ser apenas espaços
nome é único por usuário (comparação case-insensitive); mesmo nome de outro usuário é permitido
ingredientes: obrigatório, deve ser array; mínimo 2 itens, máximo 50; cada item entre 2 e 50 caracteres; duplicatas não são permitidas (comparação após normalização); todos normalizados para lowercase com trim
modoPreparo: obrigatório, mínimo 10, máximo 2000 caracteres (após trim)
nivelDificuldade: obrigatório, enum Facil | Media | Dificil
categoria: opcional, enum Doce | Salgada | Sem_gluten | Sem_lactose | Sem_acucar_refinado; vazio/null aceito
tempoPreparo: opcional, formato HH:mm obrigatório quando informado; vazio/null aceito
link: opcional, quando informado deve ser string e máximo 300 caracteres; formato de URL não é validado; vazio/null aceito
notas: opcional, máximo 500 caracteres (após trim); vazio/null aceito
Edição de Receita — PUT /recipes/:id
Requer autenticação
Apenas o autor da receita pode editar
Aplica exatamente as mesmas validações de campo do cadastro
Não pode renomear para um nome que já exista em outra receita do mesmo usuário (case-insensitive); manter o mesmo nome não gera conflito
Ingredientes são renormalizados para lowercase no momento da edição
Exclusão de Receita — DELETE /recipes/:id
Requer autenticação
Apenas o autor pode excluir
Ao excluir, todos os favoritos apontando para aquela receita são removidos automaticamente
Listagem de Receitas — GET /recipes
Requer autenticação
Query param scope é obrigatório; valores aceitos: me ou all
scope=me: retorna receitas criadas pelo usuário + receitas que ele favoritou
scope=all: retorna todas as receitas do sistema
Filtro nome: busca parcial, case-insensitive
Filtro ingrediente: busca parcial dentro do array de ingredientes, case-insensitive
Filtros combinados aplicam lógica AND
Sem resultados: retorna 200 com { message, data: [] } em vez de array vazio simples
Campo isFavorited:
true para receitas favoritadas pelo usuário autenticado
false para receitas próprias ou não favoritadas
Campo autor sempre presente; exibe "Desconhecido" se o autor tiver excluído a conta
Favoritar Receita — POST /recipes/:id/favorite
Requer autenticação
Usuário não pode favoritar a própria receita
Não é permitido favoritar a mesma receita duas vezes
Ao favoritar, a receita passa a aparecer no scope=me do usuário com isFavorited: true e referência ao autor original
Ao excluir a própria conta, os favoritos feitos pelo usuário são removidos; os favoritos de outros usuários apontando para suas receitas permanecem
/ini
