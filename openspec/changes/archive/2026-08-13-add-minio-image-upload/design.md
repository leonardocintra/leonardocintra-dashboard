## Context

O dashboard administrativo (`leonardocintra-dashboard`) permite editar mensagens externas (enviadas a afiliados) através de `src/app/dashboard/mensagens/[id]/mensagem-form.tsx`. Hoje, o formulário suporta apenas edição de texto (`message`) e alteração de `status`. Mensagens externas frequentemente beneficiam-se de mídias visuais (imagens promocionais), mas o backend não tem como armazenar/recuperar imagens e o formulário não tem input de arquivo.

O projeto é construído em **Next.js 16** (App Router) com **React 19**, **TypeScript**, e já segue um padrão de proxies Next.js para uma API upstream (`LEONARDO_API_URL`). O environment example documenta apenas essa variável. Para armazenar arquivos, precisamos de um storage de objetos externo — a escolha é o **MinIO** (storage de objetos compatível com S3, comumente auto-hospedado), controlado por variáveis de ambiente.

A separação atual `proxy route handler → upstream API` permanece: a rota PATCH continua encaminhando para a API upstream do Leonardo, mas o storage de imagens é gerenciado por uma rota interna que fala diretamente com o MinIO.

## Goals / Non-Goals

**Goals:**
- Adicionar capacidade de fazer upload de **uma única imagem** por mensagem via formulário, sem obrigar o usuário a enviar imagem.
- Persistir a imagem no **MinIO** com URL acessível publicamente (ou via proxy bucket público) e associar a URL à mensagem via campo `imageUrl`.
- Modificar o endpoint PATCH para aceitar (e repassar) o campo opcional `imageUrl`.
- Manter o padrão atual de tipagem/exports de `src/lib/api/mensagem-externa.ts`.
- Documentar variáveis de ambiente no `.env.example` (sem alterar `.env`).

**Non-Goals:**
- Não suportar múltiplas imagens por mensagem (apenas uma).
- Não implementar listagem/galeria de imagens.
- Não implementar eliminação da imagem do MinIO quando o upload anterior for substituído (cleanup posterior pode entrar em outra change).
- Não implementar autenticação adicional à rota de upload — assume-se que o acesso continua protegido pelos mecanismos existentes (ex.: layout/middleware do dashboard).
- Não criar bucket automaticamente na primeira execução (assume-se provisionamento manual/operacional).
- Não trocar a API upstream do Leonardo — apenas adiciona um novo campo opcional.

## Decisions

### 1. Cliente MinIO server-side único, lazy-initialized

**Decisão**: Criar `src/lib/minio.ts` exportando uma função `getMinioClient()` que instancia/retorna o `Minio.Client` lendo o ambiente. Cache a instância em escopo de módulo (singleton) para evitar múltiplas conexões por cold start.

**Rationale**: A próxima/Next routes (`/api/...`) rodam server-side e compartilham o mesmo ambiente de processo. Singleton simplifica chamadas repetidas e evita custo de handshakes TLS extras.

**Alternativas**:
- *Inicializar client por requisição*: descartado por gerar overhead desnecessário a cada PATCH/upload.
- *Inicializar client em uma factory chamada por cada rota*: equivalente, mas mais prolixo.

### 2. Variáveis de ambiente para configuração do MinIO

**Decisão**: Usar 6 variáveis em `.env.example` (sem alterar `.env`):

```
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=mensagem-imagens
```

**Rationale**: Mantém paridade com a sugestão do usuário (endPoint/port/useSSL/accessKey/secretKey). Adiciona `MINIO_BUCKET` para isolar o bucket usado pelo app (não hardcoded — facilita ambientes diferentes).

**Alternativas**:
- *Hardcoded bucket*: rejeitado — impede multi-ambiente.
- *Variável única `MINIO_URL`*: rejeitado — perde tipagem estruturada e complica `useSSL` separado.

### 3. Rota dedicada `POST /api/mensagem-externa/[id]/upload`

**Decisão**: Em vez de fazer upload dentro do PATCH, criar uma rota dedicada em `src/app/api/mensagem-externa/[id]/upload/route.ts` que recebe `FormData` (com `multipart/form-data`), faz o upload para o MinIO e devolve a URL pública em JSON.

**Rationale**:
- PATCH com `multipart/form-data` para arquivo + JSON enviaria dois tipos de conteúdo diferentes — tornar a rota `upload` independente simplifica tipagem e tratamento.
- Permite reusar a rota de upload sem alterar o fluxo PATCH (boa coesão).
- O frontend faz upload primeiro, recebe `imageUrl`, depois dispara PATCH.

**Alternativas**:
- *Upload via PATCH multipart*: complexo, mistura JSON + arquivo, quebraria a API upstream.
- *Upload direto do cliente para uma URL pré-assinada do MinIO*: mais performático, mas adiciona complexidade (presign + CORS) desnecessária para uma única imagem por mensagem.

### 4. Nome do arquivo: `{id}-{rand4}.{ext}`

**Decisão**: Gerar nome de arquivo como `<id-do-path-param>-<4-letras-aleatórias>.<extensão>`. As 4 letras são geradas server-side usando o alfabeto `[a-z]{4}` (ex.: `1500-letr.png`).

**Rationale**:
- `<id>` vincula a imagem à mensagem (auditável, fácil de localizar).
- Sufixo aleatório curto minimiza colisões sem adicionar complexidade.
- Mantém a extensão original para o navegador servir com `Content-Type` correto ao consultar o MinIO.

**Alternativas**:
- *UUID completo*: descartado — mais bytes e mais verbosidade do que `abc4` permite.
- *Hash do conteúdo*: descartado — exigiria ler todo o buffer; sem benefício claro aqui.
- *Timestamp*: descartado — ainda permite colisões entre uploads quase simultâneos.

### 5. URL pública retornada

**Decisão**: A rota de upload retorna a URL completa no formato `http(s)://<endpoint>:<port>/<bucket>/<arquivo>` construída a partir das envs. Assume-se que o bucket tem política de leitura pública (ou que o servidor Next.js serve como proxy — fora do escopo desta change).

**Rationale**: Simples e suficiente para o requisito. A escolha entre `useSSL` deriva da env `MINIO_USE_SSL`.

### 6. Campo `imageUrl` opcional em `MensagemExterna` e no PATCH

**Decisão**:
- `src/lib/api/mensagem-externa.ts` ganha `imageUrl?: string` no tipo `MensagemExterna`.
- `updateMensagemExterna` aceita `imageUrl?: string` (opcional).
- O handler PATCH aceita `body.imageUrl` opcional e o repassa.

**Rationale**: O requisito explicita que imagem **não é obrigatória** para o usuário. O tipo `[k: string]: undefined` (campo ausente) é o sinal de "sem alteração" — manter o shape consistente com a API upstream.

### 7. Upload sem alterar o .env (somente .env.example)

**Decisão**: Documentar todas as variáveis no `.env.example`. O usuário configurará `.env.local` (ou produção) manualmente — o repositório não deve ter credenciais versionadas.

### 8. Dependência: `minio` + `@types/minio`

**Decisão**: Instalar `minio` como runtime dependency e `@types/minio` como devDependency, conforme instrução do usuário. Não usar SDKs S3 genéricos (a sugestão oficial é a lib `minio`).

## Risks / Trade-offs

- **[Risco] Bucket inacessível/credenciais erradas em produção** → Mitigação: Validar todas as 6 envs no `getMinioClient()` e devolver erro 500 com mensagem clara ("MinIO env not configured") na rota de upload — espelhando o padrão atual do handler PATCH para `LEONARDO_API_URL`.
- **[Risco] Upload de arquivos arbitrários grandes** → Mitigação: Limitar tamanho no servidor (Next.js permite configurar `bodyParser`/limits). Sugere-se validar o tamanho do `File` recebido no `request.formData()` (ex.: máximo 5 MB) — sem essa validação, ataques de exaustão de memória são viáveis.
- **[Risco] Tipo de arquivo arbitrário** → Mitigação: Validar que o `File.type` comece com `image/` antes de fazer upload (rejeitar outros MIME types com 400).
- **[Risco] Bucket não público** → Mitigação: Documentar no `.env.example` que o bucket deve permitir leitura pública para que a URL retornada seja exibível. Em uma fase posterior, podemos trocar por proxy do Next.js ou presigned URLs.
- **[Risco] Substituição de imagem deixa arquivo órfão no MinIO** → Aceito como trade-off (fora do escopo — pode entrar em uma change de "limpeza de imagens órfãs"). Documentado nos Non-Goals.
- **[Risco] Cold-start lento do MinIO** → Aceito: single-tenant, baixo tráfego esperado no dashboard.
- **[Risco] Aleatoriedade de 4 letras colide** → Mitigação: Probabilidade ≈ 26⁴ ≈ 450k combinações é baixa; em caso de colisão o upload do MinIO substituiria o objeto (sem corromper estado, só visual). Aceito.

## Migration Plan

1. Adicionar dependências: `npm install minio` e `npm install --save-dev @types/minio`.
2. Adicionar entradas em `.env.example`.
3. Criar `src/lib/minio.ts` com o cliente e helper de validação.
4. Criar rota `src/app/api/mensagem-externa/[id]/upload/route.ts`.
5. Atualizar `src/lib/api/mensagem-externa.ts` para incluir `imageUrl` opcional no tipo e em `updateMensagemExterna`.
6. Atualizar o handler PATCH em `src/app/api/mensagem-externa/[id]/route.ts` para aceitar `imageUrl` opcional.
7. Atualizar `src/app/dashboard/mensagens/[id]/mensagem-form.tsx`: novo input `<input type="file" accept="image/*">`, estado local para preview/URL, fluxo no `handleSave` que sobe a imagem primeiro (se houver) e depois envia o PATCH.
8. Validar manualmente com um MinIO local (`docker run -p 9000:9000 -p 9001:9001 ...`) e uma imagem real.

**Rollback**: Reverter as alterações no `src/lib`, nas duas rotas e no formulário. Remover as dependências do `package.json`. As variáveis de `.env.example` podem ficar (não causam efeito).

## Open Questions

- **Q1**: Devemos impor limite de tamanho do arquivo (ex.: 5 MB) na rota de upload? *Recomendação: sim, 5 MB é suficiente para imagens promocionais.*
- **Q2**: O bucket precisa ser criado automaticamente se não existir no startup, ou exige setup manual? *Recomendação: setup manual (operacional), para não acoplar o app ao MinIO na inicialização.*
- **Q3**: Caso o upload da imagem falhe, devemos bloquear o PATCH ou salvar o PATCH sem `imageUrl`? *Recomendação: bloquear (400 explícito no PATCH) para evitar perda silenciosa da imagem selecionada.*
