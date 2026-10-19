# Desenvolvimento

[Voltar ao README](../README.md)

## Ambiente

Use Node 22.19.0 e npm 11.6.0, conforme `.nvmrc` e `package.json`. Execute `npm ci` na raiz para instalar as versões do lockfile. O script `prepare` configura o Husky em um clone Git de desenvolvimento.

Copie `.env.example` para `.env.local`; os arquivos de ambiente reais são ignorados pelo Git. Não coloque credenciais em variáveis `NEXT_PUBLIC_*`: seus valores entram no JavaScript do navegador durante o build. Alterar um valor público requer reiniciar o desenvolvimento ou gerar novo build/deploy. [Referência Next.js](https://nextjs.org/docs/app/guides/environment-variables).

| Variável                    | Uso                                               | Desenvolvimento                                                      |
| --------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`              | Conexão PostgreSQL da API e consultas do realtime | Obrigatória para sessões; conexão pooled do banco de desenvolvimento |
| `REALTIME_DATABASE_URL`     | Conexão direta para `LISTEN`                      | Opcional no Neon: derivada removendo `-pooler` do hostname           |
| `NEXT_PUBLIC_REALTIME_URL`  | Endereço do serviço de eventos                    | `http://localhost:3001`                                              |
| `NEXT_PUBLIC_REALTIME_PATH` | Caminho do transporte                             | `/api/realtime/socket.io`                                            |
| `REALTIME_PORT`             | Porta do processo local de eventos                | `3001`                                                               |
| `REALTIME_ALLOWED_ORIGINS`  | Origens exatas permitidas, separadas por vírgula  | `http://localhost:3000`                                              |
| `TEST_DATABASE_URL`         | Banco exclusivo para testes de integração         | Não usar PRD ou HML                                                  |

Para outro pooler em modo transação, forneça `REALTIME_DATABASE_URL` direta explicitamente. Não desative a validação TLS para resolver erros de conexão.

## Preparar o PostgreSQL

1. Crie um banco local ou uma branch Neon exclusiva de desenvolvimento.
2. Copie a conexão para `DATABASE_URL` em `.env.local`.
3. Abra o editor SQL do mesmo banco e execute o conteúdo de [001-game.sql](../database/001-game.sql).
4. Confira a existência de `game_sessions`, `game_rounds` e `game_resets`.

Se você já usa `psql` e tem `DATABASE_URL` configurada no processo PowerShell, também pode aplicar o arquivo assim:

```powershell
psql --dbname "$env:DATABASE_URL" --set ON_ERROR_STOP=1 --file database/001-game.sql
```

`psql` não lê `.env.local` sozinho. A migration cria tabelas e índices com `IF NOT EXISTS`; ela não é um sistema de atualização de schemas já existentes. Alterações futuras exigem migrations novas e revisão de compatibilidade. O deploy não aplica migrations automaticamente.

## Rodar

`npm run dev` inicia o Next na porta 3000. Em outro terminal, `npm run dev:realtime` inicia o servidor Node na porta 3001. O segundo comando carrega `.env` e `.env.local`, com precedência do segundo; variáveis do processo prevalecem sobre os arquivos.

Para conferir o build de produção local:

```sh
npm run build
npm run start
```

O servidor realtime continua sendo um processo separado. As páginas públicas não dependem dele para renderizar. A sessão usa cookie HTTP-only, portanto o saldo não é recuperado a partir de localStorage.

## Comandos

| Comando                    | Finalidade                                      |
| -------------------------- | ----------------------------------------------- |
| `npm run lint`             | ESLint, sem warnings aceitos                    |
| `npm run format:check`     | Conferir Prettier                               |
| `npm run format`           | Formatar arquivos                               |
| `npm run typecheck`        | Gerar tipos de rotas Next e conferir TypeScript |
| `npm test`                 | Suíte padrão, sem PostgreSQL externo            |
| `npm run test:watch`       | Testes em observação                            |
| `npm run test:integration` | Integração com PostgreSQL explícito             |
| `npm run check`            | Lint, formato, tipos, testes e build            |

## Testes

A suíte padrão inclui regras, contratos HTTP, recuperação, apresentação, idiomas e conexões locais de eventos com dependências controladas. Ela abre portas locais efêmeras, mas não precisa acessar o Neon.

Os testes de integração usam `TEST_DATABASE_URL` do processo. Para carregar o valor de `.env.local` sem copiar credenciais no terminal:

```sh
node --env-file=.env.local node_modules/vitest/vitest.mjs run --config vitest.integration.config.ts
```

Use um banco exclusivo de testes, cujo usuário possa criar schemas. Cada suíte cria um schema aleatório, aplica o SQL, verifica transações/eventos e remove esse schema ao terminar. Uma interrupção abrupta pode deixar schemas de teste para limpeza posterior. Nunca aponte essa variável para produção. Sem configuração, a suíte falha explicitamente.

## Diagnóstico

| Sintoma                                                  | Conferir                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| GET de sessão retorna 401                                | Sem cookie ou sessão expirada: usar Iniciar demonstração; não remover a autenticação                            |
| API retorna 503                                          | `DATABASE_URL`, acesso ao banco, schema e logs do servidor; não publicar credenciais                            |
| Saldo aparece, mas eventos ficam indisponíveis           | Processo de eventos, origem, caminho, cookie e conexão direta PostgreSQL; HTTP e WebSocket são canais distintos |
| WebSocket recebe 308                                     | Cliente e servidor precisam usar `addTrailingSlash: false`; o handshake canônico não termina em `/`             |
| Resposta da rodada se perde                              | Usar Verificar/Repetir da mesma intenção; não gerar outro identificador para ocultar a pendência                |
| Diferença de hidratação com `cz-shortcut-listen` no body | Comparar em perfil sem extensões antes de alterar a renderização da aplicação                                   |

Os healths `/api/health` e `/api/realtime/health` verificam resposta HTTP dos serviços. Eles não comprovam banco, sessão ou conexão WebSocket autenticada.
