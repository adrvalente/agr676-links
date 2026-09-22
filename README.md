# ⚜ Agrupamento 676 Links — V1.3.0

Página de links e CMS do Agrupamento 676 Cristo-Rei.

## V1.3.0 — autenticação segura

A V1.3 remove o Fine-grained PAT do frontend. O painel `/admin/` autentica agora através do Cloudflare Worker:

- API: `676-cms-api.adrvalente.workers.dev`
- Sessões armazenadas em Cloudflare KV (`SESSIONS`)
- Cookie de sessão `HttpOnly`, `Secure` e `SameSite=None`
- Password validada no backend com PBKDF2 SHA-256
- CORS limitado a `https://adrvalente.github.io`
- O JavaScript do CMS já não contém nem armazena credenciais GitHub

### Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`

## Estado da publicação

O botão **🚀 Publicar** fica intencionalmente desativado nesta entrega. O próximo passo da V1.3 é criar uma GitHub App, guardar as respetivas credenciais como Secrets no Worker e implementar `POST /api/publish`.

Até essa etapa, Importar/Exportar JSON continua disponível.

## Estrutura

```text
/
├── index.html
├── style.css
├── app.js
├── data/links.json
├── assets/logo-676.svg
└── admin/
    ├── index.html
    ├── admin.css
    └── admin.js
```

## Segurança

Nunca coloques passwords, PATs, chaves privadas ou outros segredos no repositório. Os segredos do CMS pertencem ao Cloudflare Worker.
