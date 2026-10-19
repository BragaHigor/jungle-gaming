# Manutenção e limites

[Voltar ao README](../README.md)

## Alterações frequentes

| Alteração         | Arquivos a revisar                                                                        | Verificação                                                  |
| ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Perfil e projetos | `src/content/profile.ts`, componentes de `src/features/profile` e traduções               | Links externos, PT-BR/EN e responsividade                    |
| Nova seção        | Página em `src/app`, feature correspondente e navegação                                   | Semântica, foco, temas e duas traduções                      |
| Multiplicador     | `src/server/game/rules.ts` e tabela visual em `src/features/game/presentation.ts`         | Regras, serviço e apresentação; comparar cálculo e tabela    |
| Símbolo           | Contratos, regras, schemas de respostas, apresentação, ícones, traduções e constraint SQL | Migration nova; prêmio, validação e renderização concordam   |
| Persistência      | `GameRepository`, `storage.ts` e migrations                                               | Integração real: lock, rollback, idempotência e notificações |
| Caminho realtime  | Contrato compartilhado, variável pública e roteamento Vercel                              | Handshake sem redirect, cookie, origem e ACK                 |
| Idioma ou texto   | `src/i18n/locales/pt-BR.json` e `en.json`                                                 | Paridade de chaves, interpolação e larguras menores          |

### Exemplo: mudar um multiplicador

Altere o valor de `multipliers` em [rules.ts](../src/server/game/rules.ts) e o `multiplier` do símbolo em [presentation.ts](../src/features/game/presentation.ts). O cliente não decide o prêmio, mas precisa mostrar a mesma tabela que o servidor aplica. Ajuste expectativas dos testes de regras/serviço e confira a tabela nos dois idiomas. Não modifique rodadas históricas: elas já armazenam o prêmio e o saldo confirmados.

### Exemplo: adicionar um símbolo

O tipo `GameSymbol` nasce em `contracts.ts`. O sorteio lê essa lista, mas incluir o tipo não é suficiente: atualizar o schema de resposta Zod, as regras, os metadados/ícone, traduções e a constraint de `game_rounds.symbols`. Criar uma migration nova para bancos existentes, sem editar somente o SQL inicial. Conferir também fixtures, cenários da galeria e probabilidades resultantes. Não afirmar RTP ou certificação a partir desse ajuste.

### Exemplo: trocar a persistência

Implementar o contrato `GameRepository` preservando a semântica transacional de `withSession`, e conectar a implementação em `runtime.ts`. Isso mantém as regras isoladas, mas não torna a troca de banco automática: o serviço de eventos também usa PostgreSQL LISTEN/NOTIFY e precisaria de outro mecanismo de coordenação. A suíte em memória não substitui os testes do banco escolhido.

## Limites atuais

- Sessão por cookie, sem conta, login ou recuperação entre dispositivos. Não é autenticação completa.
- Créditos fictícios e sorteio de demonstração, sem integração com operadora de cassino, pagamentos, certificação ou promessa de RTP.
- Três rolos e quatro símbolos; histórico visual limitado a cinco rodadas. Não há paginação de todo o histórico.
- Até 500 operações por sessão e validade de 24 horas; reinício mantém esses limites. Limpeza de sessões expiradas é oportunista ao criar sessões, em lotes de até 20, sem prazo garantido de remoção física.
- LISTEN/NOTIFY não é fila durável. Um aviso perdido sem desconexão pode exigir Atualizar sessão manualmente.
- Pools e assinaturas consomem conexões por instância. O projeto não foi submetido a teste de carga nem tem capacidade de tráfego comprovada.
- Não há rate limit distribuído, observabilidade externa completa, backups/restore automatizados pelo app ou defesa abrangente contra abuso.
- Testes automatizados não equivalem a auditoria completa de acessibilidade, segurança ou todos os navegadores/dispositivos.

## Evolução orientada por necessidade

Medir volume de conexões, latência e erros antes de aumentar pools ou introduzir serviços. Considerar paginação quando houver necessidade de histórico extenso; proteção distribuída quando houver exposição/abuso observado; um canal durável quando perder avisos não puder ser tolerado. Essas evoluções não estão implementadas.

Antes de atualizar dependências, revisar changelog, peers e lockfile; executar check e integração pertinente. `npm audit` deve ser consultado novamente, pois os avisos mudam. Na revisão de implantação houve alertas altos na árvore de desenvolvimento de `braces`, sem versão corrigida disponível naquela consulta; isso não é motivo para executar `audit fix --force` e aceitar um downgrade incompatível sem revisão. Não tratar aquele resultado histórico como auditoria atual.
