## Why

O formulário de mensagem atual (`src/app/dashboard/mensagens/[id]/mensagem-form.tsx`) permite editar o texto e o status de uma mensagem externa, mas não possibilita anexar uma imagem. Para enriquecer o conteúdo enviado aos afiliados, o usuário precisa da capacidade de enviar uma única imagem que fica armazenada no MinIO e referenciada na mensagem.

## What Changes

- Adicionar a lib oficial `minio` (e `@types/minio` como dependência de desenvolvimento) ao projeto.
- Criar um cliente MinIO server-side configurado a partir de variáveis de ambiente (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`).
- Documentar as novas variáveis de ambiente no arquivo `.env.example`.
- Criar uma rota de upload `POST /api/mensagem-externa/[id]/upload` que recebe um `FormData` com a imagem, gera um nome de arquivo no formato `{id}-{random4}.{ext}`, faz o upload para o bucket do MinIO e retorna a URL pública da imagem.
- Modificar o formulário `mensagem-form.tsx` para incluir um input de imagem (`<input type="file">`) opcional que, ao selecionar uma imagem, envia o arquivo para a rota de upload e armazena a URL retornada.
- Modificar o handler `PATCH /api/mensagem-externa/[id]` para aceitar o campo opcional `imageUrl` (URL ou identificador da imagem no MinIO) e repassá-lo à API upstream.
- Atualizar a função `updateMensagemExterna` em `src/lib/api/mensagem-externa.ts` para incluir `imageUrl` no corpo da requisição PATCH (campo opcional).
- O campo `MensagemExterna` type passa a incluir o atributo opcional `imageUrl`.
- A imagem **não é obrigatória** — o usuário pode salvar a mensagem sem enviar imagem.

## Capabilities

### New Capabilities
- `minio-image-upload`: Upload de imagem para o MinIO com geração de nome de arquivo baseada no ID da mensagem, rota de upload server-side, e integração do input de imagem no formulário de mensagem.

### Modified Capabilities
<!-- Nenhuma capability existente possui specs em openspec/specs/, portanto não há specs para modificar. -->

## Impact

- **Dependências**: Adição de `minio` (runtime) e `@types/minio` (dev) ao `package.json`.
- **Arquivos de código**:
  - `src/lib/minio.ts` (novo) — cliente MinIO server-side.
  - `src/lib/api/mensagem-externa.ts` — adição do campo `imageUrl` no tipo e na função `updateMensagemExterna`.
  - `src/app/api/mensagem-externa/[id]/route.ts` — handler PATCH aceita `imageUrl` opcional.
  - `src/app/api/mensagem-externa/[id]/upload/route.ts` (novo) — rota POST de upload.
  - `src/app/dashboard/mensagens/[id]/mensagem-form.tsx` — adição do input de imagem e lógica de upload.
- **Configuração**: `.env.example` documentará 6 novas variáveis de ambiente (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`).
- **APIs**: O handler PATCH passa a enviar `imageUrl` para a API upstream do Leonardo; a rota de upload é interna (Next.js route handler).
- **Sistemas externos**: MinIO deve estar acessível a partir do servidor Next.js (endereço, porta e credenciais configurados via env).
