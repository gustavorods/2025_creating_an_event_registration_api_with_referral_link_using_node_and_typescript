# Connect — API de inscrições e indicações

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

> **[Como isso funciona? (visão geral)](docs/como-funcionam-as-indicacoes/README.pt-BR.md)**
> Entenda o fluxo de indicações passo a passo, com exemplo e links para o código.

API para cadastrar participantes, acompanhar convites e consultar um ranking de indicações.

[Como rodar o projeto completo](COMO_RODAR_O_PROJETO_COMPLETO.md) · [Documentação do frontend](frontend/README.pt-BR.md)

## Descrição

O Connect reúne uma API de inscrições e uma interface web para compartilhar convites e acompanhar seus resultados. O backend recebe nome e e-mail, retorna o identificador do participante e contabiliza as novas inscrições originadas por seu link.

Um e-mail já cadastrado retorna o identificador existente sem gerar outra inscrição ou pontuar novamente. Cada acesso ao convite incrementa um contador; o ranking considera inscrições indicadas, não cliques. O sistema está em desenvolvimento e não possui autenticação: recuperar uma inscrição pelo e-mail não equivale a fazer login.

## Arquitetura do projeto

```mermaid
flowchart LR
    Browser[Navegador] --> Front[Frontend Angular]
    Front -->|HTTP / proxy no desenvolvimento| API[API Fastify]
    API -->|Inscrições| PG[(PostgreSQL)]
    API -->|Acessos e ranking| Redis[(Redis)]
    API -->|Convite: redirecionamento 302| Browser
```

- `frontend/`: interface de inscrição, confirmação, compartilhamento e métricas.
- `src/routes/`: endpoints HTTP, validação e contratos de resposta.
- `src/functions/`: regras de inscrição e indicação.
- `src/drizzle/`: conexão, esquema e migrações do PostgreSQL.
- `src/redis/`: conexão com Redis, usado para contadores e ranking.
- `tests/`: testes automatizados do backend.

As inscrições ficam na tabela `subscriptions`, com identificador UUID, nome, e-mail único e data de criação. O Redis mantém os acessos em `referral:access-count` e as pontuações em `referral:ranking`. As operações entre os dois bancos não formam uma transação única.

## Tecnologias utilizadas

| Componente | Tecnologias |
| --- | --- |
| API | Node.js, TypeScript, Fastify 5 |
| Validação e documentação | Zod, Swagger / OpenAPI |
| Persistência | PostgreSQL, Drizzle ORM, postgres.js |
| Contadores e ranking | Redis, ioredis |
| Desenvolvimento | tsx, tsup, Biome, Drizzle Kit |
| Testes do backend | Vitest, com dependências de banco simuladas |
| Interface web | Angular 21, RxJS, formulários reativos, CSS |
| Infraestrutura local | Docker Compose para os bancos |

As versões instaladas são fixadas pelos arquivos `package-lock.json` de cada componente.

## Instalação e configuração

Para iniciar API, interface e bancos juntos, siga o [guia completo](COMO_RODAR_O_PROJETO_COMPLETO.md). Os passos abaixo são para trabalhar somente no backend, com PostgreSQL e Redis já disponíveis.

Use Node.js 22.12 ou superior da linha 22 e npm.

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript
npm ci
cp dotenv.example .env
```

Se `.env` já existir, edite-o sem sobrescrever suas configurações. Para os serviços locais padrão, configure:

```dotenv
PORT=3333
WEB_URL=http://localhost:4200
POSTGRES_URL=postgresql://docker:docker@localhost:5432/connect
REDIS_URL=redis://localhost:6379
```

`WEB_URL` é o destino dos convites e deve apontar para a página de inscrição. As URLs dos bancos devem corresponder às suas instâncias. Com os bancos disponíveis, aplique as migrações e inicie a API:

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
npm run dev
```

A API atende em `http://localhost:3333`. Para gerar o build, execute `npm run build`; a saída fica em `dist/`.

## Uso

Consulte os contratos e experimente as requisições no [Swagger local](http://localhost:3333/docs), após iniciar a API.

| Método | Endpoint | Função |
| --- | --- | --- |
| POST | `/subscriptions` | Inscreve ou recupera participante pelo e-mail; retorna `201` e `subscriberId` |
| GET | `/invites/:subscriberId` | Conta um acesso e redireciona para `WEB_URL?referrer=ID` |
| GET | `/subscribers/:subscriberId/ranking/clicks` | Retorna `{ "count": número }` com acessos |
| GET | `/subscribers/:subscriberId/ranking/count` | Retorna `{ "count": número }` com inscrições indicadas |
| GET | `/subscribers/:subscriberId/ranking/position` | Retorna `{ "position": número ou null }` |
| GET | `/ranking` | Retorna `{ "ranking": [...] }` com até três participantes, seus nomes e pontuações |

```bash
curl -X POST http://localhost:3333/subscriptions \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Silva","email":"ana@example.com"}'

curl http://localhost:3333/ranking
```

Para registrar uma indicação, envie também `"referrer":"ID_DO_INDICADOR"` no corpo da inscrição. O arquivo [api.http](api.http) contém outras requisições; substitua os IDs de exemplo pelos retornados pela sua API. A validação exige nome como string e e-mail válido; o backend atual não verifica se o indicador informado existe.

## Docker

O repositório não possui Dockerfile nem uma imagem publicada da aplicação documentada. O [docker-compose.yml](docker-compose.yml) inicia apenas PostgreSQL e Redis:

```bash
docker compose up -d
```

A API e o frontend são iniciados separadamente com npm. Consulte o [guia completo](COMO_RODAR_O_PROJETO_COMPLETO.md) para a sequência e a verificação dos serviços.

## Documentação completa

- [Como rodar o projeto completo](COMO_RODAR_O_PROJETO_COMPLETO.md): configuração, execução, validação e solução de problemas.
- [Frontend](frontend/README.pt-BR.md): funcionamento e desenvolvimento da interface.
- [Swagger local](http://localhost:3333/docs): contratos da API com o backend em execução.
- [Esquema do banco](src/drizzle/schema/subscriptions.ts) e [migrações](src/drizzle/migrations/).
- [Requisições de exemplo](api.http).

## Testes

Na raiz do repositório:

```bash
npm test
npm run build
```

Os testes em `tests/functions.test.ts` verificam inscrições novas e repetidas, pontuação por indicação, falhas de persistência, acessos, contadores, posição e ordenação do ranking. PostgreSQL e Redis são simulados; os testes não precisam de `.env`, serviços ativos ou dados reais. Essa suíte testa as regras de negócio, sem validar a integração real dos bancos ou os contratos HTTP das rotas. O roteiro manual de integração está no [guia completo](COMO_RODAR_O_PROJETO_COMPLETO.md).

## Contribuição

Faça um fork, crie uma branch, implemente a alteração e execute os testes e o build do componente afetado. Abra um pull request explicando o problema resolvido e como validar o resultado. Atualize a documentação quando alterar configurações ou contratos da API.

## Licença

O backend declara a licença ISC em [package.json](package.json). O repositório ainda não contém um arquivo `LICENSE` com o texto da licença.

## Links úteis

- [Repositório e histórico](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript)
- [Configuração de ambiente](dotenv.example)
- [Configuração das migrações](drizzle.config.ts)
- [Proxy do frontend](frontend/proxy.conf.json)

## Contato

Para dúvidas, sugestões e relatos de problemas, abra uma [issue no repositório](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript/issues). Responsável pelo projeto: [gustavorods](https://github.com/gustavorods).
