# Estado restaurado

Esta versão corresponde ao pacote que corrigiu a conexão por QR Code e código de pareamento.

## Mantido

- `@whiskeysockets/baileys` 6.7.24.
- `makeWASocket` compatível com o export da biblioteca oficial.
- Código de pareamento solicitado dentro de `connection.update`, depois que o socket emite `qr`.
- QR Code com limpeza da sessão antiga quando a opção 1 é escolhida.
- Listener de `messages.upsert` registrado antes das rotinas demoradas de inicialização.
- Cases e estrutura original do bot.

## Desfeito nesta restauração

Foram removidas as alterações da auditoria ampla posterior, incluindo normalização automática de envelopes de mensagens, fallbacks de `remoteJidAlt`/`participantAlt`, mudanças no armazenamento cacheado de chaves e alterações adicionais nos sub-bots.

O pacote não inclui sessão antiga do WhatsApp, `node_modules`, `.env` ou cookies.
