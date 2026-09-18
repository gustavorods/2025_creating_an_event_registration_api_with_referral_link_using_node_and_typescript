# Connect — Interface de inscrições

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

Uma interface web para se inscrever em um evento, compartilhar convites e acompanhar indicações.

[Como rodar o projeto completo](../COMO_RODAR_O_PROJETO_COMPLETO.md) · [Documentação do backend](../README.pt-BR.md)

## Descrição

O frontend simplifica a jornada do participante: inscrição com nome e e-mail, acesso ao link pessoal de convite e consulta dos resultados em um painel. A interface é responsiva, em português, e exibe os dados retornados pela API.

Na página inicial (`/`), o formulário valida os campos e captura o parâmetro `?referrer=ID`, quando presente. Após a inscrição, o participante acessa `/inscricao/:id`, onde pode copiar seu convite, consultar acessos, inscrições indicadas e posição, além de ver os três primeiros do ranking.

O link compartilhado passa por `/invites/:id`, na API, para registrar o acesso antes de redirecionar à inscrição. O botão de atualização consulta as métricas novamente. Em falhas de rede, a interface apresenta uma mensagem e permite tentar outra vez.

Usar um e-mail já cadastrado recupera a inscrição existente. O projeto não possui login ou autenticação, e o frontend não salva nome ou e-mail no armazenamento do navegador.

## Status do projeto

Em desenvolvimento, com o fluxo de inscrição, compartilhamento e acompanhamento integrado à API.

## Tecnologias utilizadas

- Angular 21 e TypeScript.
- Angular Router, HttpClient e formulários reativos.
- Signals e RxJS para estado e requisições.
- HTML e CSS para o layout responsivo.
- Vitest e ferramentas de teste do Angular.

## Instalação

Para desenvolver apenas a interface, use Node.js 22.12 ou superior da linha 22 e npm. A API deve estar disponível para inscrições e métricas; sua preparação está no [guia do projeto completo](../COMO_RODAR_O_PROJETO_COMPLETO.md).

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript/frontend
npm ci
npm start
```

Se já clonou o repositório, entre em `frontend/` e execute apenas os dois comandos npm. Abra `http://localhost:4200`.

O arquivo [proxy.conf.json](proxy.conf.json) encaminha `/subscriptions`, `/subscribers/**`, `/ranking` e `/invites/**` para `http://127.0.0.1:3333` durante o desenvolvimento. Ajuste esse destino caso sua API use outro endereço.

## Uso

1. Informe nome e e-mail e confirme a inscrição.
2. Copie o link pessoal exibido no painel e compartilhe-o.
3. Consulte acessos, inscrições indicadas e posição no ranking.
4. Use **Atualizar resultados** para buscar as métricas mais recentes.

As principais partes da interface estão em:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/app/registration.ts` | Formulário, validação e captura de indicação |
| `src/app/dashboard.ts` | Convite, métricas e ranking |
| `src/app/api.ts` | Comunicação HTTP com o backend |
| `src/styles.css` | Estilos e identidade visual |

### Testes e build

Na pasta `frontend/`:

```bash
npm test
npm run build
```

Os testes verificam o formulário e os contratos HTTP com respostas simuladas. O build fica em `dist/connect/browser`.

Na publicação, encaminhe os caminhos da API ao backend e configure o fallback para `index.html` nas rotas da interface, incluindo `/inscricao/:id`. O proxy do Angular atua somente no desenvolvimento. Para uma API em outra origem, configure o token `API_URL` em `src/app/api.ts` e gere o build novamente; o backend deve permitir a origem pelo CORS e usar o endereço público da interface em `WEB_URL`.

## Docker

O frontend não possui Dockerfile ou imagem publicada documentada. A execução conjunta com os serviços de infraestrutura está descrita no [guia completo](../COMO_RODAR_O_PROJETO_COMPLETO.md).

## Contribuição

Faça um fork, crie uma branch e implemente sua alteração. Execute `npm test` e `npm run build` nesta pasta e abra um pull request com uma descrição e instruções de validação. Para mudanças visuais, inclua imagens do resultado quando possível.

## Licença

O backend declara ISC em seu [package.json](../package.json). O frontend não declara uma licença própria e o repositório ainda não possui arquivo `LICENSE`.

## Links úteis

- [Como rodar o projeto completo](../COMO_RODAR_O_PROJETO_COMPLETO.md).
- [Documentação do backend](../README.pt-BR.md).
- [Swagger local da API](http://localhost:3333/docs), disponível com o backend ativo.
- [Repositório](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript).
