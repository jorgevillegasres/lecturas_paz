/* Lecturas de paz: aplicación de una sola página, sin dependencias.
   Los datos viven en data/curso.json, data/metodologia.json y data/lecturas/<id>.json. */
(() => {
  "use strict";

  const ORDEN = ["mouly2022", "enciclopedia2004", "lederach1998", "rojas2012", "castillo2018",
    "gallego2023", "garciaduran2023", "garciaduran2018", "arendt1993", "keyes2019"];
  const COLOR_MOD = { "M1-2": "var(--m12)", "M3": "var(--m3)", "M4": "var(--m4)", "M5-7": "var(--m57)" };
  const EJES_NOMBRE = {};

  const state = { curso: null, metodo: null, lect: {}, lista: [] };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#main");

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("lp:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("lp:" + k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
  };
  const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const L = (id) => state.lect[id];
  const cita = (l) => l ? `${l.autorCorto} (${l.anio})` : "";
  const pag = (p) => p ? `<span class="page">p. ${esc(p)}</span>` : "";
  const modTag = (m) => `<span class="tag mod" data-m="${esc(m)}">${esc(m.replace("M1-2", "Mód. 1-2").replace("M5-7", "Mód. 5-7").replace(/^M(\d)$/, "Mód. $1"))}</span>`;
  const infTag = (on) => on ? `<span class="tag inf" title="Interpretación o conexión que no está en el texto">Inferencia</span>` : "";
  const infCls = (on) => on ? " inf-only inf-block" : "";
  const leidas = () => store.get("leidas", {});
  const linkL = (id, txt) => L(id) ? `<a href="#/lectura/${id}">${esc(txt || cita(L(id)))}</a>` : esc(txt || id);
  const footer = () => `<footer class="site">Material de estudio elaborado a partir de los documentos de la carpeta de lecturas del curso. Los textos originales no se publican. <a href="#/metodologia">Cómo se construyó</a>.</footer>`;

  function setTitle(t) { document.title = t ? `${t} · Lecturas de paz` : "Lecturas de paz"; }
  function render(html, title) {
    main.innerHTML = html + footer();
    setTitle(title);
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- carga ---------- */
  async function load() {
    const get = (u) => fetch(u, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
    const [curso, metodo, ...lects] = await Promise.all([
      get("data/curso.json"), get("data/metodologia.json"),
      ...ORDEN.map((id) => get(`data/lecturas/${id}.json`)),
    ]);
    state.curso = curso; state.metodo = metodo;
    lects.forEach((l) => { state.lect[l.id] = l; });
    state.lista = lects;
    curso.ejes.forEach((e) => { EJES_NOMBRE[e.id] = e.nombre; });
  }

  /* ---------- navegación lateral ---------- */
  function buildNav() {
    $("#navModulos").innerHTML = state.curso.modulos.map((m) => `
      <a href="#/modulo/${m.id}" data-nav="modulo/${m.id}"><span class="dot" style="background:${COLOR_MOD[m.id]}"></span>${esc(m.nombre)}</a>
      ${m.lecturas.map((x) => `<a class="sub" href="#/lectura/${x.id}" data-nav="lectura/${x.id}" data-mod="${m.id}">${esc(cita(L(x.id)))}</a>`).join("")}
    `).join("");
  }
  function markNav(route) {
    $$(".sidebar a").forEach((a) => a.classList.toggle("active", a.dataset.nav === route || (route === "" && a.dataset.nav === "inicio")));
  }

  /* ---------- vistas ---------- */
  function vInicio() {
    const c = state.curso, read = leidas();
    const nConc = state.lista.reduce((n, l) => n + l.conceptos.length, 0);
    const nPreg = state.lista.reduce((n, l) => n + l.preguntas.length, 0);
    const flow = c.modulos.map((m, i) => {
      const ids = [...new Set(m.lecturas.map((x) => x.id))];
      const done = ids.filter((id) => read[id]).length;
      return `
        <div class="flow-step">
          <div class="flow-bar" style="background:${COLOR_MOD[m.id]}"></div>
          <a class="card" href="#/modulo/${m.id}">
            <div class="eyebrow">${esc(m.nombre)} · ${esc(m.tema)}</div>
            <div class="flow-q">${esc(m.pregunta)}</div>
            <div class="muted small">${ids.map((id) => esc(cita(L(id)))).join(" · ")}${m.pendientes ? ` · <span class="tag pend">${m.pendientes.length} pendiente</span>` : ""}</div>
            <div class="progress" aria-label="${done} de ${ids.length} lecturas marcadas"><span style="width:${ids.length ? (done / ids.length) * 100 : 0}%"></span></div>
          </a>
        </div>
        ${m.abre ? `<div class="flow-link">Deja abierta la pregunta: ${esc(m.abre)}</div>` : ""}`;
    }).join("");
    render(`
      <section class="hero">
        <div class="eyebrow">Curso de construcción de paz y reconciliación</div>
        <h1>${esc(c.titulo)}</h1>
        <p class="lead">Fichas, comparaciones y ejercicios construidos a partir de las lecturas del curso. El recorrido va de definir la paz a pensar cómo convivir después del daño.</p>
        <div class="stats">
          <div class="stat"><b>${state.lista.length}</b><span>lecturas analizadas</span></div>
          <div class="stat"><b>${nConc}</b><span>conceptos con página</span></div>
          <div class="stat"><b>${c.debates.length}</b><span>debates entre autores</span></div>
          <div class="stat"><b>${nPreg}</b><span>preguntas de repaso</span></div>
        </div>
      </section>
      <h2>El hilo del curso</h2>
      <p class="muted">Cada bloque deja abierta la pregunta que responde el siguiente. La barra muestra cuántas lecturas marcaste como leídas.</p>
      <div class="flow">${flow}</div>
      <h2>Cómo usar este sitio</h2>
      <div class="grid grid-3">
        <a class="card" href="#/modulo/M1-2"><h3>Leer por módulo</h3><p class="muted small">Cada lectura tiene tesis, conceptos con página, lo evidente, lo no evidente, citas y preguntas.</p></a>
        <a class="card" href="#/ejes"><h3>Comparar autores</h3><p class="muted small">Seis ejes transversales y un mapa de conexiones entre las lecturas.</p></a>
        <a class="card" href="#/talleres"><h3>Preparar talleres</h3><p class="muted small">Guías paso a paso con espacio para escribir. Lo que escribes se guarda en tu navegador.</p></a>
        <a class="card" href="#/repaso"><h3>Repasar</h3><p class="muted small">Tarjetas con preguntas de examen y su pauta de respuesta.</p></a>
      </div>
      <div class="notice" style="margin-top:24px"><span>El interruptor <b>Inferencias</b>, arriba a la derecha, oculta o muestra las interpretaciones y conexiones que no están en los textos. Apágalo para ver solo lo que dicen los autores.</span></div>
    `, "");
  }

  function lecturaCard(id, alcance) {
    const l = L(id), read = leidas()[id];
    return `<a class="card" href="#/lectura/${id}">
      <div class="tags">${l.modulos.map(modTag).join("")}${l.tipo === "complementaria" ? `<span class="tag comp">Complementaria</span>` : ""}${read ? `<span class="tag">Leída</span>` : ""}</div>
      <h3>${esc(cita(l))}</h3>
      <p class="small" style="margin-bottom:6px"><i>${esc(l.titulo)}</i></p>
      <p class="muted small">${esc(l.resumen)}</p>
      ${alcance ? `<p class="small muted" style="margin:0">${esc(alcance)}</p>` : ""}
    </a>`;
  }

  function vModulo(id) {
    const m = state.curso.modulos.find((x) => x.id === id);
    if (!m) return vNoEncontrado();
    const taller = m.taller && state.curso.talleres.find((t) => t.id === m.taller);
    const debates = state.curso.debates.filter((d) => d.posiciones.some((p) => m.lecturas.some((x) => x.id === p.lectura)));
    render(`
      <div class="eyebrow" style="color:${COLOR_MOD[m.id]}">${esc(m.nombre)}</div>
      <h1>${esc(m.tema)}</h1>
      <p class="lead">${esc(m.pregunta)}</p>
      <p>${esc(m.descripcion)}</p>
      <h2>Lecturas</h2>
      <div class="grid grid-2">${m.lecturas.map((x) => lecturaCard(x.id, x.alcance)).join("")}
        ${(m.pendientes || []).map((p) => `<div class="card"><div class="tags"><span class="tag pend">Pendiente</span></div><p class="small">${esc(p.referencia)}</p><p class="muted small" style="margin:0">${esc(p.motivo)}</p></div>`).join("")}
      </div>
      ${taller ? `<h2>Taller del módulo</h2><a class="card" href="#/talleres/${taller.id}"><h3>${esc(taller.titulo)}</h3><p class="muted small" style="margin:0">${esc(taller.consigna[0])}</p></a>` : ""}
      ${debates.length ? `<h2>Debates donde participan estas lecturas</h2><div class="grid grid-2">${debates.map((d) => `<a class="card" href="#/debates/${d.id}"><h3>${esc(d.titulo)}</h3><p class="muted small" style="margin:0">${d.posiciones.map((p) => esc(cita(L(p.lectura)))).join(" · ")}</p></a>`).join("")}</div>` : ""}
      ${m.abre ? `<div class="notice" style="margin-top:24px">Pregunta puente hacia el siguiente módulo: ${esc(m.abre)}</div>` : ""}
    `, m.nombre);
  }

  function vLectura(id, tab) {
    const l = L(id);
    if (!l) return vNoEncontrado();
    const read = leidas();
    const tabs = [
      ["resumen", "Resumen"], ["conceptos", `Conceptos (${l.conceptos.length})`], ["analisis", "Evidente y no evidente"],
      ["citas", "Citas"], ["cruces", "Cruces"], ["preguntas", "Preguntas"], ["ejes", "Ejes"],
    ];
    const cur = tabs.some((t) => t[0] === tab) ? tab : "resumen";
    const pos = ORDEN.indexOf(id), prev = L(ORDEN[pos - 1]), next = L(ORDEN[pos + 1]);
    render(`
      <div class="reading-head">
        <div>
          <div class="tags">${l.modulos.map(modTag).join("")}${l.tipo === "complementaria" ? `<span class="tag comp">Complementaria</span>` : ""}<span class="tag">${l.formato === "escaneado" ? "PDF escaneado" : "PDF digital"}</span></div>
          <h1>${esc(l.autorCorto)} (${l.anio})</h1>
          <p class="lead" style="margin-bottom:0"><i>${esc(l.titulo)}</i></p>
        </div>
        <label class="btn read-toggle"><input type="checkbox" id="readChk" ${read[id] ? "checked" : ""}> Marcar como leída</label>
      </div>
      <dl class="meta-list">
        <dt>Autor/a</dt><dd>${esc(l.autor)}</dd>
        ${l.obra ? `<dt>Obra</dt><dd>${esc(l.obra)}</dd>` : ""}
        ${l.editorial ? `<dt>Editorial</dt><dd>${esc(l.editorial)}</dd>` : ""}
        <dt>Páginas</dt><dd>${esc(l.paginas)}</dd>
        <dt>Cómo se leyó</dt><dd>${esc(l.metodoLectura)}</dd>
      </dl>
      ${l.notaPaginas ? `<div class="notice"><span><b>Sobre el rango:</b> ${esc(l.notaPaginas)}</span></div>` : ""}
      <div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${k === cur}" data-tab="${k}">${t}</button>`).join("")}</div>
      <div id="tabBody">${tabBody(l, cur)}</div>
      <nav class="reading-nav" aria-label="Lecturas anterior y siguiente">
        ${prev ? `<a class="btn" href="#/lectura/${prev.id}">← ${esc(cita(prev))}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#/lectura/${next.id}">${esc(cita(next))} →</a>` : "<span></span>"}
      </nav>
    `, cita(l));
    $("#readChk").addEventListener("change", (e) => { const r = leidas(); r[id] = e.target.checked; store.set("leidas", r); });
    $$(".tabs button").forEach((b) => b.addEventListener("click", () => {
      $$(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
      $("#tabBody").innerHTML = tabBody(l, b.dataset.tab);
      history.replaceState(null, "", `#/lectura/${id}/${b.dataset.tab}`);
      bindCopy();
    }));
    bindCopy();
  }

  function tabBody(l, t) {
    if (t === "resumen") return `
      <h2 style="margin-top:0">Tesis</h2><div class="thesis">${esc(l.tesis)}</div>
      <h2>Estructura</h2><ol class="structure">${l.estructura.map((s) => `<li><span>${esc(s.seccion)}</span>${pag(s.paginas)}</li>`).join("")}</ol>
      <h2>Palabras clave</h2><div class="tags">${l.palabrasClave.map((k) => `<span class="tag">${esc(k)}</span>`).join("")}</div>`;
    if (t === "conceptos") return `<div class="concepts">${l.conceptos.map((c) => `
      <div class="concept"><div class="concept-head"><b>${esc(c.termino)}</b>${pag(c.pagina)}</div><div class="small">${esc(c.definicion)}</div></div>`).join("")}</div>`;
    if (t === "analisis") return `
      <h2 style="margin-top:0">Lo evidente</h2><p class="muted small">Lo que el texto dice de forma explícita.</p>
      <div class="note-list">${l.evidente.map((e) => `<div class="note"><p>${esc(e)}</p></div>`).join("")}</div>
      <h2>Lo no evidente</h2><p class="muted small">Supuestos, tensiones internas, silencios y límites. Lo marcado como inferencia es interpretación, no está en el texto.</p>
      <div class="note-list">${l.noEvidente.map((n) => `<div class="note${infCls(n.inferencia)}"><h4>${esc(n.titulo)} ${infTag(n.inferencia)}</h4><p>${esc(n.texto)}</p></div>`).join("")}</div>`;
    if (t === "citas") return `<p class="muted small">Citas textuales breves con su página. ${l.formato === "escaneado" ? "Este texto es un escaneo: coteja la cita con el PDF antes de usarla." : ""}</p>
      <div class="grid">${l.citas.map((c) => `<figure class="quote" style="margin:0"><div>${esc(c.texto)}</div><footer>${esc(cita(l))}, p. ${esc(c.pagina)}</footer>
        <div class="quote-tools"><button class="copy-btn" data-copy="${esc(`"${c.texto}" (${l.autorCorto}, ${l.anio}, p. ${c.pagina})`)}">Copiar con referencia</button></div></figure>`).join("")}</div>`;
    if (t === "cruces") return `<p class="muted small">Cómo dialoga esta lectura con las demás del curso.</p>
      <div class="note-list">${l.cruces.map((c) => `<div class="note${infCls(c.inferencia)}"><h4>${linkL(c.con)} ${infTag(c.inferencia)}</h4><p>${esc(c.texto)}</p></div>`).join("")}</div>
      <p class="small" style="margin-top:14px"><a href="#/mapa/${l.id}">Ver en el mapa de conexiones</a></p>`;
    if (t === "preguntas") return `${l.preguntas.map((p, i) => `<details class="qa"${i === 0 ? " open" : ""}><summary>${esc(p.pregunta)}</summary><div class="qa-body">${esc(p.orientacion)}</div></details>`).join("")}
      <p class="small"><a href="#/repaso/${l.id}">Repasar estas preguntas como tarjetas</a></p>`;
    if (t === "ejes") return `<div class="axis-grid">${state.curso.ejes.map((e) => `<div class="axis-card${l.ejes[e.id] ? "" : " empty"}"><h4>${esc(e.nombre)}</h4><p class="small" style="margin:0">${esc(l.ejes[e.id] || "La lectura no trata este eje.")}</p></div>`).join("")}</div>
      <p class="small" style="margin-top:14px"><a href="#/ejes">Comparar con las demás lecturas</a></p>`;
    return "";
  }

  function bindCopy() {
    $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copiada"; }
      catch { b.textContent = "No se pudo copiar"; }
      setTimeout(() => { b.textContent = "Copiar con referencia"; }, 1600);
    }));
  }

  function vEjes(eje) {
    const ejes = state.curso.ejes;
    const cur = ejes.some((e) => e.id === eje) ? eje : (eje === "matriz" ? "matriz" : ejes[0].id);
    const chips = `<div class="chip-row" role="group" aria-label="Elegir eje">${ejes.map((e) => `<a class="chip${e.id === cur ? " active" : ""}" href="#/ejes/${e.id}">${esc(e.nombre)}</a>`).join("")}<a class="chip${cur === "matriz" ? " active" : ""}" href="#/ejes/matriz">Matriz completa</a></div>`;
    let body;
    if (cur === "matriz") {
      body = `<div class="matrix-wrap"><table class="matrix"><thead><tr><th>Eje</th>${state.lista.map((l) => `<th><a href="#/lectura/${l.id}">${esc(cita(l))}</a></th>`).join("")}</tr></thead>
        <tbody>${ejes.map((e) => `<tr><th>${esc(e.nombre)}</th>${state.lista.map((l) => l.ejes[e.id] ? `<td>${esc(l.ejes[e.id])}</td>` : `<td class="na">No lo trata</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    } else {
      const e = ejes.find((x) => x.id === cur);
      body = `<p class="lead">${esc(e.pregunta)}</p>
        ${state.curso.modulos.map((m) => {
          const ids = [...new Set(m.lecturas.map((x) => x.id))].filter((id) => !(id === "lederach1998" && m.id === "M5-7"));
          if (!ids.length) return "";
          return `<h3 style="margin-top:22px;color:${COLOR_MOD[m.id]}">${esc(m.nombre)} · ${esc(m.tema)}</h3>
            <div class="axis-grid">${ids.map((id) => { const l = L(id), t = l.ejes[cur]; return `<div class="axis-card${t ? "" : " empty"}" style="border-top-color:${COLOR_MOD[m.id]}"><h4><a href="#/lectura/${id}/ejes">${esc(cita(l))}</a></h4><p class="small" style="margin:0">${esc(t || "No lo trata.")}</p></div>`; }).join("")}</div>`;
        }).join("")}`;
    }
    render(`<div class="eyebrow">Comparar</div><h1>Ejes transversales</h1>
      <p class="muted">Seis preguntas que atraviesan todas las lecturas. Sirven para preguntas comparativas de examen y para ordenar un ensayo.</p>${chips}${body}`, "Ejes transversales");
  }

  function vMapa(focus) {
    const W = 760, H = 620, cx = W / 2, cy = H / 2 + 10, R = 230;
    const nodes = state.lista.map((l, i) => {
      const a = -Math.PI / 2 + (i / state.lista.length) * Math.PI * 2;
      return { l, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a };
    });
    const pos = Object.fromEntries(nodes.map((n) => [n.l.id, n]));
    const edges = new Map();
    state.lista.forEach((l) => l.cruces.forEach((c) => {
      if (!pos[c.con] || c.con === l.id) return;
      const k = [l.id, c.con].sort().join("|");
      const e = edges.get(k) || { a: l.id, b: c.con, inf: true, n: 0 };
      e.n++; if (!c.inferencia) e.inf = false;
      edges.set(k, e);
    }));
    const edgeSvg = [...edges.values()].map((e) => {
      const A = pos[e.a], B = pos[e.b];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const qx = mx + (cx - mx) * 0.35, qy = my + (cy - my) * 0.35;
      return `<path class="map-edge${e.inf ? " inf" : ""}" data-a="${e.a}" data-b="${e.b}" d="M${A.x.toFixed(1)} ${A.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}" stroke-width="${1 + e.n * 0.6}"/>`;
    }).join("");
    const nodeSvg = nodes.map((n) => {
      const right = Math.cos(n.a) >= -0.01;
      const tx = n.x + (right ? 18 : -18), anchor = Math.abs(Math.cos(n.a)) < 0.2 ? "middle" : (right ? "start" : "end");
      const ty = Math.abs(Math.cos(n.a)) < 0.2 ? (Math.sin(n.a) < 0 ? n.y - 22 : n.y + 30) : n.y + 4;
      const deg = edgesOf(n.l.id).length;
      return `<g class="map-node" data-id="${n.l.id}" tabindex="0" role="button" aria-label="${esc(cita(n.l))}">
        <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${10 + deg * 1.2}" fill="${COLOR_MOD[n.l.modulos[0]]}"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${esc(n.l.autorCorto)} <tspan class="yr">${n.l.anio}</tspan></text></g>`;
    }).join("");
    function edgesOf(id) { return [...edges.values()].filter((e) => e.a === id || e.b === id); }
    render(`<div class="eyebrow">Comparar</div><h1>Mapa de conexiones</h1>
      <p class="muted">Cada línea une dos lecturas que dialogan según las fichas. La línea punteada indica que la conexión es interpretativa, sin cita directa en el texto. Selecciona una lectura para ver sus vínculos.</p>
      <div class="legend">${state.curso.modulos.map((m) => `<span><i style="background:${COLOR_MOD[m.id]}"></i>${esc(m.nombre)}</span>`).join("")}<span><span class="ln"></span>Con base en el texto</span><span><span class="ln dash"></span>Interpretativa</span></div>
      <div class="map-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Red de conexiones entre las lecturas">${edgeSvg}${nodeSvg}</svg></div>
      <div id="mapDetail" class="map-detail"></div>`, "Mapa de conexiones");
    const select = (id) => {
      $$(".map-node").forEach((g) => g.classList.toggle("dim", id && g.dataset.id !== id && !edgesOf(id).some((e) => e.a === g.dataset.id || e.b === g.dataset.id)));
      $$(".map-edge").forEach((p) => { const on = id && (p.dataset.a === id || p.dataset.b === id); p.classList.toggle("hl", !!on); p.classList.toggle("dim", !!id && !on); });
      if (!id) { $("#mapDetail").innerHTML = ""; return; }
      const l = L(id);
      const salientes = l.cruces.map((c) => `<div class="note${infCls(c.inferencia)}"><h4>${esc(l.autorCorto)} → ${linkL(c.con)} ${infTag(c.inferencia)}</h4><p class="small">${esc(c.texto)}</p></div>`).join("");
      const entrantes = state.lista.flatMap((o) => o.cruces.filter((c) => c.con === id).map((c) => `<div class="note${infCls(c.inferencia)}"><h4>${linkL(o.id)} → ${esc(l.autorCorto)} ${infTag(c.inferencia)}</h4><p class="small">${esc(c.texto)}</p></div>`)).join("");
      $("#mapDetail").innerHTML = `<div class="card"><div class="tags">${l.modulos.map(modTag).join("")}</div><h3><a href="#/lectura/${id}">${esc(cita(l))}</a></h3><p class="small muted">${esc(l.resumen)}</p>
        <h4 style="font-family:var(--sans)">Lo que esta lectura dice de otras</h4><div class="note-list">${salientes || '<p class="muted small">Sin cruces registrados.</p>'}</div>
        <h4 style="font-family:var(--sans);margin-top:16px">Lo que otras fichas dicen de esta</h4><div class="note-list">${entrantes || '<p class="muted small">Ninguna.</p>'}</div></div>`;
      history.replaceState(null, "", `#/mapa/${id}`);
    };
    $$(".map-node").forEach((g) => {
      g.addEventListener("click", () => select(g.dataset.id));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(g.dataset.id); } });
    });
    if (focus && L(focus)) select(focus);
  }

  function vDebates(anchor) {
    const d = state.curso.debates;
    render(`<div class="eyebrow">Comparar</div><h1>Debates entre autores</h1>
      <p class="muted">Cada debate enfrenta a dos o más lecturas. Una respuesta sólida presenta las posiciones con su página, señala qué supone cada una y toma partido con un caso colombiano.</p>
      ${d.map((x, i) => `<section class="card debate" id="${x.id}"><div class="eyebrow">Debate ${i + 1}</div><h2 style="margin-top:0">${esc(x.titulo)}</h2>
        <div class="positions">${x.posiciones.map((p) => `<div class="position">${linkL(p.lectura)}<div class="small">${esc(p.postura)}</div></div>`).join("")}</div>
        <div class="key${infCls(x.inferencia)}"><b>Argumento clave.</b> ${esc(x.clave)} ${infTag(x.inferencia)}</div></section>`).join("")}`, "Debates");
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); }
  }

  function vTalleres() {
    render(`<div class="eyebrow">Practicar</div><h1>Talleres</h1>
      <p class="muted">Cada taller pide aplicar un marco a un caso de tu experiencia. La guía indica qué herramienta usar en cada paso y de qué lectura sale. Lo que escribas se guarda en este navegador y puedes descargarlo.</p>
      <div class="grid grid-2">${state.curso.talleres.map((t) => `<a class="card" href="#/talleres/${t.id}"><div class="tags">${modTag(t.modulo)}${t.aviso ? `<span class="tag pend">Falta una lectura</span>` : ""}</div><h3>${esc(t.titulo)}</h3><p class="muted small" style="margin:0">${esc(t.consigna[0])}</p></a>`).join("")}</div>`, "Talleres");
  }

  function vTaller(id) {
    const t = state.curso.talleres.find((x) => x.id === id);
    if (!t) return vNoEncontrado();
    const saved = store.get("taller:" + id, {});
    const src = (fs) => `<div class="src-links">${fs.map((f) => `<span class="tag">${linkL(f.id)}${f.paginas ? `, ${/^\d/.test(f.paginas) ? "pp. " : ""}${esc(f.paginas)}` : ""}</span>`).join("")}</div>`;
    let body = "";
    if (t.pasos) body += `<h2>Guía paso a paso</h2><div class="steps">${t.pasos.map((p) => `<div class="card step"><label for="f-${p.campo}">${esc(p.etiqueta)}</label><div class="hint">${esc(p.herramienta)}</div>${src(p.fuentes)}<textarea id="f-${p.campo}" data-field="${p.campo}" placeholder="Escribe aquí tu análisis…">${esc(saved[p.campo] || "")}</textarea></div>`).join("")}</div>`;
    if (t.matriz) body += `<h2>Matriz de estrategias</h2><p class="muted small">Tabla 1 de ${linkL(t.matriz.fuente.id)}, pp. ${esc(t.matriz.fuente.paginas)}. Marca qué estrategias despliega la iniciativa y con qué acciones.</p>
      <div class="table-wrap"><table class="data matrix-form"><thead><tr><th>Estrategia</th><th>¿La despliega?</th><th>Acciones concretas</th><th>¿Requiere aliados externos?</th></tr></thead><tbody>
      ${t.matriz.estrategias.map((s, i) => `<tr><td>${i + 1}. ${esc(s)}</td>
        <td><select data-field="m${i}-si"><option value=""></option>${["Sí", "Parcialmente", "No"].map((o) => `<option${saved[`m${i}-si`] === o ? " selected" : ""}>${o}</option>`).join("")}</select></td>
        <td><textarea data-field="m${i}-acc" style="min-height:56px">${esc(saved[`m${i}-acc`] || "")}</textarea></td>
        <td><select data-field="m${i}-al"><option value=""></option>${["Sí", "No"].map((o) => `<option${saved[`m${i}-al`] === o ? " selected" : ""}>${o}</option>`).join("")}</select></td></tr>`).join("")}
      </tbody></table></div>`;
    if (t.aproximaciones) body += `<h2>Base para comparar aproximaciones</h2><div class="steps">${t.aproximaciones.map((a, i) => `<div class="card step"><label for="a-${i}">${esc(a.nombre)}</label><div class="hint">${esc(a.idea)}</div>${src([a.fuente])}<textarea id="a-${i}" data-field="a${i}" placeholder="Ubicación en el espectro de Verdeja y qué dice sobre el perdón…">${esc(saved["a" + i] || "")}</textarea></div>`).join("")}</div>`;
    body += `<h2>Conclusión del grupo</h2><textarea data-field="conclusion" placeholder="Síntesis para la presentación…">${esc(saved.conclusion || "")}</textarea>`;
    render(`<div class="tags">${modTag(t.modulo)}</div><h1>${esc(t.titulo)}</h1>
      <h2>Consigna</h2><ol class="consigna">${t.consigna.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
      ${t.aviso ? `<div class="notice danger"><span>${esc(t.aviso)}</span></div>` : ""}
      ${t.pista ? `<div class="notice"><span><b>Pista.</b> ${esc(t.pista)}</span></div>` : ""}
      ${body}
      <p class="saved" id="savedMsg" aria-live="polite"></p>
      <div class="btn-row"><button class="btn primary" id="dlBtn">Descargar mis respuestas (.md)</button><button class="btn" id="printBtn">Imprimir</button><button class="btn" id="clearBtn">Borrar respuestas</button></div>`, t.titulo);
    let timer;
    const collect = () => Object.fromEntries($$("[data-field]").map((el) => [el.dataset.field, el.value]));
    $$("[data-field]").forEach((el) => el.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { store.set("taller:" + id, collect()); $("#savedMsg").textContent = "Guardado en este navegador"; }, 400);
    }));
    $("#printBtn").addEventListener("click", () => window.print());
    $("#clearBtn").addEventListener("click", () => {
      if (!confirm("¿Borrar todas las respuestas de este taller?")) return;
      store.set("taller:" + id, {}); vTaller(id);
    });
    $("#dlBtn").addEventListener("click", () => {
      const v = collect();
      let md = `# ${t.titulo}\n\n`;
      (t.pasos || []).forEach((p) => { md += `## ${p.etiqueta}\n\n${v[p.campo] || "_(sin responder)_"}\n\n`; });
      if (t.matriz) {
        md += `## Matriz de estrategias (García Durán, 2023, pp. 47-48)\n\n| Estrategia | ¿La despliega? | Acciones | ¿Aliados externos? |\n| --- | --- | --- | --- |\n`;
        t.matriz.estrategias.forEach((s, i) => { md += `| ${s} | ${v[`m${i}-si`] || ""} | ${(v[`m${i}-acc`] || "").replace(/\n/g, " ")} | ${v[`m${i}-al`] || ""} |\n`; });
        md += "\n";
      }
      (t.aproximaciones || []).forEach((a, i) => { md += `## ${a.nombre}\n\n${a.idea}\n\n${v["a" + i] || "_(sin responder)_"}\n\n`; });
      md += `## Conclusión\n\n${v.conclusion || "_(sin responder)_"}\n`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
      a.download = `${t.id}.md`; a.click(); URL.revokeObjectURL(a.href);
    });
  }

  function vRepaso(filtro) {
    const all = state.lista.flatMap((l) => l.preguntas.map((p, i) => ({ ...p, l, key: `${l.id}:${i}` })));
    const mods = state.curso.modulos.map((m) => m.id);
    const f = filtro || "todas";
    let deck = all.filter((c) => f === "todas" || c.l.modulos.includes(f) || c.l.id === f);
    const known = store.get("sabidas", {});
    let order = deck.map((_, i) => i), idx = 0;
    render(`<div class="eyebrow">Practicar</div><h1>Repaso</h1>
      <p class="muted">Lee la pregunta, responde en voz alta o por escrito y luego voltea la tarjeta para ver la pauta. Marca las que ya dominas.</p>
      <div class="chip-row"><a class="chip${f === "todas" ? " active" : ""}" href="#/repaso">Todas (${all.length})</a>${mods.map((m) => `<a class="chip${f === m ? " active" : ""}" href="#/repaso/${m}">${esc(state.curso.modulos.find((x) => x.id === m).nombre)}</a>`).join("")}${L(f) ? `<a class="chip active" href="#/repaso/${f}">${esc(cita(L(f)))}</a>` : ""}</div>
      <div class="flash-wrap"><div class="flash" id="flash" tabindex="0" role="button" aria-label="Voltear tarjeta"></div></div>
      <div class="flash-controls">
        <button class="btn" id="prevC">← Anterior</button><button class="btn" id="flipC">Voltear</button><button class="btn" id="nextC">Siguiente →</button>
        <button class="btn" id="shufC">Barajar</button><button class="btn primary" id="knowC">La domino</button>
      </div>
      <p class="score" id="score"></p>`, "Repaso");
    const flash = $("#flash");
    const show = () => {
      if (!deck.length) { flash.innerHTML = `<div class="flash-face"><p class="flash-q">No hay preguntas en este filtro.</p></div>`; return; }
      const c = deck[order[idx]];
      flash.classList.remove("flipped");
      flash.innerHTML = `<div class="flash-face"><div class="flash-meta"><span>${esc(cita(c.l))}</span><span>${idx + 1} / ${deck.length}${known[c.key] ? " · dominada" : ""}</span></div><p class="flash-q">${esc(c.pregunta)}</p><div class="flash-meta"><span>Toca o pulsa espacio para voltear</span></div></div>
        <div class="flash-face back"><div class="flash-meta"><span>Pauta de respuesta</span><a href="#/lectura/${c.l.id}/preguntas">Ver ficha</a></div><p style="margin:auto 0">${esc(c.orientacion)}</p></div>`;
      const n = deck.filter((x) => known[x.key]).length;
      $("#score").textContent = `Dominas ${n} de ${deck.length} preguntas de este grupo.`;
    };
    const flip = () => flash.classList.toggle("flipped");
    flash.addEventListener("click", (e) => { if (!e.target.closest("a")) flip(); });
    flash.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
    $("#flipC").onclick = flip;
    $("#nextC").onclick = () => { idx = (idx + 1) % deck.length; show(); };
    $("#prevC").onclick = () => { idx = (idx - 1 + deck.length) % deck.length; show(); };
    $("#shufC").onclick = () => { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } idx = 0; show(); };
    $("#knowC").onclick = () => { const c = deck[order[idx]]; known[c.key] = !known[c.key]; store.set("sabidas", known); show(); };
    show();
  }

  function vGlosario() {
    const items = state.lista.flatMap((l) => l.conceptos.map((c) => ({ ...c, l }))).sort((a, b) => norm(a.termino).localeCompare(norm(b.termino)));
    render(`<div class="eyebrow">Comparar</div><h1>Glosario</h1>
      <p class="muted">Todos los conceptos de las fichas, con su autor y página. Un mismo término puede aparecer en varias lecturas con sentidos distintos.</p>
      <div class="grid" style="grid-template-columns:1fr 220px;gap:10px"><input type="search" id="gq" placeholder="Filtrar conceptos…" aria-label="Filtrar conceptos">
      <select id="gl" aria-label="Filtrar por lectura"><option value="">Todas las lecturas</option>${state.lista.map((l) => `<option value="${l.id}">${esc(cita(l))}</option>`).join("")}</select></div>
      <p class="small muted" id="gcount"></p><div id="glist" class="gloss-list"></div>`, "Glosario");
    const draw = () => {
      const q = norm($("#gq").value), lid = $("#gl").value;
      const f = items.filter((c) => (!lid || c.l.id === lid) && (!q || norm(c.termino + " " + c.definicion).includes(q)));
      $("#gcount").textContent = `${f.length} conceptos`;
      let last = "";
      $("#glist").innerHTML = f.map((c) => {
        const ch = norm(c.termino).charAt(0).toUpperCase();
        const head = ch !== last ? `<div class="letter">${esc(ch)}</div>` : ""; last = ch;
        return `${head}<div class="gloss-item"><div><b>${esc(c.termino)}</b><div class="small">${linkL(c.l.id)} ${c.pagina ? `· p. ${esc(c.pagina)}` : ""}</div></div><div class="small">${esc(c.definicion)}</div></div>`;
      }).join("");
    };
    $("#gq").addEventListener("input", draw); $("#gl").addEventListener("change", draw); draw();
  }

  function vErrores() {
    render(`<div class="eyebrow">Practicar</div><h1>Errores frecuentes</h1>
      <p class="muted">Confusiones comunes al citar o atribuir ideas de las lecturas, con la versión correcta.</p>
      ${state.curso.errores.map((e) => `<div class="err"><div class="bad">${esc(e.error)}</div><div class="good">${esc(e.correcto)} ${e.lectura ? `<span class="small">(${linkL(e.lectura)})</span>` : ""}</div></div>`).join("")}`, "Errores frecuentes");
  }

  function vMetodologia() {
    const m = state.metodo;
    render(`<div class="eyebrow">Sobre este sitio</div><h1>Metodología</h1>
      <p class="lead">${esc(m.proposito)}</p>
      <h2>Cómo se construyó el contenido</h2>
      <div class="method-steps">${m.pasos.map((p) => `<div class="method-step"><div><h3>${esc(p.titulo)}</h3><p class="small" style="margin:0">${esc(p.texto)}</p></div></div>`).join("")}</div>
      <h2>Trazabilidad: de dónde sale cada ficha</h2>
      <p class="muted small">Archivo de la carpeta, páginas usadas y forma de lectura. Los PDF no se publican.</p>
      <div class="table-wrap"><table class="data"><thead><tr><th>Lectura</th><th>Archivo fuente</th><th>Formato</th><th>Páginas del PDF</th><th>Páginas impresas</th><th>Observación</th></tr></thead><tbody>
      ${m.fuentes.map((f) => `<tr><td>${linkL(f.id)}</td><td class="small">${esc(f.archivo)} <span class="muted">(${f.paginasPdf} pp.)</span></td><td>${esc(f.formato)}</td><td>${esc(f.rangoPdf)}</td><td>${esc(f.rangoImpreso)}</td><td class="small">${esc(f.observacion)}</td></tr>`).join("")}
      </tbody></table></div>
      <h2>Estructura de cada ficha</h2>
      <p class="small">Todas las lecturas comparten el mismo esquema, lo que permite compararlas: referencia y rango de páginas, tesis, estructura, conceptos con página, lo evidente, lo no evidente (marcado si es inferencia), citas breves, cruces con otras lecturas, preguntas con pauta de respuesta y una síntesis en seis ejes.</p>
      <h2>Convenciones</h2>
      <ul class="small"><li>Las páginas son siempre las impresas en la edición usada.</li><li>La etiqueta <span class="tag inf">Inferencia</span> marca interpretaciones o conexiones que no están en el texto. El interruptor de la barra superior las oculta.</li><li>Las citas tienen como máximo 20 palabras y llevan su página.</li><li>Las conexiones entre lecturas se dibujan en el mapa con línea continua si se apoyan en el texto y punteada si son interpretativas.</li></ul>
      <h2>Limitaciones</h2>
      <ul class="small">${m.limitaciones.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`, "Metodología");
  }

  function vNoEncontrado() {
    render(`<h1>No encontramos esa página</h1><p><a href="#/">Volver al inicio</a></p>`, "No encontrado");
  }

  /* ---------- búsqueda ---------- */
  let index = [];
  function buildIndex() {
    const add = (kind, title, text, href) => index.push({ kind, title, text, href, n: norm(title + " " + text) });
    state.lista.forEach((l) => {
      add("Lectura", `${cita(l)}: ${l.titulo}`, l.resumen + " " + l.tesis + " " + l.palabrasClave.join(" "), `#/lectura/${l.id}`);
      l.conceptos.forEach((c) => add(`Concepto · ${cita(l)}`, c.termino, c.definicion, `#/lectura/${l.id}/conceptos`));
      l.noEvidente.forEach((c) => add(`No evidente · ${cita(l)}`, c.titulo, c.texto, `#/lectura/${l.id}/analisis`));
      l.preguntas.forEach((c) => add(`Pregunta · ${cita(l)}`, c.pregunta, c.orientacion, `#/lectura/${l.id}/preguntas`));
      l.citas.forEach((c) => add(`Cita · ${cita(l)}`, c.texto, `p. ${c.pagina}`, `#/lectura/${l.id}/citas`));
    });
    state.curso.debates.forEach((d) => add("Debate", d.titulo, d.clave + " " + d.posiciones.map((p) => p.postura).join(" "), `#/debates/${d.id}`));
    state.curso.talleres.forEach((t) => add("Taller", t.titulo, t.consigna.join(" "), `#/talleres/${t.id}`));
    state.curso.errores.forEach((e) => add("Error frecuente", e.error, e.correcto, "#/errores"));
  }
  function snippet(text, terms) {
    const nt = norm(text); let i = -1;
    for (const t of terms) { i = nt.indexOf(t); if (i >= 0) break; }
    const start = Math.max(0, i - 50), s = text.slice(start, start + 150);
    let out = esc((start > 0 ? "…" : "") + s + (start + 150 < text.length ? "…" : ""));
    terms.forEach((t) => { if (t.length > 2) out = out.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>"); });
    return out;
  }
  function search(q) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index.map((r) => {
      if (!terms.every((t) => r.n.includes(t))) return null;
      const nt = norm(r.title);
      const score = terms.reduce((s, t) => s + (nt.includes(t) ? 3 : 1), 0) + (r.kind.startsWith("Concepto") ? 1 : 0);
      return { ...r, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 40).map((r) => ({ ...r, snip: snippet(r.text, terms) }));
  }
  const modal = $("#searchModal"), sInput = $("#searchInput"), sRes = $("#searchResults");
  function openSearch() { modal.hidden = false; sInput.value = ""; sRes.innerHTML = `<p class="muted small" style="padding:8px">Escribe al menos una palabra. La búsqueda ignora tildes.</p>`; sInput.focus(); }
  function closeSearch() { modal.hidden = true; }
  sInput.addEventListener("input", () => {
    const r = search(sInput.value);
    sRes.innerHTML = r.length ? r.map((x, i) => `<a href="${x.href}" class="${i === 0 ? "sel" : ""}"><span class="r-kind">${esc(x.kind)}</span><br><b>${esc(x.title)}</b><span class="r-snip">${x.snip}</span></a>`).join("")
      : `<p class="muted small" style="padding:8px">${sInput.value.trim() ? "Sin resultados." : ""}</p>`;
  });
  sInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const a = $("a", sRes); if (a) { location.hash = a.getAttribute("href"); closeSearch(); } }
  });
  sRes.addEventListener("click", (e) => { if (e.target.closest("a")) closeSearch(); });
  modal.addEventListener("click", (e) => { if (e.target === modal) closeSearch(); });
  $("#searchBtn").addEventListener("click", openSearch);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
    if (e.key === "Escape") { closeSearch(); closeMenu(); }
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName) && modal.hidden) { e.preventDefault(); openSearch(); }
  });

  /* ---------- tema, inferencias y menú ---------- */
  const root = document.documentElement;
  const theme = store.get("tema", null);
  if (theme) root.dataset.theme = theme;
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark"; store.set("tema", root.dataset.theme);
  });
  const inf = $("#infToggle");
  inf.checked = store.get("inferencias", true);
  document.body.classList.toggle("hide-inf", !inf.checked);
  inf.addEventListener("change", () => { document.body.classList.toggle("hide-inf", !inf.checked); store.set("inferencias", inf.checked); });
  const sidebar = $("#sidebar"), scrim = $("#scrim"), menuBtn = $("#menuBtn");
  function closeMenu() { sidebar.classList.remove("open"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn.addEventListener("click", () => { const o = !sidebar.classList.contains("open"); sidebar.classList.toggle("open", o); scrim.hidden = !o; menuBtn.setAttribute("aria-expanded", String(o)); });
  scrim.addEventListener("click", closeMenu);

  /* ---------- enrutador ---------- */
  function route() {
    closeMenu();
    const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const [a, b, c] = parts;
    markNav(a === "lectura" || a === "modulo" ? `${a}/${b}` : (a === "talleres" ? "talleres" : (a || "")));
    if (!a) return vInicio();
    if (a === "modulo") return vModulo(b);
    if (a === "lectura") return vLectura(b, c);
    if (a === "ejes") return vEjes(b);
    if (a === "mapa") return vMapa(b);
    if (a === "debates") return vDebates(b);
    if (a === "talleres") return b ? vTaller(b) : vTalleres();
    if (a === "repaso") return vRepaso(b);
    if (a === "glosario") return vGlosario();
    if (a === "errores") return vErrores();
    if (a === "metodologia") return vMetodologia();
    return vNoEncontrado();
  }

  load().then(() => {
    buildNav(); buildIndex();
    window.addEventListener("hashchange", route);
    route();
  }).catch((err) => {
    main.innerHTML = `<h1>No se pudieron cargar los datos</h1><p class="muted">Si abriste el archivo directamente desde tu computador, el navegador bloquea la lectura de los datos. Ábrelo desde un servidor local o desde GitHub Pages.</p><p class="small muted">${esc(err.message)}</p>`;
  });
})();
