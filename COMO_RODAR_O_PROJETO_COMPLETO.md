# Como rodar o projeto completo

[English](RUNNING_THE_PROJECT.md) · [Português (Brasil)](COMO_RODAR_O_PROJETO_COMPLETO.md) · [Español](RUNNING_THE_PROJECT.es.md)

Este guia reúne a preparação do PostgreSQL e Redis, a execução da API e a inicialização da interface Angular em desenvolvimento.

[Documentação do backend](README.pt-BR.md) · [Documentação do frontend](frontend/README.pt-BR.md)

## 1. Pré-requisitos

- Git.
- Node.js 22.12 ou superior da linha 22 e npm.
- Docker com Docker Compose disponível e daemon iniciado, ou instâncias próprias de PostgreSQL e Redis.
- Portas locais livres: `4200` (frontend), `3333` (API), `5432` (PostgreSQL) e `6379` (Redis).

```bash
node --version
npm --version
docker compose version
```

## 2. Obter o código e instalar as dependências

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript
npm ci
npm --prefix frontend ci
```

Se já tiver o repositório, use sua cópia local. Os comandos deste guia partem da raiz, salvo indicação contrária.

## 3. Configurar o backend

Copie o modelo se ainda não existir um `.env`:

```bash
cp dotenv.example .env
```

Edite o `.env` com as configurações locais abaixo. Se o arquivo já existir, preserve os valores que precisar manter.

```dotenv
PORT=3333
WEB_URL=http://localhost:4200
POSTGRES_URL=postgresql://docker:docker@localhost:5432/connect
REDIS_URL=redis://localhost:6379
```

| Variável | Finalidade |
| --- | --- |
| `PORT` | Porta HTTP da API |
| `WEB_URL` | Página da interface para a qual os convites redirecionam |
| `POSTGRES_URL` | Conexão com o banco de inscrições |
| `REDIS_URL` | Conexão com os contadores e o ranking |

Esses valores correspondem às portas e credenciais definidas no Compose do repositório. Para bancos próprios, ajuste as URLs e garanta que o banco `connect` exista. O `.env` já está ignorado pelo Git.

## 4. Iniciar os bancos

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=50 service-pg service-redis
```

Aguarde ambos os serviços ficarem disponíveis antes de continuar. Verifique as conexões:

```bash
docker compose exec service-pg pg_isready -U docker -d connect
docker compose exec service-redis redis-cli ping
```

O PostgreSQL deve informar que aceita conexões e o Redis deve responder `PONG`. Com instâncias próprias, pule os comandos Docker e confirme a disponibilidade nas URLs do `.env`.

O Compose utiliza as imagens `bitnami/postgresql` e `bitnami/redis`, sem tags fixadas. Se o download falhar por indisponibilidade ou restrição dessas imagens, será necessário configurar imagens acessíveis e suas variáveis correspondentes, ou usar instâncias próprias. O arquivo atual não define volumes persistentes explicitamente; não dependa da recriação dos containers para preservar seus dados.

## 5. Aplicar as migrações

Na raiz do repositório:

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
```

Esse comando lê `drizzle.config.ts` e aplica as migrações versionadas em `src/drizzle/migrations/`, incluindo a tabela `subscriptions`. Execute-o antes de cadastrar participantes e novamente quando houver novas migrações.

## 6. Iniciar a API

Em um terminal na raiz:

```bash
npm run dev
```

Mantenha esse terminal aberto. A documentação interativa estará em `http://localhost:3333/docs`. Uma consulta inicial ao ranking deve funcionar mesmo sem inscrições:

```bash
curl http://localhost:3333/ranking
```

Em um ambiente vazio, a resposta esperada é `{"ranking":[]}`.

## 7. Iniciar o frontend

Em outro terminal, na raiz:

```bash
npm --prefix frontend start
```

Abra `http://localhost:4200`. O proxy em `frontend/proxy.conf.json` envia as chamadas da interface para `http://127.0.0.1:3333`.

Se mudar a porta da API, ajuste `PORT` e os destinos do proxy. Se mudar o endereço da interface, ajuste `WEB_URL`. Reinicie os servidores após mudar essas configurações.

## 8. Verificar o fluxo completo

1. Na interface, inscreva uma pessoa com nome e e-mail.
2. No painel de confirmação, copie seu link de convite e anote as métricas atuais.
3. Abra o convite em outra janela. O acesso passa pela API, incrementa o contador e redireciona para a página inicial com `?referrer=ID`.
4. Cadastre outra pessoa com um e-mail diferente.
5. Volte ao painel da primeira pessoa e clique em **Atualizar resultados**.
6. Confira o aumento de um acesso e uma inscrição indicada. O participante passa a ter posição no ranking e aparece no top 3 se sua pontuação estiver entre as três maiores.

Reutilizar um e-mail existente recupera a inscrição e não gera outra indicação. Visitar o link sem concluir uma nova inscrição aumenta somente os acessos. Cliques repetidos também são contados; não há deduplicação de visitantes.

## 9. Rodar os testes e gerar os builds

Na raiz:

```bash
npm test
npm --prefix frontend test
npm run build
npm --prefix frontend run build
```

Os testes do backend usam bancos simulados; os do frontend usam respostas HTTP simuladas. Eles dispensam serviços ativos. A verificação manual anterior complementa essas suítes com o fluxo integrado real.

O backend gera `dist/`, e o frontend gera `frontend/dist/connect/browser/`. Os builds não iniciam os servidores. A publicação exige configurar hospedagem da interface, encaminhamento das chamadas à API, fallback das rotas Angular e variáveis do ambiente de destino.

## 10. Encerrar o ambiente

Use `Ctrl+C` nos terminais da API e do frontend. Para parar os bancos mantendo os containers:

```bash
docker compose stop
```

Para retomar os bancos, execute `docker compose start`, depois inicie novamente API e frontend.

## Solução de problemas

| Sintoma | O que conferir |
| --- | --- |
| Falha na instalação pelo npm | Versão do Node e acesso ao registro. Se aparecer `Cannot read properties of null (reading 'edgesOut')`, tente `npx --yes npm@11 ci` na pasta afetada. |
| Erro de validação ao iniciar a API | Todas as URLs do `.env` precisam estar preenchidas e válidas; use `PORT=3333`. |
| Conexão recusada nos bancos | Disponibilidade dos serviços, portas e URLs do `.env`; consulte os logs do Compose. |
| Tabela `subscriptions` não existe | Execute as migrações no mesmo banco configurado para a API. |
| Interface abre, mas inscrição ou painel falham | Confirme que a API está ativa em `3333` e que o proxy aponta para ela. |
| Convite redireciona para endereço incorreto | Ajuste `WEB_URL` para a página inicial do frontend e reinicie a API. |
| Porta já está em uso | Pare o serviço conflitante ou altere a porta e todas as configurações correspondentes. |
| Posição vazia e ranking sem participantes | Novas inscrições sem indicações ainda não possuem pontuação; teste com outro e-mail pelo convite. |
| Falha ao obter imagens Docker | Verifique acesso às imagens usadas pelo Compose ou configure instâncias próprias dos bancos. |

## Documentação relacionada

- [Backend: arquitetura, endpoints e testes](README.pt-BR.md).
- [Frontend: interface, uso e desenvolvimento](frontend/README.pt-BR.md).
- [Requisições HTTP de exemplo](api.http).
- [Swagger local](http://localhost:3333/docs), com a API em execução.
