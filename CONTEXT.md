# Dashboard de Mensagens de Afiliados

Dashboard onde o afiliado edita mensagens de venda e as envia para clientes via WhatsApp ou Telegram.

## Language

**Mensagem**:
Mensagem de venda que o afiliado edita no dashboard (texto + imagem opcional) e envia a um cliente via WhatsApp ou Telegram. Possui status (`pending`/`ok`).
_Avoid_: mensagem externa (nome apenas no código), texto

**Melhoria de mensagem**:
Versão aprimorada do rascunho de uma mensagem, gerada por LLM no backend. Substitui o conteúdo do editor para revisão; não é uma nova mensagem e não é salva automaticamente.
_Avoid_: reescrita, versão IA, nova mensagem
