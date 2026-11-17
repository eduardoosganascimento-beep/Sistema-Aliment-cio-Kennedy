# 🍽️ Sistema-Aliment-cio-Kennedy

## 🚀 Acessar o sistema (clique para abrir)

# [👉 ABRIR O SITE SGK 👈](https://sgk-kennedy.onrender.com)

> **SGK — Sistema Gerenciador Culinário Kennedy**
> Sistema de gestão da cozinha escolar: receitas passo a passo, cardápio semanal,
> controle de estoque com quantidade e preço, higiene, avisos, aprovação de
> receitas e relatório mensal de desperdício.

[![Deploy no Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/eduardoosganascimento-beep/Sistema-Aliment-cio-Kennedy)

---

## ✨ Funcionalidades

### Para as tias da cozinha
- 📖 **Receitas passo a passo** com ingredientes, modo de preparo e dicas de produtividade
- 📅 **Cardápio semanal** completo (café, almoço, lanche e sobremesa)
- 📦 **Cadastro de alimentos**: quantidade, preço unitário, validade e quantidade mínima (tias e direção podem cadastrar)
- ⚠️ **Alertas** de estoque baixo e alimentos vencidos
- 🧼 **Higiene e boas práticas** com checklist diário
- 🌙 **Modo escuro** (padrão) com opção de tema claro

### Para a diretora pedagoga
- 🔔 **Avisos** para a equipe
- ✅ **Aprovação de receitas** enviadas pelas tias
- 📊 **Relatório mensal de desperdício** com gráficos, prejuízo estimado e sugestões
- 🧾 **Exportação CSV** do relatório
- 👥 Também pode **cadastrar alimentos** com quantidade e preço

O perfil é alternado no canto superior direito (`Tia da Cozinha` / `Diretora Pedagoga`).
Os dados são salvos no navegador (`localStorage`), então funcionam sem servidor ou banco de dados.

## 📁 Estrutura

```
Sistema-Aliment-cio-Kennedy/
├── sgk-kennedy/
│   ├── index.html          # Estrutura do sistema
│   ├── css/styles.css      # Visual dark mode + responsivo
│   └── js/
│       ├── data.js         # Dados iniciais (cardápio, receitas, estoque, etc.)
│       └── app.js          # Lógica e interações
├── render.yaml             # Blueprint de deploy no Render
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
