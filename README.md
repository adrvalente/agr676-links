# ⚜️ Agrupamento 676 Links

Página oficial de links rápidos do **Agrupamento 676 Cristo-Rei — Corpo Nacional de Escutas**, desenvolvida como alternativa própria a serviços como Linktree.

O projeto disponibiliza num único endereço os principais recursos digitais do Agrupamento, com uma interface simples, responsiva e adaptada a dispositivos móveis.

## 🌲 Sobre o projeto

O **676 Links** foi criado para centralizar os principais acessos do Agrupamento 676, facilitando a consulta através das redes sociais, QR Codes, materiais de divulgação e outros meios digitais.

A página pode disponibilizar ligações para:

* ⚜️ Inscrições — Quero ser Escuteiro
* 🌐 Website oficial
* 📅 Próximas atividades
* 📸 Instagram
* 🔵 Facebook
* 📍 Localização
* ✉️ Contactos
* 🔗 Outros recursos do Agrupamento

## 🛠️ CMS próprio

O projeto inclui um pequeno sistema de gestão acessível através de:

`/admin/`

O CMS permite gerir os botões apresentados na página sem necessidade de alterar diretamente o HTML.

### Funcionalidades

* ➕ Adicionar novos links
* ✏️ Editar links existentes
* 🗑️ Eliminar links
* 👁️ Publicar ou ocultar botões
* ⭐ Destacar links importantes
* ↕️ Reordenar os botões
* 🖱️ Reordenação através de Drag & Drop
* 📱 Pré-visualização em tempo real
* 📥 Importar configuração JSON
* 📤 Exportar configuração JSON
* 💾 Gravação local das alterações
* 🚀 Publicação direta no GitHub

## 📂 Estrutura

```text
agr676-links/
│
├── index.html
├── style.css
├── app.js
├── .gitignore
├── README.md
│
├── admin/
│   ├── index.html
│   ├── admin.css
│   └── admin.js
│
├── assets/
│   └── logo-676.svg
│
└── data/
    └── links.json
```

## 📄 Configuração dos links

Os conteúdos apresentados na página são armazenados em:

`data/links.json`

Exemplo:

```json
{
  "id": "instagram",
  "icon": "📸",
  "title": "Instagram",
  "subtitle": "Acompanha as nossas aventuras",
  "url": "#",
  "enabled": true,
  "featured": false
}
```

Isto permite separar o conteúdo da estrutura HTML da página.

## 🚀 Publicação

O projeto foi desenvolvido para ser alojado através do **GitHub Pages**.

A branch de produção é:

`main`

e o conteúdo do site encontra-se na raiz do repositório.

## ⚙️ Publicação através do CMS

A partir da **V1.2**, o painel de administração permite publicar alterações diretamente no repositório.

Fluxo:

```text
CMS
 ↓
Editar links
 ↓
Pré-visualizar
 ↓
🚀 Publicar
 ↓
GitHub API
 ↓
data/links.json
 ↓
Commit automático
 ↓
GitHub Pages
 ↓
Site atualizado
```

Para segurança, nenhuma credencial deve ser incluída nos ficheiros do projeto ou enviada para o repositório.

## 🔐 Segurança

O projeto foi desenvolvido tendo em conta algumas regras básicas de segurança:

* Nenhum token GitHub é armazenado no código-fonte.
* O token utilizado pelo CMS fica apenas na sessão do navegador.
* Recomenda-se um Fine-grained Personal Access Token.
* O token deve estar limitado exclusivamente a este repositório.
* Deve ser atribuída apenas a permissão necessária de leitura/escrita de conteúdos.
* Ficheiros de credenciais e configurações locais são excluídos através do `.gitignore`.

## 🗂️ Backups

Os backups locais podem ser armazenados em:

`_backup_/`

Esta pasta está excluída do controlo de versões através do `.gitignore`.

## 🧰 Tecnologias

O projeto utiliza apenas tecnologias web leves:

* HTML5
* CSS3
* JavaScript
* JSON
* Git
* GitHub
* GitHub Pages
* GitHub REST API

Não necessita de PHP, MySQL ou outro servidor de aplicação para o funcionamento da página pública.

## 📱 Design

A interface foi desenvolvida segundo uma abordagem **mobile-first**, uma vez que a maioria dos acessos deverá acontecer através de:

* Instagram
* Facebook
* QR Codes
* Sma

