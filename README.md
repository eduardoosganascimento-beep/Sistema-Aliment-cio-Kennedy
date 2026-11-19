# 🍽️ Sistema-Aliment-cio-Kennedy

## 🚀 Acessar o sistema (clique para abrir)

# [👉 ABRIR O SITE SGK 👈](https://sgk-kennedy.onrender.com)

> **SGK — Sistema Gerenciador Culinário Kennedy**
> Sistema de gestão da cozinha escolar: receitas passo a passo, cardápio semanal,
> controle de estoque com quantidade e preço, higiene, avisos, aprovação de
> receitas e relatório mensal de desperdício.

[![Deploy no Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/eduardoosganascimento-beep/Sistema-Aliment-cio-Kennedy)

---

## 🆕 Novidades da versão atual

- 🎨 **Visual preto e azul** (tema “Obsidian Blue”): cartões refinados, brilhos suaves e tipografia mais marcante, com tema claro opcional
- 📱 **Navegação inferior no celular** com acesso rápido a Início, Cardápio, Receitas e Estoque
- 🔐 **Login com escolha de perfil** em cartões (Cozinheira, Pedagoga ou Diretora)
- 🔑 **Sessão mantida ao recarregar** a página (não pede login de novo)
- 👁️ **Mostrar/ocultar senha** e botões para preencher as contas de demonstração
- 🧹 **Contas de teste limpas automaticamente**: contas criadas em sessões anteriores são removidas, mantendo apenas as oficiais
- 🍽️ **Mais de 1.000 receitas escolares** em 10 porções, organizadas por categoria (incluindo nuggets, carne moída, frango, carnes, bolos salgados, sobremesas e salgados)
- 🥚🐟 **Receitas de ovos e peixes**: 6 receitas de ovos e 6 de peixes em categorias próprias, com filtros dedicados, vídeos de segurança e dicas de higiene
- 📚 **Catálogo mais organizado**: categorias em ordem fixa com ícones e receitas em ordem alfabética dentro de cada grupo
- ⏱️ **Receitas mais enxutas**: mostram só o tempo de preparo (não exibem mais "serve quantas pessoas") e têm o texto explicativo centralizado
- 🎥 **Vídeos dentro de cada receita**: a seção separada "Vídeos que ensinam" saiu do menu — os links ficam no modal de cada receita
- 📅 **Cardápio montado pelas tias**: elas adicionam, editam e removem os dias da semana
- ✅ **Comprovante do checklist**: ao concluir o checklist diário de higiene, a tia gera um registro com nome, data e hora que aparece para pedagogas e diretoras

---

## ✨ Funcionalidades

### Para a cozinheira
- 📖 **Mais de 1.000 receitas passo a passo** (10 porções): nuggets, carne moída, frango, carnes, **ovos, peixes**, massas, sopas, saladas, sucos, bolos salgados, bolos e salgados em geral
- 🎥 **Vídeos que ensinam dentro das receitas**: links do YouTube no modal de cada receita (não há mais menu separado de vídeos)
- 🍽️ **Porcionamento simples** e organização das receitas por categoria
- 📅 **Cardápio semanal** completo (café, almoço, lanche e sobremesa) — **montado pelas tias**, que adicionam, editam e removem os dias
- ✅ **Checklist diário de higiene**: ao concluir todas as 8 rotinas, o sistema registra automaticamente quem concluiu, a data e a hora
- 📦 **Cadastro de alimentos**: quantidade, preço unitário, validade e quantidade mínima (Cozinheira, Pedagoga e Diretora)
- 🗑️ **Remoção de qualquer item cadastrado** (alimentos, receitas, avisos e registros)
- ⚠️ **Alertas** de estoque baixo e alimentos vencidos
- 🧼 **Higiene e boas práticas** com checklist diário
- 📂 **Organização por categoria** (Grãos, Mercearia, Hortifruti, Proteínas, etc.)
- 🔍 **Busca em todo o sistema** e buscas por seção
- ⚫🔵 **Visual preto e azul**, com opção de tema claro

### Para a pedagoga
- 📦 **Cadastro de alimentos** com quantidade, preço, validade e quantidade mínima
- 📖 Consulta de receitas, cardápio e higiene
- ✅ **Acompanha o comprovante do checklist de higiene** feito pelas tias (nome, data e hora), na tela inicial e em Higiene

### Para a diretora pedagoga
- 🔔 **Avisos** para a equipe
- ✅ **Aprovação de receitas** enviadas pelas cozinheiras
- 📊 **Relatório mensal de desperdício** com gráficos, prejuízo estimado e sugestões
- 🧾 **Exportação CSV** do relatório
- 👥 Também pode **cadastrar alimentos** com quantidade e preço
- ✅ **Vê o comprovante do checklist de higiene** concluído pelas tias

No login, a pessoa escolhe seu perfil: **Cozinheira**, **Pedagoga** ou **Diretora Pedagoga**.
As **tias (cozinheiras)** montam o cardápio e fazem o checklist diário de higiene; pedagogas e diretoras acompanham os comprovantes.
Os dados são salvos no navegador (`localStorage`), então funcionam sem servidor ou banco de dados. Por isso o comprovante aparece no mesmo navegador/dispositivo usado pela tia.

## 🔐 Acesso de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| 👩‍🍳 Cozinheira | `cozinheira@kennedy.escola.br` | `kennedy123` |
| 📚 Pedagoga | `pedagoga@kennedy.escola.br` | `kennedy123` |
| 🎓 Diretora Pedagoga | `diretora@kennedy.escola.br` | `kennedy123` |

> Contas criadas em sessões anteriores são removidas automaticamente ao abrir o
> sistema atualizado. Use uma das contas oficiais acima para entrar.

Também é possível criar novas contas na aba **Criar conta** da tela de login.

## 📁 Estrutura

```
Sistema-Aliment-cio-Kennedy/
├── sgk-kennedy/
│   ├── index.html          # Estrutura do sistema
│   ├── 404.html            # Página de erro personalizada
│   ├── favicon.svg         # Ícone da aba do navegador
│   ├── robots.txt          # Regras para robôs de busca
│   ├── sitemap.xml         # Mapa do site
│   ├── css/styles.css      # Tema preto e azul + responsivo
│   └── js/
│       ├── data.js            # Dados iniciais (cardápio, receitas base, estoque, etc.)
│       ├── receitas-extras.js # Catálogo ampliado com mais de 1.000 receitas escolares
│       ├── receitas-ovos-peixes.js # Receitas de ovos e peixes (categorias próprias)
│       ├── videos-data.js     # Catálogo de vídeos do YouTube por tema
│       └── app.js          # Lógica, contas, sessão e interações
├── render.yaml             # Blueprint de deploy no Render
├── .gitignore
└── README.md
```

## 💻 Rodar localmente

Abra `sgk-kennedy/index.html` no navegador ou use um servidor estático:

```bash
cd sgk-kennedy
python -m http.server 8000
# acesse http://localhost:8000
```

## 🌐 Publicação

O site está publicado no **Render** como site estático gratuito. O arquivo
`render.yaml` permite recriar o serviço em um clique pelo botão **Deploy no Render**
acima. Alterações na branch `main` são publicadas automaticamente.
