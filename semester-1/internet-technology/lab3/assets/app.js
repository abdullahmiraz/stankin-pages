/* Облака и соцсети, v3. Interactions + Motion (motion.dev) animations.
   Every animation has a job: entry hierarchy, reading feedback, data story or state change.
   No window scroll listeners: progress uses Motion scroll(), reveals use inView(). */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const M = window.Motion;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionOK = !!M && !reduce;
  const EASE = [0.16, 1, 0.3, 1];

  /* ---------- reading progress + back-to-top (feedback) ---------- */
  const progress = $("#progress"), totop = $("#totop");
  if (M) {
    M.scroll(p => {
      progress.style.transform = `scaleX(${p})`;
      totop.classList.toggle("show", p > 0.08);
    });
  }
  totop.addEventListener("click", () => scrollTo({ top: 0 }));

  /* ---------- contents overlay ---------- */
  const toc = $(".toc"), tbtn = $(".toc-toggle");
  const tocItems = $$(".toc > ol > li");
  const setMenu = open => {
    toc.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    tbtn.setAttribute("aria-expanded", open);
    tbtn.textContent = open ? "Закрыть" : "Содержание";
    if (open && motionOK) {
      M.animate(tocItems, { opacity: [0, 1], y: [16, 0] }, { delay: M.stagger(0.04), duration: 0.5, ease: EASE });
    }
  };
  tbtn.addEventListener("click", () => setMenu(!toc.classList.contains("open")));
  $$("a", toc).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* ---------- current section in the top bar + active TOC link ---------- */
  const tocLinks = $$(".toc a");
  const now = $(".topbar .now");
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const link = tocLinks.find(a => a.hash === "#" + e.target.id);
    tocLinks.forEach(a => a.classList.toggle("active", a === link));
    if (link && now) now.textContent = link.textContent;
  }), { rootMargin: "-20% 0px -70% 0px" });
  tocLinks.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean).forEach(t => spy.observe(t));

  /* ---------- hero entry (hierarchy: headline first, then lead, then photo) ---------- */
  if (motionOK) {
    const lines = $$(".hero h1 .line > span");
    M.animate(lines, { y: ["105%", "0%"] }, { delay: M.stagger(0.08), duration: 0.9, ease: EASE });
    M.animate($$(".hero .kicker, .hero .lead, .hero .cta"), { opacity: [0, 1], y: [12, 0] }, { delay: M.stagger(0.08, { startDelay: 0.35 }), duration: 0.7, ease: EASE });
    M.animate(".hero-photo .frame", { clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"] }, { duration: 1.1, delay: 0.15, ease: EASE });
    /* photo settles slowly as the hero scrolls away (depth, tied to scroll, no listener) */
    M.scroll(M.animate(".hero img", { scale: [1.12, 1], y: ["0%", "6%"] }, { ease: "linear" }), { target: $(".hero"), offset: ["start start", "end start"] });
  }

  /* ---------- section reveals (storytelling, once) ---------- */
  const revealTargets = $$("article h2, .tabs, .models, .chart, .arch, .media, .rank, .library, blockquote.pull, .note, figure, .stats");
  if (motionOK) {
    revealTargets.forEach(el => { el.style.opacity = 0; });
    M.inView(revealTargets, el => {
      M.animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, ease: EASE });
    }, { amount: 0.15 });
  }

  /* ---------- numbers count up when seen (data story) ---------- */
  const fmt = (v, d) => v.toLocaleString("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d });
  const setFinal = el => { el.textContent = fmt(+el.dataset.to, +(el.dataset.dec || 0)) + (el.dataset.suffix || ""); };
  const counters = $$("[data-to]");
  if (motionOK) {
    M.inView(counters, el => {
      const to = +el.dataset.to, d = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
      M.animate(0, to, { duration: 1.4, ease: EASE, onUpdate: v => (el.textContent = fmt(v, d) + suf) });
    }, { amount: 0.6 });
  } else counters.forEach(setFinal);

  /* ---------- bar charts grow when seen (data story) ---------- */
  const growBars = chart => {
    const fills = $$(".bar-fill", chart);
    if (motionOK) {
      fills.forEach(f => { f.style.width = f.dataset.w + "%"; f.style.transformOrigin = "0 50%"; });
      M.animate(fills, { scaleX: [0, 1] }, { delay: M.stagger(0.09), duration: 1, ease: EASE });
    } else fills.forEach(f => (f.style.width = f.dataset.w + "%"));
  };
  if (motionOK) M.inView(".chart", growBars, { amount: 0.4 });
  else $$(".chart").forEach(growBars);

  /* ---------- web evolution tabs (state change) ---------- */
  $$(".tabs").forEach(box => {
    const btns = $$("[role=tab]", box);
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => {
        x.setAttribute("aria-selected", x === b);
        $("#" + x.getAttribute("aria-controls")).hidden = x !== b;
      });
      const panel = $("#" + b.getAttribute("aria-controls"));
      if (motionOK) M.animate(panel, { opacity: [0, 1], y: [8, 0] }, { duration: 0.4, ease: EASE });
    }));
  });

  /* ---------- service model explorer (state change, layers flip top-down) ---------- */
  const MODELS = {
    onprem: [6, "Собственный ЦОД: компания сама закупает серверы и отвечает за всё, от электропитания до данных."],
    iaas: [4, "IaaS: провайдер даёт виртуальные машины, сеть и хранилища; ОС, среду выполнения и приложения администрирует клиент."],
    paas: [2, "PaaS: провайдер управляет ОС и средой выполнения (управляемые СУБД, Kubernetes, очереди); клиент отвечает за код и данные."],
    saas: [1, "SaaS: готовое приложение в браузере или через API; за клиентом остаются только его данные и права доступа."]
  };
  const layers = $$(".stack .layer");
  const desc = $(".model-desc");
  const setModel = (key, animate) => {
    const [k, text] = MODELS[key];
    layers.forEach((l, i) => {
      const you = i < k;
      l.className = "layer " + (you ? "you" : "prov");
      $(".who", l).textContent = you ? "клиент" : "провайдер";
    });
    desc.textContent = text;
    $$(".model-switch button").forEach(b => b.classList.toggle("on", b.dataset.model === key));
    if (animate && motionOK) M.animate(layers, { x: [-6, 0], opacity: [0.5, 1] }, { delay: M.stagger(0.04), duration: 0.45, ease: EASE });
  };
  $$(".model-switch button").forEach(b => b.addEventListener("click", () => setModel(b.dataset.model, true)));
  if (layers.length) setModel("iaas", false);

  /* ---------- architecture diagram (feedback) ---------- */
  const info = $(".arch-info");
  $$(".arch .node").forEach(n => {
    const show = () => {
      if (n.classList.contains("on")) return;
      $$(".arch .node").forEach(x => x.classList.toggle("on", x === n));
      info.innerHTML = `<b>${n.textContent.trim()}.</b> ${n.dataset.info}`;
      if (motionOK) M.animate(info, { opacity: [0.3, 1] }, { duration: 0.3 });
    };
    n.addEventListener("mouseenter", show);
    n.addEventListener("focus", show);
    n.addEventListener("click", show);
  });

  /* ---------- podcast episode switcher ---------- */
  const audio = $("#podcast");
  const epTitle = $("#ep-title");
  $$(".episodes button").forEach(b => b.addEventListener("click", () => {
    $$(".episodes button").forEach(x => x.classList.toggle("on", x === b));
    audio.src = b.dataset.src;
    if (epTitle) epTitle.textContent = b.dataset.title;
    audio.play().catch(() => {});
  }));

  /* ---------- citation back-links ---------- */
  $$("a.cite").forEach((a, i) => {
    a.id = a.id || "c" + i;
    a.addEventListener("click", () => {
      const back = $(a.hash + " .back");
      if (back) back.href = "#" + a.id;
    });
  });
})();
