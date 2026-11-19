# 🍽️ SGK — Sistema Gerenciador Culinário Kennedy

Sistema de gestão da cozinha escolar: receitas passo a passo, cardápio semanal,
controle de estoque com quantidade e preço, higiene, avisos, aprovação de
receitas, relatório de desperdício e histórico de alterações.

[**👉 ABRIR O SITE SGK 👈**](https://sgk-kennedy.onrender.com)

[![Deploy no Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/eduardoosganascimento-beep/Sistema-Aliment-cio-Kennedy)

---

## 📑 Índice

- [Perfis de acesso](#-perfis-de-acesso)
- [Funcionalidades](#-funcionalidades)
- [Histórico de alterações](#-histórico-de-alterações)
- [Acesso de teste](#-acesso-de-teste)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Rodar localmente](#-rodar-localmente)
- [Publicação](#-publicação)

---

## 👥 Perfis de acesso

| Perfil | Responsabilidades |
| --- | --- |
| 👩‍🍳 **Cozinheira (tia)** | Monta o cardápio, faz o checklist diário de higiene, cadastra alimentos e envia receitas para aprovação |
| 📚 **Pedagoga** | Consulta receitas/cardápio/higiene, cadastra alimentos e acompanha os comprovantes da cozinha |
| 🎓 **Diretora Pedagoga** | Publica avisos, aprova receitas, acompanha o relatório de desperdício e vê os comprovantes |

> ⚠️ Os dados ficam no `localStorage` do navegador. Não há servidor nem banco de
> dados: o comprovante de higiene e o histórico aparecem no **mesmo
> navegador/dispositivo** usado pela tia.

---

## ✨ Funcionalidades

### Receitas
- 📖 Mais de 1.000 receitas escolares para ~10 porções, em categorias com ícones e ordem fixa
- 🥚🐟 Categorias próprias de **ovos** e **peixes** (6 receitas cada), com vídeos de segurança e dicas de higiene
- ⏱️ Cartões mostram apenas o tempo de preparo, com texto explicativo centralizado
- 🎥 Vídeos do YouTube dentro de cada receita (a seção separada saiu do menu)
- 🔍 Busca por nome, descrição e ingredientes; filtros por categoria
- ➕ Receitas cadastradas ficam salvas e **só são removidas se a pessoa excluir**

### Cardápio e cozinha
- 📅 Cardápio semanal montado pelas **tias** (adicionar, editar e remover dias)
- 🧼 Checklist diário de higiene: ao concluir as 8 rotinas, gera comprovante com nome, data e hora para pedagogas e diretoras
- 📦 Estoque com quantidade, preço unitário, validade e quantidade mínima
- 🚫 Itens com validade vencida entram **automaticamente** no relatório como desperdício (quantidade × preço, sem duplicatas)
- ⚠️ Alertas de estoque baixo e alimentos vencidos

### Gestão
- 🔔 Avisos da direção para a equipe
- ✅ Aprovação de receitas enviadas pelas cozinheiras
- 📊 Relatório mensal de desperdício com gráficos, prejuízo estimado, sugestões e exportação CSV
- 🎨 Tema preto e azul (Obsidian Blue), com opção de tema claro
- 📱 Navegação inferior no celular e interface responsiva

---

## 📝 Histórico de alterações

Toda alteração registra **quem fez, o que foi feito e quando**:

- Cadastro/edição/remoção de receitas, alimentos e dias do cardápio
- Aprovação e rejeição de receitas
- Ajuste de quantidade no estoque e remoção de itens
- Conclusão do checklist de higiene
- Publicação/remoção de avisos e registro/remoção de desperdício

O painel **"Atividade recente"** aparece na tela inicial e o botão
**"Ver histórico completo"** abre a lista completa. Nada é apagado
automaticamente: apenas a exclusão explícita remove um item cadastrado.

---

## 🔐 Acesso de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| 👩‍🍳 Cozinheira | `cozinheira@kennedy.escola.br` | `kennedy123` |
| 📚 Pedagoga | `pedagoga@kennedy.escola.br` | `kennedy123` |
| 🎓 Diretora Pedagoga | `diretora@kennedy.escola.br` | `kennedy123` |

Também é possível criar novas contas na aba **Criar conta** da tela de login.

---

## 📁 Estrutura do projeto

```
Sistema-Aliment-cio-Kennedy/
├── sgk-kennedy/
│   ├── index.html                  # Estrutura e seções do sistema
│   ├── 404.html                    # Página de erro personalizada
│   ├── favicon.svg                 # Ícone da aba
│   ├── robots.txt / sitemap.xml    # Regras e mapa para buscadores
│   ├── css/styles.css              # Tema, componentes e responsividade
│   └── js/
│       ├── data.js                 # Dados iniciais (cardápio, receitas base etc.)
│       ├── receitas-extras.js      # Catálogo ampliado (1.000+ receitas)
│       ├── receitas-ovos-peixes.js # Receitas de ovos e peixes
│       ├── videos-data.js          # Vídeos usados dentro das receitas
│       └── app.js                  # Lógica, perfis, sessão e interações
├── render.yaml                     # Blueprint de deploy no Render
├── .gitignore
└── README.md
```

---

## 💻 Rodar localmente

Abra `sgk-kennedy/index.html` no navegador ou use um servidor estático:

```bash
cd sgk-kennedy
python -m http.server 8000
# acesse http://localhost:8000
```

---

## 🌐 Publicação

O site está no **Render** como site estático gratuito:
https://sgk-kennedy.onrender.com

O arquivo `render.yaml` permite recriar o serviço pelo botão **Deploy no Render**.
O serviço está configurado com Auto-Deploy "On Commit", mas historicamente os
deploys foram feitos de forma manual pelo painel do Render
(`Manual Deploy → Deploy latest commit`). Se uma alteração não aparecer no ar,
verifique o último deploy no painel e dispare um novo.
