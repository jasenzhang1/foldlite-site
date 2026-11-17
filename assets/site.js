// Foldlight storefront script. Plain JS, no build step.
//
// ============================ SHOP SETTINGS ============================
// Edit these four values to turn on prices, checkout and sign-ups.
const SITE = {
  // Kit price in US dollars, e.g. 129. Leave null to show "Price announced at launch".
  price: null,
  // Stripe Payment Link (https://buy.stripe.com/...). While empty, "Buy" buttons become
  // "Reserve" and go to the sign-up form. Set the link's success URL to .../thanks.html?order=1
  checkoutUrl: "",
  // Form endpoint for sign-ups, e.g. "https://formspree.io/f/abcd1234". GitHub Pages can't
  // receive forms itself, so this must be set before sign-ups work there.
  waitlistEndpoint: "",
  // Public contact email, shown in the footer and used as a fallback for reservations.
  contactEmail: "",
};
// ======================================================================

(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- prices / buy
  const priceText = SITE.price ? `$${SITE.price}` : "Price announced at launch";
  $$("[data-price]").forEach(el => { el.textContent = priceText; });
  $$("[data-buy]").forEach(el => {
    if (SITE.checkoutUrl) {
      el.href = SITE.checkoutUrl;
      el.textContent = el.dataset.buy || "Buy the kit";
      el.rel = "noopener";
    } else {
      el.href = el.dataset.reserveHref || "#reserve";
      el.textContent = el.dataset.reserve || "Reserve your kit";
    }
  });
  $$("[data-when-checkout]").forEach(el => { el.hidden = !SITE.checkoutUrl; });
  $$("[data-when-reserve]").forEach(el => { el.hidden = !!SITE.checkoutUrl; });

  // ---------------------------------------------------------------- footer
  $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
  $$("[data-contact]").forEach(el => {
    if (SITE.contactEmail) { el.href = `mailto:${SITE.contactEmail}`; el.textContent = SITE.contactEmail; }
    else el.remove();
  });

  // ---------------------------------------------------------------- sign-up forms
  $$("form.waitlist").forEach(form => {
    const status = $(".status", form);
    const btn = $("button[type=submit]", form);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (form.company && form.company.value) return; // bot trap
      const data = new FormData(form);
      data.set("signed_up_at", new Date().toISOString());
      data.set("page", location.pathname.split("/").pop() || "index.html");
      const onNetlify = /\.netlify\.app$/.test(location.hostname);

      if (!SITE.waitlistEndpoint && !onNetlify) {
        status.className = "status err";
        if (SITE.contactEmail) {
          status.innerHTML = "";
          status.append("Online sign-up isn't open yet. ");
          const a = document.createElement("a");
          a.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Reserve a Foldlight kit")}&body=${encodeURIComponent("Please add " + (data.get("email") || "me") + " to the list.")}`;
          a.textContent = "Email us to reserve";
          status.append(a, ".");
        } else {
          status.textContent = "Online sign-up isn't open yet. Please check back soon.";
        }
        return;
      }

      btn.disabled = true;
      status.className = "status";
      status.textContent = "Adding you…";
      try {
        const res = SITE.waitlistEndpoint
          ? await fetch(SITE.waitlistEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          : await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString() });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.className = "status ok";
        status.textContent = "You're on the list. We'll email you when Drop 01 opens.";
      } catch (err) {
        status.className = "status err";
        status.textContent = "Something went wrong. Please try again in a minute.";
      } finally {
        btn.disabled = false;
      }
    });
  });

  // ---------------------------------------------------------------- shop filters
  const filterBar = $("[data-filters]");
  if (filterBar) {
    filterBar.addEventListener("click", e => {
      const b = e.target.closest("button[data-filter]");
      if (!b) return;
      $$("button", filterBar).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      const f = b.dataset.filter;
      $$("[data-kind]").forEach(t => { t.hidden = f !== "all" && t.dataset.kind !== f; });
    });
  }

  // ================================================================ drawing
  // Triangle-Edge Icosahedron: an icosahedron whose 20 faces are each made of
  // 3 kite-shaped pieces. Built with a vertex pointing straight down, where the
  // 5 collar units leave the opening that sits in the base's pocket.
  const ICO = (() => {
    const V = [[0, 1, 0]];
    const h = 1 / Math.sqrt(5), r = 2 / Math.sqrt(5);
    for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5; V.push([r * Math.cos(a), h, r * Math.sin(a)]); }
    for (let k = 0; k < 5; k++) { const a = (k + 0.5) * 2 * Math.PI / 5; V.push([r * Math.cos(a), -h, r * Math.sin(a)]); }
    V.push([0, -1, 0]);
    const F = [];
    for (let k = 0; k < 5; k++) {
      const u = 1 + k, u1 = 1 + (k + 1) % 5, l = 6 + k, l1 = 6 + (k + 1) % 5;
      F.push([0, u1, u], [u, u1, l], [l, u1, l1], [11, l, l1]);
    }
    // split each face into 3 kites around a slightly raised centre
    const kites = [];
    const add = (a, b) => a.map((x, i) => x + b[i]), sc = (a, s) => a.map(x => x * s);
    F.forEach((f, fi) => {
      const [A, B, C] = f.map(i => V[i]);
      const c = sc(add(add(A, B), C), 1 / 3 * 1.08); // raise the centre a little
      const m = (p, q) => sc(add(p, q), 0.5);
      const mAB = m(A, B), mBC = m(B, C), mCA = m(C, A);
      kites.push({ f: fi, pts: [A, mAB, c, mCA] }, { f: fi, pts: [B, mBC, c, mAB] }, { f: fi, pts: [C, mCA, c, mBC] });
    });
    return { V, F, kites };
  })();

  const mix = (c1, c2, t) => {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), b = p(c2);
    return "#" + a.map((x, i) => Math.round(x + (b[i] - x) * t).toString(16).padStart(2, "0")).join("");
  };
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  // Draws the shade into <g>. R = circumradius in px. angle = spin about the vertical axis.
  function drawShade(g, cx, cy, R, angle, tilt, lit, id) {
    while (g.firstChild) g.removeChild(g.firstChild);
    const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(tilt), st = Math.sin(tilt);
    const T = ([x, y, z]) => {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      return [x1, y * ct - z1 * st, y * st + z1 * ct];
    };
    const L = [-0.35, 0.55, 0.75], Ln = Math.hypot(...L);
    const items = ICO.kites.map(k => {
      const P = k.pts.map(T);
      const d1 = P[2].map((v, i) => v - P[0][i]), d2 = P[3].map((v, i) => v - P[1][i]);
      let n = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]];
      const cen = P.reduce((s, p) => s.map((v, i) => v + p[i] / 4), [0, 0, 0]);
      if (n[0] * cen[0] + n[1] * cen[1] + n[2] * cen[2] < 0) n = n.map(v => -v);
      const nl = Math.hypot(...n); n = n.map(v => v / nl);
      return { P, n, depth: cen[2], front: n[2] > 0 };
    }).sort((a, b) => a.depth - b.depth);

    const pts = P => P.map(p => `${(cx + p[0] * R).toFixed(1)},${(cy - p[1] * R).toFixed(1)}`).join(" ");
    let glowDrawn = false;
    items.forEach(it => {
      if (it.front && !glowDrawn && lit) {
        el("circle", { cx, cy, r: R * 0.62, fill: `url(#bulbGlow${id})` }, g);
        glowDrawn = true;
      }
      const key = Math.max(0, (it.n[0] * L[0] + it.n[1] * L[1] + it.n[2] * L[2]) / Ln);
      let fill, op;
      if (lit) {
        // translucent film lit from inside: brightest where it faces us, warmer at grazing angles
        const t = Math.min(1, 0.25 + 0.55 * it.n[2] + 0.3 * key);
        fill = mix("#e9a24e", "#fff7e6", t);
        op = it.front ? 0.93 : 0.28;
      } else {
        const t = 0.35 + 0.6 * key;
        fill = mix("#cfc7bb", "#fbf8f2", t);
        op = it.front ? 1 : 0;
      }
      el("polygon", {
        points: pts(it.P), fill, "fill-opacity": op.toFixed(2),
        stroke: lit ? (it.front ? "#fffaf0" : "#f0b46a") : "#b9b0a3",
        "stroke-opacity": it.front ? "0.75" : "0.25", "stroke-width": (R * 0.006).toFixed(2), "stroke-linejoin": "round",
      }, g);
    });
  }

  function defsFor(svg, id) {
    const d = el("defs", {}, svg);
    d.innerHTML = `
      <radialGradient id="bulbGlow${id}"><stop offset="0" stop-color="#fffdf5" stop-opacity="1"/><stop offset=".45" stop-color="#ffe6b0" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>
      <radialGradient id="halo${id}"><stop offset="0" stop-color="#ffd18a" stop-opacity=".42"/><stop offset=".55" stop-color="#ffb860" stop-opacity=".12"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>
      <linearGradient id="baseBody${id}" x1="0" x2="1"><stop offset="0" stop-color="#bdb6ac"/><stop offset=".35" stop-color="#ece7df"/><stop offset=".7" stop-color="#f8f5f0"/><stop offset="1" stop-color="#cfc8be"/></linearGradient>
      <radialGradient id="baseTop${id}" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff1d6"/><stop offset=".6" stop-color="#f6f1e9"/><stop offset="1" stop-color="#e6e0d6"/></radialGradient>
      <radialGradient id="pool${id}"><stop offset="0" stop-color="#ffcf80" stop-opacity=".22"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>`;
  }

  // The base: Ø200 × 60 mm white cylinder with 7 speed buttons under engraved arrows.
  function drawBase(g, cx, topY, rx, h, id, opts = {}) {
    const ry = rx * 0.24;
    if (opts.pool !== false) el("ellipse", { cx, cy: topY + h + ry * 0.4, rx: rx * 1.9, ry: ry * 1.5, fill: `url(#pool${id})` }, g);
    el("ellipse", { cx, cy: topY + h + 3, rx: rx * 1.01, ry: ry * 1.02, fill: "#000", "fill-opacity": ".16" }, g);
    el("path", { d: `M${cx - rx},${topY} L${cx - rx},${topY + h} A${rx},${ry} 0 0 0 ${cx + rx},${topY + h} L${cx + rx},${topY} Z`, fill: `url(#baseBody${id})` }, g);
    el("ellipse", { cx, cy: topY, rx, ry, fill: `url(#baseTop${id})` }, g);
    // pocket ring where the shade sits
    el("ellipse", { cx, cy: topY, rx: rx * 0.36, ry: ry * 0.36, fill: "#d9d2c7", stroke: "#c6beb2", "stroke-width": 1 }, g);
    // speed buttons on the front, following the curve of the cylinder
    const n = 7, span = 0.62;
    const by = topY + h * 0.55;
    for (let i = 0; i < n; i++) {
      const u = (i - 3) / 3 * span;                 // -span..span of the half-width
      const x = cx + u * rx;
      const y = by + ry * Math.sqrt(1 - u * u) - ry;
      const w = rx * 0.07 * Math.sqrt(1 - u * u * 0.8);
      el("ellipse", { cx: x, cy: y + 1.2, rx: w, ry: w * 0.62, fill: "#00000022" }, g);
      el("ellipse", { cx: x, cy: y, rx: w, ry: w * 0.62, fill: i === 3 ? "#8d877f" : "#d8d3cc", stroke: "#a9a299", "stroke-width": .8 }, g);
    }
    // engraved arrows  <-- 0 -->
    const ay = by - h * 0.28 + ry * 0.92 - ry;
    const ink = { stroke: "#a39b90", "stroke-width": Math.max(1, rx * 0.012), fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
    const ax0 = cx - span * rx, ax1 = cx - rx * 0.08, bx0 = cx + rx * 0.08, bx1 = cx + span * rx;
    el("path", { d: `M${ax1},${ay} L${ax0},${ay} m${rx * 0.05},-${rx * 0.03} l-${rx * 0.05},${rx * 0.03} l${rx * 0.05},${rx * 0.03}`, ...ink }, g);
    el("path", { d: `M${bx0},${ay} L${bx1},${ay} m-${rx * 0.05},-${rx * 0.03} l${rx * 0.05},${rx * 0.03} l-${rx * 0.05},${rx * 0.03}`, ...ink }, g);
    const t = el("text", { x: cx, y: ay + rx * 0.022, "text-anchor": "middle", "font-family": "Inter, sans-serif", "font-size": rx * 0.075, "font-weight": 600, fill: "#a39b90" }, g);
    t.textContent = "0";
  }

  // Full lamp scene in a 440 × 520 viewBox.
  function lampScene(svg, id, opts = {}) {
    svg.setAttribute("viewBox", "0 0 440 520");
    defsFor(svg, id);
    const cx = 220, baseRx = 150, baseH = 90, baseTop = 400;
    // Shade swept diameter ≈ base diameter (8 in shade, Ø200 mm base).
    // With a vertex pointing down, the widest ring sits at r = 2/√5 of the circumradius.
    const R = (baseRx * 203.2 / 200) / (2 / Math.sqrt(5));
    const tilt = 0.26;
    const cy = baseTop - R * Math.cos(tilt) + 6;
    if (opts.lit !== false) el("circle", { cx, cy, r: R * 1.75, fill: `url(#halo${id})` }, svg);
    drawBase(el("g", {}, svg), cx, baseTop, baseRx, baseH, id);
    const shade = el("g", {}, svg);
    const draw = a => drawShade(shade, cx, cy, R, a, tilt, opts.lit !== false, id);
    draw(opts.angle ?? 0.3);
    return draw;
  }

  // ---------------------------------------------------------------- hero lamp + speed buttons
  const hero = $("#hero-lamp");
  if (hero) {
    const draw = lampScene(hero, "h");
    const SPEEDS = [5, 2.5, 1, 0, -1, -2.5, -5];   // turns/min, + = clockwise seen from above (same as the firmware)
    let target = 1, rpm = reduceMotion ? 0 : 1, angle = 0.3, last = performance.now();
    const readout = $("#speed-readout");
    const label = v => v === 0 ? "Stopped" : `${Math.abs(v)} turn${Math.abs(v) === 1 ? "" : "s"}/min, ${v > 0 ? "clockwise" : "counter-clockwise"}`;
    const btns = $$("#speed-buttons button");
    const select = v => {
      target = v;
      btns.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.rpm === v)));
      if (readout) readout.textContent = label(v);
      if (reduceMotion) { rpm = v; }
    };
    btns.forEach(b => b.addEventListener("click", () => select(+b.dataset.rpm)));
    select(reduceMotion ? 0 : 1);
    if (reduceMotion && readout) readout.textContent = "Animation paused (reduced motion is on)";
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const accel = 1.5 * dt;                         // turns/min per second, like the base
      rpm += Math.max(-accel, Math.min(accel, target - rpm));
      // clockwise from above moves the front of the shade to the left
      angle -= rpm / 60 * 2 * Math.PI * dt;
      draw(angle);
      requestAnimationFrame(tick);
    };
    if (!reduceMotion) requestAnimationFrame(tick);
    else draw(angle);
  }

  // ---------------------------------------------------------------- static art (tiles, gallery)
  let artId = 0;
  function renderArt(svg) {
    const kind = svg.dataset.art, id = "a" + (artId++);
    if (kind === "lamp") { lampScene(svg, id, { angle: +(svg.dataset.angle || 0.3) }); return; }
    if (kind === "lamp-off") { lampScene(svg, id, { lit: false, angle: 0.5 }); return; }
    if (kind === "shade") {
      svg.setAttribute("viewBox", "0 0 200 200");
      defsFor(svg, id);
      el("circle", { cx: 100, cy: 100, r: 98, fill: `url(#halo${id})` }, svg);
      drawShade(el("g", {}, svg), 100, 100, 82, +(svg.dataset.angle || 0.4), 0.3, true, id);
      return;
    }
    if (kind === "base") {
      svg.setAttribute("viewBox", "0 0 440 300");
      defsFor(svg, id);
      drawBase(el("g", {}, svg), 220, 110, 190, 110, id, { pool: false });
      return;
    }
    if (kind === "kit") { drawKit(svg); return; }
  }

  // Kit contents: a fan of half-square (1 × 2) film units, the QR instruction card, and the base.
  function drawKit(svg) {
    svg.setAttribute("viewBox", "0 0 440 360");
    const g = el("g", {}, svg);
    const id = "k" + (artId++);
    defsFor(svg, id);
    drawBase(el("g", {}, g), 322, 238, 96, 58, id, { pool: false });
    for (let i = 0; i < 7; i++) {
      const a = -34 + i * 9;
      const sheet = el("g", { transform: `translate(118 290) rotate(${a}) translate(-34 -190)` }, g);
      el("rect", { x: 0, y: 0, width: 68, height: 136, rx: 2, fill: "#fbf8f2", "fill-opacity": ".92", stroke: "#d5ccbf", "stroke-width": 1 }, sheet);
    }
    const lbl = el("text", { x: 118, y: 334, "text-anchor": "middle", "font-family": "Fraunces, Georgia, serif", "font-size": 22, "font-weight": 600, fill: "currentColor" }, g);
    lbl.textContent = "30 scored units";
    // QR card
    const card = el("g", { transform: "translate(276 34) rotate(6)" }, g);
    el("rect", { x: 0, y: 0, width: 110, height: 140, rx: 6, fill: "#fff", stroke: "#d5ccbf" }, card);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const finder = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      if (finder || ((r * 7 + c * 3 + r * c) % 3 === 0)) el("rect", { x: 19 + c * 8, y: 18 + r * 8, width: 7, height: 7, fill: "#2b2420" }, card);
    }
    const t1 = el("text", { x: 55, y: 112, "text-anchor": "middle", "font-family": "Inter, sans-serif", "font-size": 11, "font-weight": 600, fill: "#2b2420" }, card);
    t1.textContent = "PDF + video";
    const t2 = el("text", { x: 55, y: 127, "text-anchor": "middle", "font-family": "Inter, sans-serif", "font-size": 9, fill: "#7a6f64" }, card);
    t2.textContent = "folding guide";
  }

  $$("svg[data-art]").forEach(renderArt);

  // ---------------------------------------------------------------- product gallery
  const main = $("#gallery-main");
  if (main) {
    const thumbs = $$("[data-view]");
    thumbs.forEach(b => b.addEventListener("click", () => {
      thumbs.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      const svg = document.createElementNS(NS, "svg");
      svg.dataset.art = b.dataset.view;
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", b.getAttribute("aria-label"));
      main.className = "main " + (b.dataset.view === "lamp" || b.dataset.view === "shade" ? "night" : "alt");
      main.replaceChildren(svg);
      renderArt(svg);
    }));
  }
})();
