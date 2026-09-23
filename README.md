# ⚜ Agrupamento 676 Links — V1.3.1

Página de links e CMS do Agrupamento 676 Cristo-Rei.

## V1.3.1 — autenticação segura

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


## V1.3.1
- Publicação segura do `data/links.json` através de `POST /api/publish`.
- GitHub App e credenciais permanecem exclusivamente no Cloudflare Worker.
- Feedback visual durante publicação e tratamento de sessão expirada/erros.


## V1.4.9 — Multiuser CMS
- Perfis Administrador e Editor.
- Gestão de utilizadores pelo administrador.
- Estado Publicado / Alterações por publicar.
- Gestão das informações gerais do site.
- Histórico de publicações e reposição.
- Interface mobile melhorada.
- Editores podem preparar conteúdo; apenas administradores publicam/restauram/gerem utilizadores.


## V1.4.9.1 — Conteúdo e Identidade
- Página Site expandida para editar cabeçalho, lema e rodapé.
- Alteração de logótipo pelo CMS com pré-visualização.
- Suporte SVG, PNG e WebP até 2 MB.
- O ficheiro do logótipo é publicado como asset real no GitHub; não é guardado em Base64 no JSON.
- O site público lê `site.logoPath`, `footerTitle`, `footerMotto` e `adminLabel`.


## V1.4.9.3 — User Management UI
- Novo layout responsivo para utilizadores.
- Nome e @username separados visualmente.
- Badge de perfil e estado ativo/desativado.
- Ações de redefinir password e ativar/desativar editores.
- Melhorias mobile.
