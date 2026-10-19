# Arquitetura e fluxo de dados

[Voltar ao README](../README.md)

## Organização

| Caminho                    | Responsabilidade                                                     |
| -------------------------- | -------------------------------------------------------------------- |
| `src/app`                  | Páginas/layout Next e adaptadores HTTP em `api/`                     |
| `src/features`             | Interface e comportamento organizados por funcionalidade             |
| `src/features/game/api`    | Cliente HTTP, validação de respostas e assinatura de eventos         |
| `src/server/game`          | Regras, serviço, contrato de persistência e implementação PostgreSQL |
| `src/server/realtime`      | Origens, autenticação de sockets e assinatura PostgreSQL             |
| `src/components`           | Componentes compartilhados e primitivas locais de UI                 |
| `src/content` e `src/i18n` | Dados do portfólio e mensagens nos dois idiomas                      |
| `api/realtime.ts`          | Entrada Node HTTPServer do serviço de eventos                        |
| `database` e `tests`       | Schema SQL e verificações                                            |

Não há ORM, framework de injeção de dependências ou classes base genéricas. O código usa funções, componentes e contratos TypeScript.

## Responsabilidades em uma rodada

```mermaid
sequenceDiagram
    participant UI as Interface
    participant API as API Next
    participant DB as PostgreSQL
    participant RT as Serviço Socket.IO
    UI->>API: POST com requestId, generation e bet
    API->>DB: Transação e lock da sessão
    API->>DB: Consultar intenção, calcular e persistir
    DB-->>RT: NOTIFY entregue após commit
    API-->>UI: Resultado confirmado
    Note over UI: Cache recebe confirmação; apresentação aguarda animação
    RT-->>UI: Aviso para consultar a sessão
    UI->>API: GET quando a apresentação puder sincronizar
```

A ordem de chegada da resposta e do evento não é garantida. Por isso o cliente compara versão/geração, agrupa avisos e adia leituras enquanto POST/animação controlam a apresentação.

### Estado remoto e visual

[use-game-session.ts](../src/features/game/hooks/use-game-session.ts) coordena Query, mutações e recuperação. O cache recebe o resultado confirmado, mas `sessionBeforeSpin` preserva os dados apresentados. [remote-view.ts](../src/features/game/remote-view.ts) conserva saldo, histórico e prêmio anteriores durante o giro; o resultado dos rolos é revelado por etapas. Ao terminar, a apresentação usa o snapshot confirmado. Movimento reduzido elimina a espera visual.

[session-state.ts](../src/features/game/session-state.ts) mantém somente a intenção pendente em `sessionStorage`, não o saldo autorizado. Uma falha incerta faz uma tentativa de recuperação por GET; se continuar inconclusiva, a interface bloqueia uma nova aposta e oferece ações explícitas. Um 404 de rodada pode ocorrer antes do commit original e não prova cancelamento.

### Consistência no servidor

[game-service.ts](../src/server/game/game-service.ts) decide o comportamento; [rules.ts](../src/server/game/rules.ts) calcula valores. O sorteio usa `crypto.randomInt` no servidor, fornecido por [runtime.ts](../src/server/game/runtime.ts). O cliente não determina os símbolos confirmados.

[storage.ts](../src/server/game/storage.ts) executa transações e `SELECT ... FOR UPDATE` na sessão. A leitura da intenção, alteração do saldo e gravação da rodada usam a mesma transação/conexão. Repetir o mesmo identificador com os mesmos dados devolve a operação anterior; dados conflitantes geram erro. Versão ordena operações; geração distingue reinícios.

O prêmio total é `aposta × multiplicador` para três símbolos iguais; o saldo final é `saldo anterior - aposta + prêmio`. Apostas: 10/25/50; multiplicadores: folha 3, flor 5, fruto 8, gema 15. Sessões duram 24 horas e admitem no máximo 500 operações confirmadas, contando reinícios. Reiniciar não renova prazo ou limite. O histórico apresentado contém até cinco rodadas da geração atual.

## Padrões concretos

| Escolha                 | Onde                                          | Por que existe                                                    |
| ----------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Composição              | `GameBoard`, `GameReels`, `GameHistory`       | Reutilizar partes visuais sem misturar persistência no componente |
| Serviço de aplicação    | `createGameService`                           | Concentrar o fluxo e as invariantes da sessão                     |
| Repository              | `GameRepository` e `createPostgresRepository` | Separar comportamento da implementação SQL/transacional           |
| Dependências explícitas | `repository`, `draw`, `newId`                 | Testar cenários determinísticos sem uma camada de DI              |
| Funções puras           | `calculatePrize`, `settleRound`, `applyRound` | Verificar regras e transformação de estado isoladamente           |

O repository em memória de testes não prova concorrência PostgreSQL; a suíte de integração cobre esse comportamento em conexões reais independentes.

## Fronteira dos roteadores

Next.js controla as URLs públicas. Em `/play`, [workspace.tsx](../src/features/game/components/workspace.tsx) cria um TanStack Router com histórico em memória para Máquina, Regras e Exemplos. Ele preserva o workspace montado, mas não oferece URLs públicas independentes para esses painéis; recarregar volta ao painel inicial. A interface que acessa APIs do navegador é carregada no cliente por `game-entry.tsx`.

## API e proteção da sessão

| Método | Caminho                                | Finalidade                                      |
| ------ | -------------------------------------- | ----------------------------------------------- |
| GET    | `/api/game/session`                    | Recuperar sessão ativa                          |
| POST   | `/api/game/session`                    | Criar ou recuperar sessão pelo cookie existente |
| POST   | `/api/game/rounds`                     | Confirmar rodada idempotente                    |
| GET    | `/api/game/rounds/[id]`                | Recuperar uma rodada por identificador          |
| POST   | `/api/game/session/reset`              | Reiniciar a geração com identificador/versão    |
| GET    | `/api/health` e `/api/realtime/health` | Disponibilidade HTTP dos processos              |

O cookie `canopy-session` é HTTP-only, SameSite Strict, limitado a `/api` e Secure em produção. O banco guarda seu hash SHA-256. Não há conta de usuário: perder o cookie significa perder o acesso àquela sessão.

[http.ts](../src/server/game/http.ts) verifica origem e Content-Type nas mutações, limita o corpo a 4 KiB e traduz erros conhecidos. Zod valida entradas e o cliente valida respostas. Isso complementa tipos estáticos; não equivale a uma solução completa de autenticação ou proteção contra abuso.

## Eventos e recuperação

O PostgreSQL entrega `NOTIFY` após o commit; cada instância de eventos mantém um `LISTEN` em conexão direta. O socket é autenticado pelo cookie e participa apenas da sala da própria sessão. Os eventos `round:completed` e `session:reset` avisam para buscar o snapshot HTTP; o cliente não credita valores recebidos pelo socket.

Socket.IO usa somente WebSocket, caminho `/api/realtime/socket.io` e `addTrailingSlash: false` nos dois lados. Há três tentativas automáticas e uma ação Reconectar. Conectar novamente consulta a API; não reenvia POST de rodada. Se o `LISTEN` cair, os sockets da instância são fechados para não aparentar assinatura saudável. Não existe replay durável nem garantia de entrega de todos os avisos.
