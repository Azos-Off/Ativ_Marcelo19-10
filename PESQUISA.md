# PESQUISA — Autenticação, Autorização e JWT

**Projeto:** API Academia · **Grupo:** Matheus Andreato, Kevyn Freitas · 3º AI · ETECAMP

> Nota de transparência: este texto foi redigido com apoio da ferramenta de IA Claude (Anthropic) e revisado pelo grupo, com base nas fontes listadas em Referências e nos testes feitos no nosso projeto.

## A. Fundamentos

### 1. Autenticação × autorização

Autenticação é provar **quem você é**; autorização é decidir **o que você pode fazer** depois de identificado. No nosso projeto, a autenticação é o login: o aluno envia e-mail e senha e recebe um token. A autorização é, por exemplo, a regra de que a Ana só pode alterar os treinos dela, e de que só o ADMIN lista todos os usuários. Quando a autenticação falha (sem token, token inválido ou expirado), a API devolve **401**, porque ela não sabe quem é o usuário. Quando a autorização falha (a Ana tenta mexer no treino do Bruno), devolve **403**, porque a API sabe quem é, mas aquela pessoa não tem permissão. A documentação em português da MDN segue a mesma linha: o 401 indica que a requisição não tem credenciais de autenticação válidas.

### 2. Stateful × stateless

No login com sessão (como o `$_SESSION` do PHP), o servidor guarda os dados do usuário na memória ou no banco e entrega ao navegador só um identificador de sessão. Vantagem: o servidor controla tudo e pode encerrar a sessão na hora. Desvantagem: precisa guardar estado, o que complica escalar para vários servidores. No login com token (stateless), o próprio token carrega as informações e o servidor só confere a assinatura. Vantagem: não guarda nada e escala fácil. Desvantagem: é difícil invalidar um token antes de expirar. Na nossa API usamos token. Um artigo da TreinaWeb lembra que, em uma API REST, não há uma sessão disponível para guardar a autenticação, e por isso é comum usar autenticação baseada em token.

### 3. Hash × criptografia × encoding

**Hash** é uma transformação de mão única: dá para gerar o hash de um texto, mas não dá para voltar ao original. **Criptografia** é de mão dupla: quem tem a chave consegue descriptografar. **Encoding** (como o Base64) é só uma mudança de formato, sem segredo nenhum; qualquer pessoa decodifica. Para **senhas** usamos hash (bcrypt), porque o servidor nunca precisa saber a senha original, só comparar. O **header e o payload do JWT** usam encoding (Base64URL), por isso qualquer um consegue ler o conteúdo do token; o que protege o token é a assinatura, e não o encoding.

### 4. bcrypt e salt

MD5 e SHA-256 foram feitos para serem rápidos, o que ajuda um atacante a testar bilhões de senhas por segundo. O bcrypt é propositalmente lento e ajustável. O **custo** (no nosso projeto, 10) define quantas rodadas de cálculo são feitas: cada aumento de 1 dobra o tempo. O **salt** é um valor aleatório gerado a cada senha e embutido no hash. Por causa dele, dois usuários com a mesma senha têm hashes diferentes, e tabelas prontas de hashes (rainbow tables) deixam de funcionar. No `register` usamos `bcrypt.hash(password, 10)`. O trabalho de Silva (2023), da UFPB, também usa o bcrypt para o hash de senhas em uma API de autenticação com JWT.

## B. JWT

### 5. Estrutura

Um JWT tem três partes separadas por ponto: **header** (algoritmo e tipo do token), **payload** (as informações, chamadas de claims) e **assinatura** (garante que o token não foi alterado). Geramos um token no projeto, logando com a Ana, e colamos no jwt.io:

```
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "role": "USER", "iat": 1792358824, "exp": 1792362424, "sub": "2" }
```

Aqui, `sub: "2"` é o id da Ana e `role: "USER"` é o perfil dela.

### 6. Claims

`sub` (subject) identifica o dono do token, no nosso caso o id do usuário. `iat` (issued at) é o momento em que o token foi emitido. `exp` (expiration) é o momento em que ele deixa de valer; todos em segundos desde 1970. No nosso token colocamos `sub` e `role` (e a biblioteca adiciona `iat` e `exp`). O `role` está lá para o `autorizar` decidir sem consultar o banco. Não deve ir no payload nada sensível, como senha, porque o payload pode ser lido por qualquer pessoa.

### 7. Assinatura

A assinatura é calculada com o header, o payload e a `JWT_SECRET` (algoritmo HS256). Se o usuário trocar `"role":"USER"` por `"ADMIN"`, o payload muda e a assinatura antiga deixa de bater; como ele não conhece a chave secreta, não consegue gerar outra válida, e o `jwt.verify` rejeita o token (401). A diferença entre os dois métodos: `jwt.decode()` apenas lê o conteúdo, **sem validar nada**; `jwt.verify()` confere a assinatura e a validade e lança erro se algo estiver errado. Por isso a autenticação usa sempre o `verify`.

### 8. Validade e logout

Como o token é stateless, o servidor não "esquece" um token depois do logout: ele continua válido até o `exp`. Do mesmo modo, se um USER virar ADMIN, o token antigo continua com `role: "USER"` até ele fazer login de novo. Uma solução comum é o **refresh token**: o access token tem vida curta (minutos) e, quando expira, o cliente usa um segundo token, de vida longa e guardado com mais cuidado, para pedir um novo. Assim um token roubado vale pouco tempo, e o servidor pode revogar o refresh token. No nosso projeto usamos só o access token de 1 hora.

## C. Segurança na prática

### 9. Onde guardar o token

No `localStorage` o JavaScript da página consegue ler o token, então ele fica exposto a **XSS** (Cross-Site Scripting: um script malicioso injetado na página). Um cookie **HttpOnly** não pode ser lido por JavaScript, o que protege contra XSS, mas, como o navegador envia cookies automaticamente, fica exposto a **CSRF** (Cross-Site Request Forgery: um site malicioso faz o navegador do usuário enviar uma requisição sem ele perceber). Cada opção troca um risco por outro. Silva (2023) descreve o CSRF da mesma forma: uma página falsa faz o navegador do usuário autenticado executar uma requisição legítima sem o conhecimento dele. Na nossa API o token vai no header `Authorization: Bearer`, enviado explicitamente pelo cliente.

### 10. Chave secreta

A `JWT_SECRET` é a chave que assina os tokens. Fica no `.env` para não ir parar no código nem no GitHub, e o `.env` está no `.gitignore` (no repositório vai só o `.env.example`, sem a chave real). Se ela vazar, qualquer pessoa consegue **fabricar tokens válidos**, inclusive com `role: "ADMIN"`, e a API acreditaria neles. A única solução seria trocar a chave, o que invalida todos os tokens existentes.

### 11. RBAC e dono do recurso

RBAC (controle de acesso por perfil) decide pelo papel do usuário: no projeto, o `autorizar('ADMIN')` em `userRoutes.js` deixa só o ADMIN listar usuários e mudar perfis. O controle por **dono** decide pela relação com o recurso: em `treinoController.js`, a função `buscarComPermissao` compara `treino.alunoId` com `req.usuario.id` e só deixa passar o dono (ou o ADMIN). O id do dono vem sempre do token, nunca do body. A OWASP coloca a quebra de controle de acesso em primeiro lugar no Top 10 de 2021 e cita a adulteração de um JWT para elevar privilégios como exemplo; por isso a verificação é feita sempre no servidor.

### 12. OWASP

Duas recomendações da OWASP e como o projeto se comporta:

1. **Guardar senhas com hash forte e adaptativo** (Password Storage Cheat Sheet): a OWASP recomenda algoritmos lentos com salt e fator de trabalho adequado. Seguimos: usamos bcrypt com salt automático e custo 10. A OWASP prefere o Argon2id quando possível; bcrypt é aceito.
2. **Mensagens de erro genéricas no login** (Authentication Cheat Sheet): não revelar se o e-mail existe. Seguimos: e-mail inexistente e senha errada devolvem a mesma resposta, "Credenciais inválidas".

O que ainda **não** seguimos: limitar tentativas de login (rate limit) para frear ataques de força bruta. Faríamos isso em produção.

## Referências

1. SILVA, Zaqueu Moura da. **Desenvolvimento de API REST de autenticação utilizando Spring para arquiteturas de microsserviços**. 2023. 47 f. Trabalho de Conclusão de Curso (Graduação em Engenharia de Computação) — Centro de Informática, Universidade Federal da Paraíba, João Pessoa, 2023. Disponível em: <https://repositorio.ufpb.br/jspui/bitstream/123456789/31769/1/Zaqueu%20Moura%20da%20Silva_TCC.pdf>. Acesso em: 18 out. 2026.
2. OWASP. **OWASP Top 10:2021 — A01:2021 Quebra de Controle de Acesso** (tradução em português). Disponível em: <https://owasp.org/Top10/2021/pt-BR/A01_2021-Broken_Access_Control/>. Acesso em: 18 out. 2026.
3. MDN WEB DOCS. **401 Unauthorized** (versão em português). Disponível em: <https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status/401>. Acesso em: 18 out. 2026.
4. TREINAWEB. **Fluxo de autenticação baseado em JWT**. Disponível em: <https://www.treinaweb.com.br/blog/fluxo-de-autenticacao-baseado-em-jwt>. Acesso em: 18 out. 2026.
5. JONES, M.; BRADLEY, J.; SAKIMURA, N. **RFC 7519 — JSON Web Token (JWT)**. IETF, 2015. Disponível em: <https://datatracker.ietf.org/doc/html/rfc7519>. Acesso em: 18 out. 2026.
6. JWT.IO. **Introduction to JSON Web Tokens**. Disponível em: <https://www.jwt.io/introduction>. Acesso em: 18 out. 2026.
7. OWASP. **Password Storage Cheat Sheet**. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>. Acesso em: 18 out. 2026.
8. OWASP. **Authentication Cheat Sheet**. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>. Acesso em: 18 out. 2026.
9. AUTH0. **node-jsonwebtoken** (README do pacote). Disponível em: <https://github.com/auth0/node-jsonwebtoken>. Acesso em: 18 out. 2026.
10. CLAUDE (Anthropic). Ferramenta de IA usada como apoio na redação e na explicação dos conceitos. Acesso em: 18 out. 2026.
