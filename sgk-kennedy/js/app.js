/* ============================================================
   SGK — Sistema Gerenciador Kennedy
   Lógica da aplicação
   ============================================================ */

const SGK_RECEITAS_VERSAO = "5";

const App = {
  state: {},
  role: "tia",
  usuario: null,
  contas: [],
  secao: "inicio",
  diaCardapio: 0,
  filtroCategoria: "Todas",
  filtroCategoriaEstoque: "Todas",
  filtroVideo: "Todas",
  dicaIndex: 0,
  checklist: [],
  buscaAberta: false,

  /* ---------- Utilitários ---------- */
  esc(txt) {
    return String(txt ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  },

  carregar() {
    const chaves = ["cardapio", "receitas", "estoque", "higiene", "avisos", "desperdicio"];
    chaves.forEach((chave) => {
      try {
        const salvo = localStorage.getItem("sgk2_" + chave);
        this.state[chave] = salvo
          ? JSON.parse(salvo)
          : JSON.parse(JSON.stringify(SGK_DATA[chave] || []));
      } catch (e) {
        this.state[chave] = JSON.parse(JSON.stringify(SGK_DATA[chave] || []));
      }
    });

    // Atualiza as receitas-modelo quando o conteúdo didático muda de versão
    if (localStorage.getItem("sgk2_receitas_versao") !== SGK_RECEITAS_VERSAO) {
      this.state.receitas = JSON.parse(JSON.stringify(SGK_DATA.receitas || []));
      localStorage.setItem("sgk2_receitas", JSON.stringify(this.state.receitas));
      localStorage.setItem("sgk2_receitas_versao", SGK_RECEITAS_VERSAO);
    }

    // Catálogo de vídeos (conteúdo fixo, sempre atualizado pelo arquivo)
    this.state.videos = typeof SGK_VIDEOS !== "undefined" ? SGK_VIDEOS : [];

    this.role = localStorage.getItem("sgk2_role") || "tia";
    this.checklist = JSON.parse(localStorage.getItem("sgk2_checklist") || "[]");
    this.carregarContas();
  },

  carregarContas() {
    const senhaPadrao = this.hashSenha("kennedy123");
    const padrao = [
      { email: "cozinheira@kennedy.escola.br", senha: senhaPadrao, nome: "Cozinheira", perfil: "tia" },
      { email: "diretora@kennedy.escola.br", senha: senhaPadrao, nome: "Diretora Pedagoga", perfil: "diretora" },
    ];
    try {
      const salvo = JSON.parse(localStorage.getItem("sgk2_contas"));
      this.contas = Array.isArray(salvo) && salvo.length ? salvo : padrao;
    } catch (e) {
      this.contas = padrao;
    }
    // Migra contas antigas que guardavam a senha sem hash
    this.contas.forEach((c) => {
      if (!String(c.senha).startsWith("h")) c.senha = this.hashSenha(c.senha);
    });
    this.salvarContas();
  },

  salvarContas() {
    localStorage.setItem("sgk2_contas", JSON.stringify(this.contas));
  },

  hashSenha(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return "h" + Math.abs(h).toString(36);
  },

  verificarSessao() {
    const email = localStorage.getItem("sgk2_sessao");
    const conta = this.contas.find((c) => c.email === email);
    if (conta) {
      this.usuario = conta;
      this.role = conta.perfil;
      return true;
    }
    return false;
  },

  entrar(conta) {
    this.usuario = conta;
    this.role = conta.perfil;
    localStorage.setItem("sgk2_sessao", conta.email);
    localStorage.setItem("sgk2_role", conta.perfil);
    document.getElementById("loginScreen").classList.add("oculto");
    this.aplicarRole();
    this.irPara("inicio");
    this.toast(`Olá, ${conta.nome}! Bem-vinda ao SGK.`);
  },

  sair() {
    localStorage.removeItem("sgk2_sessao");
    this.usuario = null;
    document.getElementById("loginScreen").classList.remove("oculto");
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginSenha").value = "";
    document.getElementById("loginErro").textContent = "";
  },

  initLogin() {
    const tabs = document.querySelectorAll(".login-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        const criar = tab.dataset.aba === "criar";
        document.getElementById("formLogin").classList.toggle("oculto", criar);
        document.getElementById("formCriar").classList.toggle("oculto", !criar);
        document.getElementById("loginErro").textContent = "";
        document.getElementById("criarErro").textContent = "";
      });
    });

    document.getElementById("formLogin").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const senha = document.getElementById("loginSenha").value;
      const conta = this.contas.find((c) => c.email === email && c.senha === this.hashSenha(senha));
      const erro = document.getElementById("loginErro");
      if (!conta) {
        erro.textContent = "E-mail ou senha incorretos. Tente novamente.";
        return;
      }
      erro.textContent = "";
      this.entrar(conta);
    });

    document.getElementById("formCriar").addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = document.getElementById("criarNome").value.trim();
      const email = document.getElementById("criarEmail").value.trim().toLowerCase();
      const senha = document.getElementById("criarSenha").value;
      const perfil = document.getElementById("criarPerfil").value;
      const erro = document.getElementById("criarErro");
      if (!nome || !email.includes("@") || senha.length < 4) {
        erro.textContent = "Preencha nome, e-mail válido e senha com pelo menos 4 caracteres.";
        return;
      }
      if (this.contas.some((c) => c.email === email)) {
        erro.textContent = "Já existe uma conta com esse e-mail.";
        return;
      }
      const conta = { nome, email, senha: this.hashSenha(senha), perfil };
      this.contas.push(conta);
      this.salvarContas();
      erro.textContent = "";
      this.entrar(conta);
    });
  },

  salvar(chave) {
    localStorage.setItem("sgk2_" + chave, JSON.stringify(this.state[chave]));
  },

  hojeISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  },

  fmtData(iso) {
    if (!iso) return "—";
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("pt-BR");
  },

  fmtMoeda(v) {
    return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },

  uid() {
    return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  destacar(txt, termo) {
    const seguro = this.esc(txt);
    if (!termo) return seguro;
    const escTermo = this.esc(termo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return seguro.replace(new RegExp(escTermo, "gi"), (m) => `<mark class="marcador">${m}</mark>`);
    } catch (e) {
      return seguro;
    }
  },

  toast(msg, tipo = "sucesso") {
    const c = document.getElementById("toastContainer");
    const el = document.createElement("div");
    const ico = tipo === "erro" ? "⚠️" : tipo === "info" ? "ℹ️" : "✅";
    el.className = "toast " + (tipo === "sucesso" ? "" : tipo);
    el.innerHTML = `<span>${ico}</span><span>${this.esc(msg)}</span>`;
    c.appendChild(el);
    setTimeout(() => {
      el.classList.add("saindo");
      setTimeout(() => el.remove(), 300);
    }, 3200);
  },

  /* ---------- Modal ---------- */
  abrirModal(titulo, corpo, rodape = "") {
    document.getElementById("modalTitle").textContent = titulo;
    document.getElementById("modalBody").innerHTML = corpo;
    document.getElementById("modalFoot").innerHTML =
      rodape || `<button class="btn btn-outline" data-fechar-modal>Fechar</button>`;
    document.getElementById("modalOverlay").classList.add("aberto");
    document.body.style.overflow = "hidden";
  },

  fecharModal() {
    document.getElementById("modalOverlay").classList.remove("aberto");
    document.body.style.overflow = "";
    this.buscaAberta = false;
  },

  /* ---------- Navegação ---------- */
  irPara(secao) {
    const diretoraSecoes = ["aprovacoes", "relatorio"];
    if (this.role !== "diretora" && diretoraSecoes.includes(secao)) {
      this.toast("Essa área é exclusiva da direção pedagógica.", "info");
      return;
    }

    this.secao = secao;
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    const sec = document.getElementById("section-" + secao);
    if (sec) sec.classList.add("active");

    document.querySelectorAll(".nav-item").forEach((n) =>
      n.classList.toggle("active", n.dataset.section === secao)
    );

    const titulos = {
      inicio: "Início", cardapio: "Cardápio Semanal", receitas: "Receitas",
      videos: "Vídeos", estoque: "Estoque", higiene: "Higiene e Boas Práticas",
      avisos: "Avisos", aprovacoes: "Aprovação de Receitas", relatorio: "Relatório de Desperdício",
    };
    document.getElementById("topbarTitle").textContent = titulos[secao] || "SGK";
    document.getElementById("topbarSub").textContent = "SGK / " + (titulos[secao] || "");

    this.renderizar();
    document.getElementById("sidebar").classList.remove("aberto");
    document.getElementById("sidebarOverlay").classList.remove("mostrar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  aplicarRole() {
    const e = document.getElementById("roleSelect");
    if (e) {
      e.value = this.role;
      e.disabled = !!this.usuario && this.usuario.perfil !== "diretora";
      e.title = e.disabled ? "Seu perfil é fixo. Use outra conta para trocar." : "Alternar perfil de acesso";
    }
    const diretora = this.role === "diretora";
    document.querySelectorAll(".nav-diretora").forEach((n) => (n.style.display = diretora ? "" : "none"));
    const nome = this.usuario?.nome || (diretora ? "Diretora Pedagoga" : "Cozinheira");
    document.getElementById("userName").textContent = nome;
    document.getElementById("userRole").textContent = diretora ? "Coordenação" : "Cozinheira";
    document.getElementById("userAvatar").textContent = diretora ? "🎓" : "👩‍🍳";
    const btnNovoAviso = document.getElementById("btnNovoAviso");
    if (btnNovoAviso) btnNovoAviso.style.display = diretora ? "" : "none";
    localStorage.setItem("sgk2_role", this.role);
    if (!diretora && ["aprovacoes", "relatorio"].includes(this.secao)) this.irPara("inicio");
    else this.renderizar();
  },

  renderizar() {
    this.atualizarBadges();
    switch (this.secao) {
      case "inicio": this.renderInicio(); break;
      case "cardapio": this.renderCardapio(); break;
      case "receitas": this.renderReceitas(); break;
      case "videos": this.renderVideos(); break;
      case "estoque": this.renderEstoque(); break;
      case "higiene": this.renderHigiene(); break;
      case "avisos": this.renderAvisos(); break;
      case "aprovacoes": this.renderAprovacoes(); break;
      case "relatorio": this.renderRelatorio(); break;
    }
  },

  atualizarBadges() {
    const pendentes = this.state.receitas.filter((r) => r.status === "pendente").length;
    const naoLidos = this.state.avisos.filter((a) => !a.lido).length;
    const criticos = this.state.estoque.filter((i) => this.statusEstoque(i) !== "ok").length;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = v;
      el.classList.toggle("zero", !v);
    };
    set("badgeReceitas", this.state.receitas.filter((r) => r.status === "aprovada").length);
    set("badgeVideos", (this.state.videos || []).length);
    set("badgeEstoque", criticos);
    set("badgeAvisos", naoLidos);
    set("badgeAprovacoes", pendentes);
    document.getElementById("notifDot").classList.toggle("oculto", naoLidos === 0);
  },

  /* ---------- Início ---------- */
  renderInicio() {
    const stats = [
      { ico: "📖", cor: "bg-green", label: "Receitas aprovadas", val: this.state.receitas.filter(r => r.status === "aprovada").length, sub: "prontas para usar" },
      { ico: "📦", cor: "bg-blue", label: "Itens no estoque", val: this.state.estoque.length, sub: "cadastrados" },
      { ico: "⚠️", cor: "bg-orange", label: "Itens para repor", val: this.state.estoque.filter(i => this.statusEstoque(i) !== "ok").length, sub: " exigem atenção" },
      { ico: "💰", cor: "bg-red", label: "Desperdício no mês", val: this.fmtMoeda(this.valorDesperdicioMes()), sub: "prejuízo estimado" },
    ];
    document.getElementById("statsGrid").innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-icon ${s.cor}">${s.ico}</div>
        <div class="stat-info"><span>${s.label}</span><strong>${s.val}</strong><small>${s.sub}</small></div>
      </div>`).join("");

    const avisos = [...this.state.avisos].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 3);
    const icos = { aviso: "📢", sucesso: "✅", info: "ℹ️" };
    document.getElementById("homeAvisos").innerHTML = avisos.length
      ? avisos.map(a => `<div class="mini-item">
          <span class="mini-ico">${icos[a.tipo] || "📢"}</span>
          <div><strong>${this.esc(a.titulo)} ${!a.lido ? '<span class="tag-novo">NOVO</span>' : ""}</strong>
          <p>${this.esc(a.texto)}</p><small>${this.esc(a.autor)} · ${this.fmtData(a.data)}</small></div>
        </div>`).join("")
      : `<div class="empty-state" style="padding:20px">Nenhum aviso por enquanto.</div>`;

    const dicas = this.state.higiene.flatMap(h => h.itens.map(i => ({ titulo: h.titulo, texto: i })));
    const d = dicas[this.dicaIndex % dicas.length];
    document.getElementById("dicaDia").innerHTML =
      `<strong>${this.esc(d.titulo)}</strong><br>${this.esc(d.texto)}`;
  },

  /* ---------- Cardápio ---------- */
  renderCardapio() {
    const busca = (document.getElementById("buscaCardapio")?.value || "").toLowerCase().trim();
    let dias = this.state.cardapio;
    if (busca) {
      dias = dias.filter(d =>
        (d.dia + " " + d.cafe + " " + d.almoco + " " + d.lanche + " " + d.sobremesa)
          .toLowerCase().includes(busca)
      );
    }

    const tabs = document.getElementById("semanaTabs");
    tabs.innerHTML = dias.map((c) => {
      const i = this.state.cardapio.indexOf(c);
      return `<button class="dia-tab ${i === this.diaCardapio ? "active" : ""}" data-dia="${i}">
        <span>${c.emoji}</span> ${this.destacar(c.dia, busca)}
      </button>`;
    }).join("");

    const c = dias.find(d => this.state.cardapio.indexOf(d) === this.diaCardapio) || dias[0];
    if (!c) {
      document.getElementById("cardapioDetalhe").innerHTML = `<div class="empty-state"><span class="es-ico">🔍</span>
        <h3>Nenhum dia encontrado</h3><p>Tente outro termo na busca do cardápio.</p></div>`;
      document.getElementById("cardapioTabela").innerHTML =
        `<tr><td colspan="5" style="text-align:center;padding:24px">Nenhum resultado.</td></tr>`;
      return;
    }

    const ref = [
      { ico: "🌅", cor: "bg-orange", label: "Café da manhã", txt: c.cafe },
      { ico: "🍽️", cor: "bg-green", label: "Almoço", txt: c.almoco },
      { ico: "🥪", cor: "bg-blue", label: "Lanche da tarde", txt: c.lanche },
      { ico: "🍰", cor: "bg-purple", label: "Sobremesa", txt: c.sobremesa },
    ];
    document.getElementById("cardapioDetalhe").innerHTML = `
      <div class="cardapio-dia">
        <h3>${c.emoji} ${this.esc(c.dia)}</h3>
        <div class="refeicoes-grid">
          ${ref.map(r => `<div class="refeicao">
            <div class="re-ico ${r.cor}">${r.ico}</div>
            <div><span>${r.label}</span><strong>${this.destacar(r.txt, busca)}</strong></div>
          </div>`).join("")}
        </div>
      </div>`;

    document.getElementById("cardapioTabela").innerHTML = dias.map(dia => `
      <tr>
        <td class="nome-cell">${dia.emoji} ${this.destacar(dia.dia, busca)}</td>
        <td>${this.destacar(dia.cafe, busca)}</td><td>${this.destacar(dia.almoco, busca)}</td>
        <td>${this.destacar(dia.lanche, busca)}</td><td>${this.destacar(dia.sobremesa, busca)}</td>
      </tr>`).join("");
  },

  /* ---------- Receitas ---------- */
  renderReceitas() {
    const busca = (document.getElementById("buscaReceita")?.value || "").toLowerCase().trim();
    let lista = this.state.receitas.filter(r => r.status === "aprovada");
    if (this.filtroCategoria !== "Todas") lista = lista.filter(r => r.categoria === this.filtroCategoria);
    if (busca) lista = lista.filter(r =>
      (r.nome + " " + r.descricao + " " + r.ingredientes.map(i => i.item).join(" ")).toLowerCase().includes(busca)
    );

    const grid = document.getElementById("receitasGrid");
    if (!lista.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="es-ico">🔍</span><h3>Nenhuma receita encontrada</h3>
        <p>Tente outro termo ou categoria.</p></div>`;
      return;
    }
    grid.innerHTML = lista.map(r => `
      <article class="receita-card">
        <div class="rc-top">${r.emoji || "🍽️"}
          <span class="rc-cat">${this.esc(r.categoria)}</span>
        </div>
        <div class="rc-body">
          <h4>${this.esc(r.nome)}</h4>
          <p>${this.esc(r.descricao)}</p>
          <div class="rc-meta">
            <span>⏱️ ${this.esc(r.tempo)}</span>
            <span>👥 ${this.esc(r.rendimento)}</span>
          </div>
        </div>
        <div class="rc-foot">
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn btn-primary btn-sm" data-ver-receita="${r.id}">Ver receita →</button>
            <button class="icon-action" title="Remover receita" data-del-receita="${r.id}">🗑️</button>
          </div>
          <span class="rc-num">${r.passos.length} passos · ${r.ingredientes.length} ingredientes</span>
        </div>
      </article>`).join("");
  },

  /* ---------- Vídeos ---------- */
  videoPorId(id) {
    return (this.state.videos || []).find(v => v.id === id) || null;
  },

  videosDaReceita(r) {
    return (r.videos || []).map(id => this.videoPorId(id) || {
      id, titulo: "Vídeo da receita", canal: "YouTube", tipo: "Vídeo aula",
    });
  },

  videoCard(v) {
    const thumb = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
    return `<article class="video-card">
      <a class="video-thumb" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener" title="Assistir no YouTube">
        <img src="${thumb}" alt="Capa do vídeo: ${this.esc(v.titulo)}" loading="lazy" />
        <span class="video-play">▶</span>
        <span class="video-tipo">${this.esc(v.tipo)}</span>
      </a>
      <div class="video-body">
        <span class="video-cat">${this.esc(v.categoria)}</span>
        <h4>${this.esc(v.titulo)}</h4>
        <p>${this.esc(v.descricao || "")}</p>
        <div class="video-meta">
          <span>📺 ${this.esc(v.canal)}</span>
          ${v.duracao ? `<span>⏱️ ${this.esc(v.duracao)}</span>` : ""}
        </div>
      </div>
      <a class="video-link" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">Assistir no YouTube ↗</a>
    </article>`;
  },

  renderVideos() {
    const busca = (document.getElementById("buscaVideo")?.value || "").toLowerCase().trim();
    let lista = [...(this.state.videos || [])];
    if (this.filtroVideo !== "Todas") lista = lista.filter(v => v.categoria === this.filtroVideo);
    if (busca) {
      lista = lista.filter(v =>
        (v.titulo + " " + v.canal + " " + v.categoria + " " + (v.descricao || "") + " " + v.tipo).toLowerCase().includes(busca)
      );
    }

    const grid = document.getElementById("videosGrid");
    if (!grid) return;
    if (!lista.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <span class="es-ico">🎥</span><h3>Nenhum vídeo encontrado</h3>
        <p>Tente outro tema ou limpe a busca.</p></div>`;
      return;
    }

    const grupos = {};
    lista.forEach(v => {
      (grupos[v.categoria] = grupos[v.categoria] || []).push(v);
    });

    grid.innerHTML = Object.keys(grupos).map(cat => `
      <div class="videos-grupo">
        <div class="videos-grupo-head">
          <h3>${this.esc(cat)}</h3>
          <span>${grupos[cat].length} vídeo(s)</span>
        </div>
        <div class="videos-lista">
          ${grupos[cat].map(v => this.videoCard(v)).join("")}
        </div>
      </div>`).join("");
  },

  verReceita(id) {
    const r = this.state.receitas.find(x => x.id === id);
    if (!r) return;
    const videos = this.videosDaReceita(r);
    this.abrirModal(r.nome, `
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:6px">
        <div style="font-size:44px">${r.emoji || "🍽️"}</div>
        <div>
          <div class="rc-meta" style="margin-top:0">
            <span>⏱️ ${this.esc(r.tempo)}</span>
            <span>👥 ${this.esc(r.rendimento)}</span>
            <span>📊 ${this.esc(r.dificuldade || "—")}</span>
          </div>
          <p style="font-size:12.5px;color:var(--texto-fraco);margin-top:6px">${this.esc(r.descricao)}</p>
        </div>
      </div>
      ${r.porcao ? `<div class="porcao-box">
        <span class="pb-ico">🍽️</span>
        <div><strong>Porcionamento para ~1.000 alunos</strong><p>${this.esc(r.porcao)}</p></div>
      </div>` : ""}
      ${videos.length ? `<div class="modal-section-title">🎥 Vídeos para aprender</div>
      <div class="receita-videos">
        ${videos.map(v => `<a class="receita-video" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
          <span class="rv-play">▶</span>
          <span class="rv-info"><strong>${this.esc(v.titulo)}</strong><small>${this.esc(v.canal)} · ${this.esc(v.tipo)}</small></span>
          <span class="rv-go">↗</span>
        </a>`).join("")}
      </div>` : ""}
      <div class="modal-section-title">🛒 Ingredientes</div>
      <div class="modal-ingredientes">
        ${r.ingredientes.map(i => `<div class="ing-item"><span>${this.esc(i.item)}</span><strong>${this.esc(i.qtd)}</strong></div>`).join("")}
      </div>
      <div class="modal-section-title">👩‍🍳 Modo de preparo (passo a passo)</div>
      ${r.passos.map((p, i) => `<div class="passo"><div class="passo-num">${i + 1}</div><p>${this.esc(p)}</p></div>`).join("")}
      <div class="modal-section-title">⚡ Dicas de produtividade e cuidado</div>
      <div class="dica-lista">
        <h4>Como fazer melhor, mais rápido e com segurança</h4>
        <ul>${(r.dicas || []).map(d => `<li>${this.esc(d)}</li>`).join("")}</ul>
      </div>
      ${(r.higiene || []).length ? `<div class="modal-section-title">🧼 Higiene e segurança</div>
      <div class="dica-lista higiene-lista">
        <h4>O que não pode faltar neste preparo</h4>
        <ul>${r.higiene.map(h => `<li>${this.esc(h)}</li>`).join("")}</ul>
      </div>` : ""}
    `, `<button class="btn btn-outline" data-fechar-modal>Fechar</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir receita</button>`);
  },

  novaReceita() {
    const cats = ["Prato principal", "Acompanhamento", "Salada", "Sobremesa", "Bebida"];
    this.abrirModal("➕ Cadastrar nova receita", `
      <div class="form-row">
        <div class="form-group"><label>Nome da receita</label><input id="f_nome" placeholder="Ex.: Sopa de legumes" /></div>
        <div class="form-group"><label>Categoria</label><select id="f_cat">${cats.map(c => `<option>${c}</option>`).join("")}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Tempo de preparo</label><input id="f_tempo" placeholder="Ex.: 40 min" /></div>
        <div class="form-group"><label>Rendimento</label><input id="f_rend" placeholder="Ex.: 1.000 porções" /></div>
      </div>
      <div class="form-group"><label>Porcionamento por aluno</label><input id="f_porcao" placeholder="Ex.: 110 g de arroz cozido por aluno" /></div>
      <div class="form-group"><label>Descrição curta</label><textarea id="f_desc" style="min-height:60px" placeholder="Conte um pouco sobre a receita"></textarea></div>
      <div class="form-group"><label>Ingredientes (um por linha: nome | quantidade)</label>
        <textarea id="f_ing" placeholder="Arroz | 5 kg&#10;Água | 9 litros"></textarea>
      </div>
      <div class="form-group"><label>Modo de preparo (um passo por linha)</label>
        <textarea id="f_passos" placeholder="Lave os ingredientes...&#10;Cozinhe em fogo baixo..."></textarea>
      </div>
      <div class="form-group"><label>Dicas de produtividade (uma por linha)</label>
        <textarea id="f_dicas" style="min-height:70px" placeholder="Use água quente para ganhar tempo..."></textarea>
      </div>
      <div class="form-group"><label>Cuidados de higiene e segurança (uma por linha)</label>
        <textarea id="f_higiene" style="min-height:70px" placeholder="Lave as mãos antes de começar...&#10;Mantenha o alimento acima de 60 °C..."></textarea>
      </div>
      <div class="form-group"><label>Vídeo do YouTube que ensina (link opcional)</label>
        <input id="f_video" placeholder="https://www.youtube.com/watch?v=..." />
      </div>
      <p class="hint">${this.role === "diretora"
        ? "Como você está com acesso da direção, a receita será publicada já aprovada."
        : "A receita será enviada para a direção pedagógica aprovar antes de aparecer para a cozinheira."}</p>
    `, `<button class="btn btn-outline" data-fechar-modal>Cancelar</button>
        <button class="btn btn-primary" id="salvarReceita">💾 Enviar receita</button>`);

    document.getElementById("salvarReceita").onclick = () => {
      const nome = document.getElementById("f_nome").value.trim();
      if (!nome) { this.toast("Informe o nome da receita.", "erro"); return; }
      const parseLinhas = (id, comQuantidade = false) => document.getElementById(id).value.split("\n")
        .map(l => l.trim()).filter(Boolean).map(l => {
          if (!comQuantidade) return l;
          const [a, b] = l.split("|");
          return { item: (a || "").trim(), qtd: (b || "").trim() };
        }).filter(x => typeof x === "string" ? x : x.item);

      const linkVideo = document.getElementById("f_video").value.trim();
      const videoId = (linkVideo.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/) || [])[1] || "";

      const r = {
        id: this.uid(), nome, emoji: "🍽️",
        categoria: document.getElementById("f_cat").value,
        tempo: document.getElementById("f_tempo").value.trim() || "—",
        rendimento: document.getElementById("f_rend").value.trim() || "—",
        porcao: document.getElementById("f_porcao").value.trim(),
        dificuldade: "—",
        status: this.role === "diretora" ? "aprovada" : "pendente",
        descricao: document.getElementById("f_desc").value.trim() || "Receita cadastrada pela cozinheira.",
        ingredientes: parseLinhas("f_ing", true),
        passos: parseLinhas("f_passos"),
        dicas: parseLinhas("f_dicas"),
        higiene: parseLinhas("f_higiene"),
        videos: videoId ? [videoId] : [],
      };
      this.state.receitas.push(r);
      this.salvar("receitas");
      this.fecharModal();
      this.toast(this.role === "diretora" ? "Receita publicada!" : "Receita enviada para aprovação da direção!");
      this.renderizar();
    };
  },

  /* ---------- Estoque ---------- */
  statusEstoque(i) {
    const hoje = this.hojeISO();
    if (i.validade && i.validade < hoje) return "vencido";
    if (Number(i.qtd) < Number(i.minimo)) return "baixo";
    return "ok";
  },

  catIcone(c) {
    return {
      "Grãos": "🌾", "Mercearia": "🥫", "Hortifruti": "🥬", "Proteínas": "🥩",
      "Laticínios": "🥛", "Bebidas": "🧃", "Limpeza": "🧽", "Outros": "📦",
    }[c] || "📦";
  },

  renderFiltrosEstoque() {
    const cats = [...new Set(this.state.estoque.map(i => i.categoria))].sort((a, b) => a.localeCompare(b));
    const opcoes = ["Todas", ...cats];
    document.getElementById("filtrosEstoque").innerHTML = `<span class="rotulo">📂 Categorias:</span>` +
      opcoes.map(c => {
        const n = c === "Todas" ? this.state.estoque.length : this.state.estoque.filter(i => i.categoria === c).length;
        return `<button class="chip ${this.filtroCategoriaEstoque === c ? "active" : ""}" data-cat-estoque="${this.esc(c)}">
          ${this.catIcone(c)} ${this.esc(c)} <span style="opacity:.7">(${n})</span></button>`;
      }).join("");
  },

  renderEstoque() {
    this.renderFiltrosEstoque();
    const statusInfo = {
      ok: { txt: "OK", cls: "bs-ok" },
      baixo: { txt: "Estoque baixo", cls: "bs-baixo" },
      vencido: { txt: "Vencido", cls: "bs-vencido" },
    };
    const criticos = this.state.estoque.filter(i => this.statusEstoque(i) !== "ok");
    const vencidos = criticos.filter(i => this.statusEstoque(i) === "vencido");
    const baixos = criticos.filter(i => this.statusEstoque(i) === "baixo");

    const valorTotal = this.state.estoque.reduce((s, i) => s + Number(i.qtd) * Number(i.preco || 0), 0);

    document.getElementById("estoqueStats").innerHTML = `
      ${[
        ["📦", "bg-blue", "Total de itens", this.state.estoque.length, "alimentos cadastrados"],
        ["✅", "bg-green", "Em ordem", this.state.estoque.length - criticos.length, "sem alertas"],
        ["⚠️", "bg-orange", "Estoque baixo", baixos.length, "precisam de reposição"],
        ["🚫", "bg-red", "Vencidos", vencidos.length, "devem ser descartados"],
        ["💰", "bg-purple", "Valor do estoque", this.fmtMoeda(valorTotal), " quantidade × preço"],
      ].map(s => `<div class="stat-card"><div class="stat-icon ${s[1]}">${s[0]}</div>
        <div class="stat-info"><span>${s[2]}</span><strong style="font-size:${typeof s[3] === "number" ? "22px" : "18px"}">${s[3]}</strong><small>${s[4]}</small></div></div>`).join("")}`;

    if (!this.state.estoque.length) {
      document.getElementById("alertaEstoque").innerHTML = `
        <div class="alerta-vazio">
          <span class="av-ico">📦</span>
          <div class="av-texto">
            <strong>Nenhum alimento cadastrado ainda</strong>
            <p>Cadastre os produtos da cozinha com quantidade, preço e data de validade.</p>
          </div>
          <button class="btn btn-primary" id="btnPrimeiroAlimento">➕ Cadastrar primeiro alimento</button>
        </div>`;
    } else {
      document.getElementById("alertaEstoque").innerHTML = criticos.length
        ? criticos.slice(0, 4).map(i => {
            const v = this.statusEstoque(i) === "vencido";
            return `<div class="alerta-item ${v ? "" : "atencao"}">
              <span class="ai-ico">${v ? "🚫" : "⚠️"}</span>
              <span><strong>${this.esc(i.item)}</strong> — ${v
                ? `validade vencida em ${this.fmtData(i.validade)}`
                : `restam apenas ${i.qtd} ${this.esc(i.unidade)} (mínimo ${i.minimo})`}</span>
            </div>`;
          }).join("") + (criticos.length > 4 ? `<p class="hint">+ ${criticos.length - 4} item(ns) na tabela abaixo.</p>` : "")
        : `<div class="alerta-item atencao"><span class="ai-ico">✅</span><span><strong>Tudo em ordem!</strong> Nenhum item vencido ou abaixo do mínimo.</span></div>`;
    }

    const busca = (document.getElementById("buscaEstoque")?.value || "").toLowerCase().trim();
    let lista = [...this.state.estoque].sort((a, b) =>
      a.categoria.localeCompare(b.categoria) || a.item.localeCompare(b.item)
    );
    if (this.filtroCategoriaEstoque !== "Todas") {
      lista = lista.filter(i => i.categoria === this.filtroCategoriaEstoque);
    }
    if (busca) {
      lista = lista.filter(i => (i.item + " " + i.categoria).toLowerCase().includes(busca));
    }

    let html = "";
    let catAtual = null;
    lista.forEach(i => {
      if (i.categoria !== catAtual) {
        catAtual = i.categoria;
        const n = lista.filter(x => x.categoria === catAtual).length;
        html += `<tr class="grupo-categoria"><td colspan="9">
          <span class="cat-ico">${this.catIcone(catAtual)}</span>${this.esc(catAtual)}
          <span class="contador-categoria">${n} item(ns)</span></td></tr>`;
      }
      const s = statusInfo[this.statusEstoque(i)];
      html += `<tr>
        <td class="nome-cell">${this.destacar(i.item, busca)}</td>
        <td>${this.esc(i.categoria)}</td>
        <td><strong>${i.qtd}</strong> ${this.esc(i.unidade)}</td>
        <td>${this.fmtMoeda(i.preco || 0)}</td>
        <td><strong>${this.fmtMoeda(Number(i.qtd) * Number(i.preco || 0))}</strong></td>
        <td>${i.minimo} ${this.esc(i.unidade)}</td>
        <td>${this.fmtData(i.validade)}</td>
        <td><span class="badge-status ${s.cls}">${s.txt}</span></td>
        <td><div class="acoes-cell">
          <button class="icon-action" title="Adicionar quantidade" data-add-estoque="${i.id}">＋</button>
          <button class="icon-action" title="Editar" data-edit-estoque="${i.id}">✏️</button>
          <button class="icon-action" title="Remover alimento" data-del-estoque="${i.id}">🗑️</button>
        </div></td>
      </tr>`;
    });
    document.getElementById("estoqueTbody").innerHTML = html ||
      `<tr><td colspan="9" style="text-align:center;padding:24px">Nenhum item encontrado nesta categoria ou busca.</td></tr>`;
  },

  formEstoque(item) {
    const e = item || { item: "", categoria: "Grãos", qtd: 0, unidade: "kg", minimo: 0, preco: 0, validade: this.hojeISO() };
    const cats = ["Grãos", "Mercearia", "Hortifruti", "Proteínas", "Laticínios", "Bebidas", "Limpeza", "Outros"];
    const unidades = ["kg", "g", "L", "ml", "un", "pct", "cx"];
    this.abrirModal(item ? "✏️ Editar alimento" : "➕ Cadastrar alimento", `
      <div class="form-row">
        <div class="form-group"><label>Nome do item</label><input id="e_item" value="${this.esc(e.item)}" /></div>
        <div class="form-group"><label>Categoria</label><select id="e_cat">${cats.map(c => `<option ${e.categoria === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Quantidade atual</label><input id="e_qtd" type="number" min="0" step="0.1" value="${e.qtd}" /></div>
        <div class="form-group"><label>Unidade</label><select id="e_un">${unidades.map(u => `<option ${e.unidade === u ? "selected" : ""}>${u}</option>`).join("")}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Preço unitário (R$)</label><input id="e_preco" type="number" min="0" step="0.01" value="${e.preco || 0}" /></div>
        <div class="form-group"><label>Quantidade mínima</label><input id="e_min" type="number" min="0" step="0.1" value="${e.minimo}" /></div>
      </div>
      <div class="form-group"><label>Data de validade</label><input id="e_val" type="date" value="${e.validade}" /></div>
      <p class="hint">Somente a <strong>Cozinheira</strong> e a <strong>Diretora Pedagoga</strong> podem cadastrar, editar e remover alimentos. O valor total é calculado automaticamente (quantidade × preço).</p>
    `, `<button class="btn btn-outline" data-fechar-modal>Cancelar</button>
        <button class="btn btn-primary" id="salvarItem">💾 Salvar</button>`);

    document.getElementById("salvarItem").onclick = () => {
      const nome = document.getElementById("e_item").value.trim();
      if (!nome) { this.toast("Informe o nome do item.", "erro"); return; }
      const dados = {
        item: nome,
        categoria: document.getElementById("e_cat").value,
        qtd: Number(document.getElementById("e_qtd").value) || 0,
        unidade: document.getElementById("e_un").value,
        minimo: Number(document.getElementById("e_min").value) || 0,
        preco: Number(document.getElementById("e_preco").value) || 0,
        validade: document.getElementById("e_val").value,
      };
      if (item) Object.assign(item, dados);
      else this.state.estoque.push({ id: this.uid(), ...dados });
      this.salvar("estoque");
      this.fecharModal();
      this.toast(item ? "Item atualizado!" : "Item adicionado ao estoque!");
      this.renderEstoque();
      this.atualizarBadges();
    };
  },

  /* ---------- Higiene ---------- */
  renderHigiene() {
    const busca = (document.getElementById("buscaHigiene")?.value || "").toLowerCase().trim();
    let lista = this.state.higiene;
    if (busca) {
      lista = lista.filter(h =>
        (h.titulo + " " + h.resumo + " " + h.itens.join(" ")).toLowerCase().includes(busca)
      );
    }
    document.getElementById("higieneGrid").innerHTML = lista.length ? lista.map(h => `
      <article class="hig-card cor-${this.esc(h.cor)}">
        <div class="hig-top"><span class="hig-ico">${h.emoji}</span><h4>${this.destacar(h.titulo, busca)}</h4></div>
        <p>${this.destacar(h.resumo, busca)}</p>
        <ul>${h.itens.map(i => `<li>${this.destacar(i, busca)}</li>`).join("")}</ul>
      </article>`).join("")
      : `<div class="empty-state" style="grid-column:1/-1"><span class="es-ico">🔍</span>
          <h3>Nenhuma dica encontrada</h3><p>Tente outro termo, como "mãos", "geladeira" ou "alergia".</p></div>`;

    const itensCheck = [
      "Lavei as mãos com água e sabão antes de começar",
      "Conferi a validade dos alimentos que vou usar",
      "Separei alimentos crus dos alimentos prontos",
      "Higienizei frutas, legumes e verduras",
      "Verifiquei a temperatura da geladeira",
      "Usei tábuas e facas limpas e adequadas",
      "Limpei a bancada antes e depois do preparo",
      "Guardei corretamente as sobras com data e identificação",
    ];
    document.getElementById("checklist").innerHTML = itensCheck.map((t, i) => `
      <label class="check-item ${this.checklist.includes(i) ? "concluido" : ""}">
        <input type="checkbox" data-check="${i}" ${this.checklist.includes(i) ? "checked" : ""} />
        <span>${t}</span>
      </label>`).join("");
    this.atualizarProgresso(itensCheck.length);
  },

  atualizarProgresso(total) {
    const n = this.checklist.length;
    document.getElementById("checklistTexto").textContent = `${n} de ${total}`;
    document.getElementById("checklistBar").style.width = total ? (n / total) * 100 + "%" : "0%";
  },

  /* ---------- Avisos ---------- */
  renderAvisos() {
    const icos = { aviso: "📢", sucesso: "✅", info: "ℹ️" };
    const busca = (document.getElementById("buscaAvisos")?.value || "").toLowerCase().trim();
    let lista = [...this.state.avisos].sort((a, b) => b.data.localeCompare(a.data));
    if (busca) {
      lista = lista.filter(a => (a.titulo + " " + a.texto + " " + a.autor).toLowerCase().includes(busca));
    }
    document.getElementById("avisosLista").innerHTML = lista.length ? lista.map(a => `
      <article class="aviso-card tipo-${this.esc(a.tipo)} ${!a.lido ? "nao-lido" : ""}">
        <span class="aviso-ico">${icos[a.tipo] || "📢"}</span>
        <div class="aviso-conteudo">
          <h4>${this.destacar(a.titulo, busca)} ${!a.lido ? '<span class="tag-novo">NOVO</span>' : ""}</h4>
          <p>${this.destacar(a.texto, busca)}</p>
          <div class="aviso-meta">${this.esc(a.autor)} · ${this.fmtData(a.data)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${!a.lido && this.role === "diretora" ? `<button class="btn btn-outline btn-sm" data-marcar-lido="${a.id}">Marcar como lido</button>` : ""}
          <button class="icon-action" title="Remover aviso" data-del-aviso="${a.id}">🗑️</button>
        </div>
      </article>`).join("")
      : `<div class="empty-state"><span class="es-ico">🔔</span><h3>Nenhum aviso</h3><p>Os avisos da direção aparecerão aqui.</p></div>`;
  },

  novoAviso() {
    this.abrirModal("➕ Criar novo aviso", `
      <div class="form-group"><label>Título</label><input id="a_titulo" placeholder="Ex.: Reunião da equipe" /></div>
      <div class="form-group"><label>Mensagem</label><textarea id="a_texto" placeholder="Escreva o aviso para a equipe..."></textarea></div>
      <div class="form-group"><label>Tipo</label><select id="a_tipo">
        <option value="info">ℹ️ Informação</option>
        <option value="aviso">📢 Atenção</option>
        <option value="sucesso">✅ Confirmação</option>
      </select></div>
    `, `<button class="btn btn-outline" data-fechar-modal>Cancelar</button>
        <button class="btn btn-primary" id="salvarAviso">📢 Publicar aviso</button>`);

    document.getElementById("salvarAviso").onclick = () => {
      const titulo = document.getElementById("a_titulo").value.trim();
      const texto = document.getElementById("a_texto").value.trim();
      if (!titulo || !texto) { this.toast("Preencha o título e a mensagem.", "erro"); return; }
      this.state.avisos.push({
        id: this.uid(), titulo, texto,
        tipo: document.getElementById("a_tipo").value,
        autor: "Diretoria Pedagógica", data: this.hojeISO(), lido: false,
      });
      this.salvar("avisos");
      this.fecharModal();
      this.toast("Aviso publicado para a equipe!");
      this.renderAvisos();
      this.atualizarBadges();
    };
  },

  /* ---------- Aprovações ---------- */
  renderAprovacoes() {
    const pendentes = this.state.receitas.filter(r => r.status === "pendente");
    const el = document.getElementById("aprovacoesLista");
    if (!pendentes.length) {
      el.innerHTML = `<div class="empty-state"><span class="es-ico">🎉</span>
        <h3>Tudo em dia!</h3><p>Não há receitas aguardando aprovação no momento.</p></div>`;
      return;
    }
    el.innerHTML = pendentes.map(r => `
      <div class="aprovacao-card">
        <div class="aprovacao-ico">${r.emoji || "🍽️"}</div>
        <div class="aprovacao-info">
          <h4>${this.esc(r.nome)}</h4>
          <p>${this.esc(r.descricao)}</p>
          <div class="rc-meta">
            <span>⏱️ ${this.esc(r.tempo)}</span><span>👥 ${this.esc(r.rendimento)}</span>
            <span>🧾 ${r.ingredientes.length} ingredientes</span>
          </div>
        </div>
        <div class="aprovacao-acoes">
          <button class="btn btn-primary btn-sm" data-ver-receita="${r.id}">👁️ Analisar</button>
          <button class="btn btn-primary btn-sm" data-aprovar="${r.id}">✅ Aprovar</button>
          <button class="btn btn-danger btn-sm" data-rejeitar="${r.id}">✕ Rejeitar</button>
        </div>
      </div>`).join("");
  },

  /* ---------- Relatório ---------- */
  valorDesperdicioMes() {
    const hoje = new Date();
    return this.state.desperdicio
      .filter(d => {
        const dt = new Date(d.data + "T00:00:00");
        return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear();
      })
      .reduce((s, d) => s + Number(d.valor || 0), 0);
  },

  desperdicioDoMes() {
    const hoje = new Date();
    return this.state.desperdicio.filter(d => {
      const dt = new Date(d.data + "T00:00:00");
      return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear();
    });
  },

  renderRelatorio() {
    const hoje = new Date();
    document.getElementById("relatorioSubtitulo").textContent =
      `Acompanhamento de ${hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}.`;
    const lista = this.desperdicioDoMes();
    const total = this.valorDesperdicioMes();

    const porMotivo = {};
    lista.forEach(d => { porMotivo[d.motivo] = (porMotivo[d.motivo] || 0) + Number(d.valor || 0); });
    const motivos = Object.entries(porMotivo).sort((a, b) => b[1] - a[1]);
    const principal = motivos[0] || ["—", 0];

    const porItem = {};
    lista.forEach(d => { porItem[d.item] = (porItem[d.item] || 0) + Number(d.valor || 0); });
    const piorItem = Object.entries(porItem).sort((a, b) => b[1] - a[1])[0] || ["—", 0];

    document.getElementById("relatorioStats").innerHTML = `
      ${[
        ["📋", "bg-blue", "Registros no mês", lista.length, "ocorrências"],
        ["💰", "bg-red", "Prejuízo estimado", this.fmtMoeda(total), " valor total"],
        ["🥇", "bg-orange", "Maior perda", piorItem[0], this.fmtMoeda(piorItem[1])],
        ["🔍", "bg-purple", "Motivo principal", principal[0], this.fmtMoeda(principal[1])],
      ].map(s => `<div class="stat-card"><div class="stat-icon ${s[1]}">${s[0]}</div>
        <div class="stat-info"><span>${s[2]}</span><strong style="font-size:${typeof s[3] === "string" && s[3].length > 10 ? "15px" : "22px"}">${this.esc(s[3])}</strong><small>${s[4]}</small></div></div>`).join("")}`;

    // Gráfico por semana
    const semanas = [0, 0, 0, 0, 0];
    lista.forEach(d => {
      const dia = Number(d.data.split("-")[2]);
      semanas[Math.min(4, Math.floor((dia - 1) / 7))] += Number(d.valor || 0);
    });
    const maxSem = Math.max(...semanas, 1);
    document.getElementById("chartSemanas").innerHTML = `
      <div class="bar-group">
        ${semanas.map((v, i) => `<div class="bar-col">
          <div class="bar" data-valor="${this.fmtMoeda(v)}" style="height:${Math.max(4, (v / maxSem) * 150)}px"></div>
          <div class="bar-label">${i === 4 ? "5ª" : (i + 1) + "ª"} semana</div>
        </div>`).join("")}
      </div>`;

    // Gráfico por motivo
    const cores = ["#3b82f6", "#22d3ee", "#818cf8", "#f472b6", "#fbbf24"];
    document.getElementById("chartMotivos").innerHTML = motivos.length ? motivos.map(([m, v], i) => `
      <div class="motivo-row">
        <div class="motivo-top"><strong>${this.esc(m)}</strong><span>${this.fmtMoeda(v)}</span></div>
        <div class="motivo-bar-wrap"><div class="motivo-bar" style="width:${(v / (total || 1)) * 100}%;background:${cores[i % cores.length]}"></div></div>
      </div>`).join("") : `<p class="hint">Nenhum registro neste mês.</p>`;

    // Tabela (com busca)
    const busca = (document.getElementById("buscaDesperdicio")?.value || "").toLowerCase().trim();
    let registros = [...lista].reverse();
    if (busca) {
      registros = registros.filter(d =>
        (d.item + " " + d.motivo + " " + d.unidade + " " + this.fmtData(d.data)).toLowerCase().includes(busca)
      );
    }
    document.getElementById("desperdicioTbody").innerHTML = registros.length ? registros.map(d => `
      <tr><td>${this.fmtData(d.data)}</td><td class="nome-cell">${this.destacar(d.item, busca)}</td>
      <td>${d.qtd} ${this.esc(d.unidade)}</td><td>${this.destacar(d.motivo, busca)}</td>
      <td><strong>${this.fmtMoeda(d.valor)}</strong></td>
      <td><button class="icon-action" title="Remover registro" data-del-desperdicio="${d.id}">🗑️</button></td></tr>`).join("")
      : `<tr><td colspan="6" style="text-align:center;padding:24px">${busca ? "Nenhum registro encontrado para essa busca." : "Nenhum desperdício registrado neste mês. 🎉"}</td></tr>`;

    // Sugestões
    const sugestoes = [
      { ico: "📅", txt: "Planeje as compras com base no cardápio da semana para evitar excessos que vencem." },
      { ico: "🧊", txt: "Aplique o PEPS (primeiro que entra, primeiro que sai) na organização da geladeira e da despensa." },
      { ico: "🍽️", txt: "Ofereça porções adequadas e permita reposição: evita sobra no prato dos alunos." },
      { ico: "♻️", txt: "Aproveite sobras seguras em novas receitas, como sopas, bolos e saladas." },
    ];
    if (principal[0] !== "—") sugestoes.unshift({
      ico: "🎯",
      txt: `O principal motivo deste mês foi "${principal[0]}". Priorize ações preventivas para reduzir esse item.`,
    });
    document.getElementById("sugestoesDesperdicio").innerHTML = `
      <div class="sugestoes-grid">${sugestoes.map(s => `<div class="sugestao"><span class="s-ico">${s.ico}</span><span>${this.esc(s.txt)}</span></div>`).join("")}</div>`;
  },

  novoDesperdicio() {
    this.abrirModal("➕ Registrar desperdício", `
      <div class="form-row">
        <div class="form-group"><label>Alimento</label><input id="d_item" placeholder="Ex.: Tomate" /></div>
        <div class="form-group"><label>Data</label><input id="d_data" type="date" value="${this.hojeISO()}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Quantidade</label><input id="d_qtd" type="number" min="0" step="0.1" value="1" /></div>
        <div class="form-group"><label>Unidade</label><select id="d_un"><option>kg</option><option>g</option><option>L</option><option>un</option><option>pct</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Motivo</label><select id="d_motivo">
          <option>Validade vencida</option><option>Apodrecido</option><option>Sobra de preparo</option>
          <option>Dano no transporte</option><option>Preparo excessivo</option><option>Outro</option>
        </select></div>
        <div class="form-group"><label>Prejuízo estimado (R$)</label><input id="d_valor" type="number" min="0" step="0.01" value="0" /></div>
      </div>
    `, `<button class="btn btn-outline" data-fechar-modal>Cancelar</button>
        <button class="btn btn-primary" id="salvarDesperdicio">💾 Registrar</button>`);

    document.getElementById("salvarDesperdicio").onclick = () => {
      const item = document.getElementById("d_item").value.trim();
      if (!item) { this.toast("Informe o alimento.", "erro"); return; }
      this.state.desperdicio.push({
        id: this.uid(), item,
        data: document.getElementById("d_data").value || this.hojeISO(),
        qtd: Number(document.getElementById("d_qtd").value) || 0,
        unidade: document.getElementById("d_un").value,
        motivo: document.getElementById("d_motivo").value,
        valor: Number(document.getElementById("d_valor").value) || 0,
      });
      this.salvar("desperdicio");
      this.fecharModal();
      this.toast("Desperdício registrado. O relatório foi atualizado!");
      this.renderRelatorio();
      this.atualizarBadges();
    };
  },

  exportarCSV() {
    const linhas = [["Data", "Item", "Quantidade", "Unidade", "Motivo", "Valor (R$)"]];
    this.desperdicioDoMes().forEach(d => linhas.push([d.data, d.item, d.qtd, d.unidade, d.motivo, d.valor]));
    const csv = "\uFEFF" + linhas.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-desperdicio-sgk.csv";
    a.click();
    URL.revokeObjectURL(url);
    this.toast("Relatório exportado em CSV!");
  },

  /* ---------- Busca global ---------- */
  abrirBuscaGlobal(termo) {
    if (this.buscaAberta) {
      const inp = document.getElementById("buscaModalInput");
      if (inp) { inp.value = termo; this.renderResultadosBusca(termo); }
      return;
    }
    this.buscaAberta = true;
    this.abrirModal("🔍 Buscar em todo o sistema", `
      <div class="busca-wrap" style="margin:0 0 16px;width:100%">
        <span>🔎</span>
        <input id="buscaModalInput" type="search" placeholder="Receitas, alimentos, cardápio, higiene, avisos..."
          value="${this.esc(termo)}" />
      </div>
      <div id="resultadosBusca"></div>
      <p class="dica-busca">Digite pelo menos 2 letras. Clique em um resultado para ir até ele.</p>
    `, `<button class="btn btn-outline" data-fechar-modal>Fechar</button>`);

    const inp = document.getElementById("buscaModalInput");
    inp.addEventListener("input", () => this.renderResultadosBusca(inp.value));
    inp.focus();
    this.renderResultadosBusca(termo);
  },

  renderResultadosBusca(termo) {
    const area = document.getElementById("resultadosBusca");
    if (!area) return;
    const t = (termo || "").toLowerCase().trim();
    if (t.length < 2) {
      area.innerHTML = `<div class="resumo-busca">Digite pelo menos 2 caracteres para buscar.</div>`;
      return;
    }
    const resultados = this.buscarGlobal(t);
    area.innerHTML = `<div class="resumo-busca">${resultados.length} resultado(s) para "<strong>${this.esc(termo)}</strong>"</div>` +
      (resultados.length ? resultados.map(r => `
        <button class="resultado-busca" data-ir-secao="${r.secao}" data-termo-busca="${this.esc(r.termo || "")}">
          <span class="rb-ico">${r.icone}</span>
          <span style="flex:1">
            <span class="rb-tipo">${this.esc(r.tipo)}</span>
            <span class="rb-titulo">${this.destacar(r.titulo, termo)}</span>
            <span class="rb-texto">${this.destacar(r.texto, termo)}</span>
          </span>
          <span class="rb-ir">Ir →</span>
        </button>`).join("")
      : `<div class="empty-state" style="padding:30px"><span class="es-ico">🔍</span>
          <h3>Nada encontrado</h3><p>Tente outra palavra.</p></div>`);
  },

  buscarGlobal(t) {
    const out = [];
    const add = (tipo, secao, icone, titulo, texto, termo) => {
      if (out.length < 24) out.push({ tipo, secao, icone, titulo, texto, termo });
    };
    const tem = (...partes) => partes.join(" ").toLowerCase().includes(t);

    this.state.receitas.filter(r => r.status === "aprovada" || this.role === "diretora").forEach(r => {
      if (tem(r.nome, r.descricao, r.categoria, r.ingredientes.map(i => i.item).join(" "), (r.passos || []).join(" "))) {
        add("Receita", "receitas", r.emoji || "📖", r.nome, r.descricao + " · " + r.categoria, r.nome);
      }
    });
    this.state.estoque.forEach(i => {
      if (tem(i.item, i.categoria)) {
        add("Alimento / Estoque", "estoque", "📦", i.item,
          `${i.qtd} ${i.unidade} · ${i.categoria} · ${this.fmtMoeda(i.preco || 0)}`, i.item);
      }
    });
    this.state.cardapio.forEach(d => {
      if (tem(d.dia, d.cafe, d.almoco, d.lanche, d.sobremesa)) {
        add("Cardápio", "cardapio", d.emoji || "📅", d.dia, d.almoco, d.almoco.slice(0, 60));
      }
    });
    this.state.higiene.forEach(h => {
      if (tem(h.titulo, h.resumo, h.itens.join(" "))) {
        add("Higiene", "higiene", h.emoji || "🧼", h.titulo, h.resumo, h.titulo);
      }
    });
    this.state.avisos.forEach(a => {
      if (tem(a.titulo, a.texto, a.autor)) add("Aviso", "avisos", "🔔", a.titulo, a.texto, a.titulo);
    });
    this.state.desperdicio.forEach(d => {
      if (tem(d.item, d.motivo)) {
        add("Desperdício", "relatorio", "📊", d.item, `${d.motivo} · ${this.fmtData(d.data)}`, d.item);
      }
    });
    (this.state.videos || []).forEach(v => {
      if (tem(v.titulo, v.canal, v.categoria, v.descricao, v.tipo)) {
        add("Vídeo", "videos", "🎥", v.titulo, `${v.canal} · ${v.categoria} · ${v.tipo}`, v.titulo);
      }
    });
    return out;
  },

  /* ---------- Eventos ---------- */
  iniciarApp() {
    document.getElementById("anoAtual").textContent = new Date().getFullYear();
    this.aplicarRole();
    this.irPara("inicio");

    document.getElementById("sidebarNav").addEventListener("click", (e) => {
      const b = e.target.closest(".nav-item");
      if (b) this.irPara(b.dataset.section);
    });
    document.querySelectorAll("[data-go]").forEach(b =>
      b.addEventListener("click", () => this.irPara(b.dataset.go))
    );

    document.getElementById("menuToggle").onclick = () => {
      document.getElementById("sidebar").classList.add("aberto");
      document.getElementById("sidebarOverlay").classList.add("mostrar");
    };
    document.getElementById("sidebarClose").onclick = () => {
      document.getElementById("sidebar").classList.remove("aberto");
      document.getElementById("sidebarOverlay").classList.remove("mostrar");
    };
    document.getElementById("sidebarOverlay").onclick = () => {
      document.getElementById("sidebar").classList.remove("aberto");
      document.getElementById("sidebarOverlay").classList.remove("mostrar");
    };

    document.getElementById("roleSelect").addEventListener("change", (e) => {
      this.role = e.target.value;
      this.aplicarRole();
      this.toast(this.role === "diretora" ? "Acesso da direção ativado." : "Acesso de cozinheira ativado.", "info");
    });

    // Tema (escuro por padrão)
    const temaSalvo = localStorage.getItem("sgk2_tema") || "escuro";
    document.body.classList.toggle("claro", temaSalvo === "claro");
    const btnTema = document.getElementById("btnTema");
    btnTema.textContent = temaSalvo === "claro" ? "🌙" : "☀️";
    btnTema.onclick = () => {
      const claro = document.body.classList.toggle("claro");
      localStorage.setItem("sgk2_tema", claro ? "claro" : "escuro");
      btnTema.textContent = claro ? "🌙" : "☀️";
    };

    // Cadastro de alimento disponível para a Cozinheira e a Diretora
    document.getElementById("btnCadastrarAlimento").onclick = () => {
      this.irPara("estoque");
      this.formEstoque();
    };

    // Busca global e buscas por seção
    document.getElementById("buscaGlobal").addEventListener("input", (e) => {
      if (e.target.value.trim().length >= 2) this.abrirBuscaGlobal(e.target.value);
    });
    document.getElementById("buscaCardapio").addEventListener("input", () => this.renderCardapio());
    document.getElementById("buscaHigiene").addEventListener("input", () => this.renderHigiene());
    document.getElementById("buscaAvisos").addEventListener("input", () => this.renderAvisos());
    document.getElementById("buscaDesperdicio").addEventListener("input", () => this.renderRelatorio());
    document.getElementById("filtrosEstoque").addEventListener("click", (e) => {
      const c = e.target.closest("[data-cat-estoque]");
      if (c) { this.filtroCategoriaEstoque = c.dataset.catEstoque; this.renderEstoque(); }
    });

    document.getElementById("modalClose").onclick = () => this.fecharModal();
    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this.fecharModal();
      if (e.target.closest("[data-fechar-modal]")) this.fecharModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.fecharModal();
    });

    document.getElementById("btnSair").onclick = () => this.sair();
    document.getElementById("btnNotificacoes").onclick = () => this.irPara("avisos");
    document.getElementById("novaDica").onclick = () => {
      this.dicaIndex++;
      this.renderInicio();
    };

    document.getElementById("btnImprimirCardapio").onclick = () => window.print();
    document.getElementById("semanaTabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-dia]");
      if (b) { this.diaCardapio = Number(b.dataset.dia); this.renderCardapio(); }
    });

    document.getElementById("btnNovaReceita").onclick = () => this.novaReceita();
    document.getElementById("filtrosReceitas").addEventListener("click", (e) => {
      const c = e.target.closest("[data-cat]");
      if (!c) return;
      this.filtroCategoria = c.dataset.cat;
      document.querySelectorAll("#filtrosReceitas .chip").forEach(x => x.classList.toggle("active", x === c));
      this.renderReceitas();
    });
    document.getElementById("buscaReceita").addEventListener("input", () => this.renderReceitas());
    document.getElementById("filtrosVideos").addEventListener("click", (e) => {
      const c = e.target.closest("[data-video-cat]");
      if (!c) return;
      this.filtroVideo = c.dataset.videoCat;
      document.querySelectorAll("#filtrosVideos .chip").forEach(x => x.classList.toggle("active", x === c));
      this.renderVideos();
    });
    document.getElementById("buscaVideo").addEventListener("input", () => this.renderVideos());
    document.addEventListener("click", (e) => {
      const primeiro = e.target.closest("#btnPrimeiroAlimento");
      if (primeiro) this.formEstoque();

      // Resultado da busca global
      const ir = e.target.closest("[data-ir-secao]");
      if (ir) {
        const secao = ir.dataset.irSecao;
        const termo = ir.dataset.termoBusca || "";
        this.fecharModal();
        if (secao === "videos") {
          this.filtroVideo = "Todas";
          document.querySelectorAll("#filtrosVideos .chip").forEach(x =>
            x.classList.toggle("active", x.dataset.videoCat === "Todas")
          );
        }
        this.irPara(secao);
        const campos = {
          receitas: "buscaReceita", videos: "buscaVideo", estoque: "buscaEstoque", cardapio: "buscaCardapio",
          higiene: "buscaHigiene", avisos: "buscaAvisos", relatorio: "buscaDesperdicio",
        };
        const campo = campos[secao];
        if (campo && termo) {
          const inp = document.getElementById(campo);
          if (inp) { inp.value = termo; this.renderizar(); }
        }
      }

      // Remover itens cadastrados
      const dr = e.target.closest("[data-del-receita]");
      if (dr) {
        const r = this.state.receitas.find(x => x.id === dr.dataset.delReceita);
        if (r && confirm(`Remover a receita "${r.nome}"?`)) {
          this.state.receitas = this.state.receitas.filter(x => x.id !== r.id);
          this.salvar("receitas"); this.toast("Receita removida.", "info"); this.renderizar();
        }
      }
      const da = e.target.closest("[data-del-aviso]");
      if (da) {
        const a = this.state.avisos.find(x => x.id === da.dataset.delAviso);
        if (a && confirm(`Remover o aviso "${a.titulo}"?`)) {
          this.state.avisos = this.state.avisos.filter(x => x.id !== a.id);
          this.salvar("avisos"); this.toast("Aviso removido.", "info"); this.renderAvisos(); this.atualizarBadges();
        }
      }
      const dd = e.target.closest("[data-del-desperdicio]");
      if (dd) {
        const d = this.state.desperdicio.find(x => x.id === dd.dataset.delDesperdicio);
        if (d && confirm(`Remover o registro de desperdício de "${d.item}"?`)) {
          this.state.desperdicio = this.state.desperdicio.filter(x => x.id !== d.id);
          this.salvar("desperdicio"); this.toast("Registro removido.", "info"); this.renderRelatorio();
        }
      }

      const ver = e.target.closest("[data-ver-receita]");
      if (ver) this.verReceita(ver.dataset.verReceita);
      const apr = e.target.closest("[data-aprovar]");
      if (apr) {
        const r = this.state.receitas.find(x => x.id === apr.dataset.aprovar);
        if (r) { r.status = "aprovada"; this.salvar("receitas"); this.toast(`Receita "${r.nome}" aprovada!`); this.renderizar(); }
      }
      const rej = e.target.closest("[data-rejeitar]");
      if (rej) {
        const r = this.state.receitas.find(x => x.id === rej.dataset.rejeitar);
        if (r && confirm(`Rejeitar a receita "${r.nome}"? Ela será removida.`)) {
          this.state.receitas = this.state.receitas.filter(x => x.id !== r.id);
          this.salvar("receitas"); this.toast("Receita rejeitada e removida.", "info"); this.renderizar();
        }
      }
    });

    document.getElementById("btnNovoItem").onclick = () => this.formEstoque();
    document.getElementById("buscaEstoque").addEventListener("input", () => this.renderEstoque());
    document.getElementById("estoqueTbody").addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-estoque]");
      const edit = e.target.closest("[data-edit-estoque]");
      const del = e.target.closest("[data-del-estoque]");
      if (add) {
        const i = this.state.estoque.find(x => x.id === add.dataset.addEstoque);
        if (i) {
          const q = prompt(`Quanto deseja adicionar ao item "${i.item}"? (em ${i.unidade})`, "10");
          if (q !== null && !isNaN(Number(q)) && Number(q) > 0) {
            i.qtd = Number(i.qtd) + Number(q);
            this.salvar("estoque"); this.toast("Estoque atualizado!"); this.renderEstoque(); this.atualizarBadges();
          }
        }
      }
      if (edit) this.formEstoque(this.state.estoque.find(x => x.id === edit.dataset.editEstoque));
      if (del) {
        const i = this.state.estoque.find(x => x.id === del.dataset.delEstoque);
        if (i && confirm(`Excluir "${i.item}" do estoque?`)) {
          this.state.estoque = this.state.estoque.filter(x => x.id !== i.id);
          this.salvar("estoque"); this.toast("Item removido.", "info"); this.renderEstoque(); this.atualizarBadges();
        }
      }
    });

    document.getElementById("checklist").addEventListener("change", (e) => {
      const c = e.target.closest("[data-check]");
      if (!c) return;
      const i = Number(c.dataset.check);
      if (c.checked && !this.checklist.includes(i)) this.checklist.push(i);
      if (!c.checked) this.checklist = this.checklist.filter(x => x !== i);
      localStorage.setItem("sgk2_checklist", JSON.stringify(this.checklist));
      c.closest(".check-item").classList.toggle("concluido", c.checked);
      this.atualizarProgresso(8);
      if (this.checklist.length === 8) this.toast("Checklist completo! Excelente trabalho 🎉");
    });
    document.getElementById("resetChecklist").onclick = () => {
      this.checklist = [];
      localStorage.setItem("sgk2_checklist", "[]");
      this.renderHigiene();
      this.toast("Checklist reiniciado.", "info");
    };

    document.getElementById("btnNovoAviso").onclick = () => this.novoAviso();
    document.getElementById("avisosLista").addEventListener("click", (e) => {
      const b = e.target.closest("[data-marcar-lido]");
      if (!b) return;
      const a = this.state.avisos.find(x => x.id === b.dataset.marcarLido);
      if (a) { a.lido = true; this.salvar("avisos"); this.renderAvisos(); this.atualizarBadges(); }
    });

    document.getElementById("btnNovoDesperdicio").onclick = () => this.novoDesperdicio();
    document.getElementById("btnExportar").onclick = () => this.exportarCSV();
  },
};

document.addEventListener("DOMContentLoaded", () => {
  App.carregar();
  App.initLogin();
  if (App.verificarSessao()) {
    App.iniciarApp();
  } else {
    document.getElementById("loginScreen").classList.remove("oculto");
  }
});
