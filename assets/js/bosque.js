/* ════════════════════════════════════════════════════════════
   EL BOSQUE — escenario procedural en canvas 2D
   Sin librerías. Capas de árboles, haces de luz, niebla,
   esporas y luciérnagas que reaccionan al cursor.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var lienzo = document.getElementById('bosque');
  if (!lienzo) return;
  var ctx = lienzo.getContext('2d', { alpha: false });
  if (!ctx) return;

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, DPR = 1;
  var capas = [];          // siluetas de árboles precalculadas
  var suelos = [];         // maleza anclada al borde inferior
  var haces = [];          // haces de luz
  var nieblas = [];        // bancos de niebla
  var motas = [];          // esporas + luciérnagas
  var chispa = {};         // sprites de partícula
  var raton = { x: -9999, y: -9999, vivo: false };
  var t0 = performance.now();
  var scroll = 0, scrollObj = 0;
  var corriendo = true;
  var lazo = 0;

  /* ── utilidades ─────────────────────────────────────────── */

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function sprite(color, tam) {
    var c = document.createElement('canvas');
    c.width = c.height = tam;
    var g = c.getContext('2d');
    var r = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
    g.fillStyle = r;
    r.addColorStop(0, color.replace('ALFA', '1'));
    r.addColorStop(0.18, color.replace('ALFA', '.55'));
    r.addColorStop(0.45, color.replace('ALFA', '.12'));
    r.addColorStop(1, color.replace('ALFA', '0'));
    g.fillRect(0, 0, tam, tam);
    return c;
  }

  /* ── árboles ────────────────────────────────────────────── */

  function rama(g, x, y, largo, ang, grosor, prof, cfg) {
    if (prof <= 0 || largo < 3) return;
    var x2 = x + Math.cos(ang) * largo;
    var y2 = y + Math.sin(ang) * largo;
    // curvatura leve: los árboles rectos no existen
    var cx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * largo * rnd(-0.14, 0.14);
    var cy = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * largo * rnd(-0.14, 0.14);

    g.lineWidth = grosor;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(cx, cy, x2, y2);
    g.stroke();

    if (prof <= 2 && cfg.hoja > 0) {
      follaje(g, x2, y2, cfg.hoja * rnd(0.55, 1.05), cfg.color, cfg.hojas || 4);
    }
    if (prof <= 1) return;

    var hijas = prof > 4 ? 2 : (Math.random() < 0.68 ? 2 : 3);
    for (var i = 0; i < hijas; i++) {
      var giro = rnd(0.2, 0.6) * (i % 2 === 0 ? -1 : 1) + rnd(-0.14, 0.14);
      rama(g, x2, y2, largo * rnd(0.66, 0.82), ang + giro,
        Math.max(0.7, grosor * 0.6), prof - 1, cfg);
    }
  }

  function follaje(g, x, y, r, color, n) {
    g.fillStyle = color;
    var cuantos = n || 10;
    for (var i = 0; i < cuantos; i++) {
      var a = rnd(0, Math.PI * 2), d = rnd(0, r * 0.75);
      g.beginPath();
      g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d,
        rnd(r * 0.34, r * 0.72), rnd(r * 0.24, r * 0.5), rnd(0, Math.PI), 0, Math.PI * 2);
      g.fill();
    }
  }

  // maleza y suelo: cierra la composición por abajo
  function sotobosque(g, cfg, ancho, base) {
    g.fillStyle = cfg.color;
    var paso = Math.max(18, cfg.hoja * 0.7);
    for (var x = -40; x < ancho + 40; x += paso) {
      var alto = cfg.suelo * rnd(0.45, 1.25);
      var px = x + rnd(-paso * 0.4, paso * 0.4);
      g.beginPath();
      g.moveTo(px - alto * 0.34, base);
      g.quadraticCurveTo(px - alto * 0.1, base - alto * 0.72, px + rnd(-alto * .4, alto * .4), base - alto);
      g.quadraticCurveTo(px + alto * 0.16, base - alto * 0.6, px + alto * 0.34, base);
      g.closePath();
      g.fill();
    }
    g.fillRect(-40, base - cfg.suelo * 0.22, ancho + 80, cfg.suelo * 0.22 + 60);
  }

  function construirCapa(cfg) {
    var alto = H + 460;
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(W * DPR));
    c.height = Math.max(1, Math.floor(alto * DPR));
    var g = c.getContext('2d');
    g.scale(DPR, DPR);
    g.strokeStyle = cfg.color;
    g.lineCap = 'round';
    g.lineJoin = 'round';

    // dosel: banda achatada que cuelga del borde superior
    g.fillStyle = cfg.color;
    var paso = cfg.dosel * 0.32;
    for (var dx = -cfg.dosel; dx < W + cfg.dosel; dx += paso) {
      var bx = dx + rnd(-paso * 0.5, paso * 0.5);
      var by = rnd(-cfg.dosel * 0.7, cfg.dosel * 0.12);
      var br = rnd(cfg.dosel * 0.55, cfg.dosel);
      for (var q = 0; q < 5; q++) {
        g.beginPath();
        g.ellipse(bx + rnd(-br * 0.5, br * 0.5), by + rnd(-br * 0.3, br * 0.34),
          rnd(br * 0.6, br * 1.15), rnd(br * 0.22, br * 0.42), rnd(-0.25, 0.25), 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillRect(0, -cfg.dosel * 1.2, W, cfg.dosel * 0.85);

    // troncos
    var n = Math.max(2, Math.round(W / cfg.sep));
    for (var i = 0; i <= n; i++) {
      var x = (i / n) * W + rnd(-cfg.sep * 0.42, cfg.sep * 0.42);
      rama(g, x, alto + 40, alto * rnd(cfg.tronco * 0.82, cfg.tronco * 1.15) * 0.34,
        -Math.PI / 2 + rnd(-0.05, 0.05), cfg.grosor, cfg.prof, cfg);
    }

    return { lienzo: c, vel: cfg.vel, alto: alto };
  }

  // el suelo se queda bajo los pies: lienzo aparte, anclado abajo
  function construirSuelo(cfg) {
    var alto = Math.ceil(cfg.suelo * 1.6) + 30;
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(W * DPR));
    c.height = Math.max(1, Math.floor(alto * DPR));
    var g = c.getContext('2d');
    g.scale(DPR, DPR);
    sotobosque(g, cfg, W, alto);
    return { lienzo: c, alto: alto };
  }

  /* ── construcción ───────────────────────────────────────── */

  function medir() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    lienzo.width = Math.floor(W * DPR);
    lienzo.height = Math.floor(H * DPR);
    lienzo.style.width = W + 'px';
    lienzo.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function poblar() {
    var area = W * H;
    var densidad = quieto ? 0 : clamp(Math.round(area / 16000), 26, 96);

    var estrecho = W < 760;
    var cfgs = [
      { color: 'rgba(18,38,29,.55)', sep: estrecho ? 110 : 96,  dosel: 92,  grosor: 3,  prof: 5, tronco: 1.1,  hoja: 15, hojas: 3, suelo: 26,  vel: .07 },
      { color: 'rgba(11,26,20,.85)', sep: estrecho ? 160 : 145, dosel: 140, grosor: 7,  prof: 6, tronco: 1.45, hoja: 26, hojas: 4, suelo: 46,  vel: .16 },
      { color: 'rgba(6,16,12,.96)',  sep: estrecho ? 250 : 235, dosel: 190, grosor: 14, prof: 6, tronco: 1.9,  hoja: 40, hojas: 5, suelo: 74,  vel: .31 },
      { color: 'rgba(2,6,4,1)',      sep: estrecho ? 360 : 470, dosel: 250, grosor: 32, prof: 5, tronco: 2.6,  hoja: 58, hojas: 5, suelo: 116, vel: .55 }
    ];
    capas = cfgs.map(construirCapa);
    suelos = cfgs.map(construirSuelo);

    haces = [];
    var nh = W < 700 ? 3 : 5;
    for (var i = 0; i < nh; i++) {
      haces.push({
        x: rnd(-0.1, 1.05) * W,
        ancho: rnd(W * 0.05, W * 0.17),
        ang: rnd(0.14, 0.34),
        alfa: rnd(0.025, 0.07),
        fase: rnd(0, 6.28),
        vel: rnd(0.00007, 0.00017)
      });
    }

    nieblas = [];
    for (var j = 0; j < 5; j++) {
      nieblas.push({
        x: rnd(0, W), y: rnd(H * 0.35, H * 1.05),
        r: rnd(H * 0.22, H * 0.58),
        a: rnd(0.02, 0.055),
        vx: rnd(-0.09, 0.09),
        fase: rnd(0, 6.28)
      });
    }

    motas = [];
    for (var k = 0; k < densidad; k++) motas.push(nuevaMota(false));
  }

  function nuevaMota(explosion, px, py) {
    var luciernaga = Math.random() < 0.34;
    return {
      x: explosion ? px + rnd(-16, 16) : rnd(0, W),
      y: explosion ? py + rnd(-16, 16) : rnd(0, H),
      vx: explosion ? rnd(-2.6, 2.6) : rnd(-0.12, 0.12),
      vy: explosion ? rnd(-2.6, 2.6) : rnd(-0.28, -0.04),
      r: luciernaga ? rnd(1.6, 3.4) : rnd(0.7, 1.8),
      luz: luciernaga,
      fase: rnd(0, 6.28),
      pulso: rnd(0.0007, 0.0024),
      vaiven: rnd(0.0003, 0.0011),
      amp: rnd(6, 26),
      base: 0,
      vida: explosion ? rnd(2600, 5200) : Infinity,
      edad: 0
    };
  }

  /* ── dibujo ─────────────────────────────────────────────── */

  function fondo(prof) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgb(' + Math.round(9 - prof * 5) + ',' + Math.round(24 - prof * 13) + ',' + Math.round(19 - prof * 10) + ')');
    g.addColorStop(0.38, 'rgb(' + Math.round(6 - prof * 3) + ',' + Math.round(15 - prof * 8) + ',' + Math.round(12 - prof * 6) + ')');
    g.addColorStop(1, 'rgb(' + Math.round(2) + ',' + Math.round(5 - prof * 2) + ',' + Math.round(4 - prof * 1) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // resplandor del claro
    var r = ctx.createRadialGradient(W * 0.52, -H * 0.12, 0, W * 0.52, -H * 0.12, H * (1.05 - prof * 0.3));
    r.addColorStop(0, 'rgba(224,168,80,' + (0.16 - prof * 0.12).toFixed(3) + ')');
    r.addColorStop(0.5, 'rgba(120,155,92,' + (0.05 - prof * 0.04).toFixed(3) + ')');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
  }

  function dibujarHaces(t, prof) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < haces.length; i++) {
      var h = haces[i];
      var sway = Math.sin(t * h.vel + h.fase) * 0.05;
      var a = h.ang + sway;
      var alfa = h.alfa * (1 - prof * 0.75) * (0.75 + Math.sin(t * h.vel * 2.2 + h.fase) * 0.25);
      if (alfa <= 0.001) continue;
      ctx.save();
      ctx.translate(h.x, -40);
      ctx.rotate(a);
      var g = ctx.createLinearGradient(0, 0, 0, H * 1.35);
      g.addColorStop(0, 'rgba(240,205,140,' + alfa.toFixed(4) + ')');
      g.addColorStop(0.45, 'rgba(200,175,105,' + (alfa * 0.45).toFixed(4) + ')');
      g.addColorStop(1, 'rgba(160,190,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-h.ancho * 0.28, 0);
      ctx.lineTo(h.ancho * 0.28, 0);
      ctx.lineTo(h.ancho * 0.85, H * 1.35);
      ctx.lineTo(-h.ancho * 0.85, H * 1.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function dibujarNiebla(t, prof) {
    ctx.save();
    for (var i = 0; i < nieblas.length; i++) {
      var n = nieblas[i];
      var x = n.x + Math.sin(t * 0.00006 + n.fase) * 90 + n.vx * t * 0.02;
      x = ((x % (W + 600)) + (W + 600)) % (W + 600) - 300;
      var y = n.y - prof * 120;
      var a = n.a * (1 + prof * 1.5);
      var g = ctx.createRadialGradient(x, y, 0, x, y, n.r);
      g.addColorStop(0, 'rgba(120,160,135,' + a.toFixed(4) + ')');
      g.addColorStop(0.55, 'rgba(90,130,110,' + (a * 0.4).toFixed(4) + ')');
      g.addColorStop(1, 'rgba(60,90,75,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, n.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  function moverMotas(t, dt) {
    for (var i = motas.length - 1; i >= 0; i--) {
      var m = motas[i];
      m.edad += dt;
      if (m.vida !== Infinity && m.edad > m.vida) { motas.splice(i, 1); continue; }

      m.x += m.vx + Math.sin(t * m.vaiven + m.fase) * 0.36;
      m.y += m.vy;
      m.vx *= 0.986;
      if (m.vida !== Infinity) m.vy = m.vy * 0.986 - 0.004;

      // atracción suave hacia el cursor
      if (raton.vivo && m.luz) {
        var dx = raton.x - m.x, dy = raton.y - m.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 52900 && d2 > 1) {
          var f = (1 - Math.sqrt(d2) / 230) * 0.055;
          m.vx += dx * f * 0.02;
          m.vy += dy * f * 0.02;
        }
      }

      if (m.y < -40) { m.y = H + 20; m.x = rnd(0, W); }
      if (m.y > H + 60) { m.y = -20; m.x = rnd(0, W); }
      if (m.x < -60) m.x = W + 40;
      if (m.x > W + 60) m.x = -40;
    }
  }

  function dibujarMotas(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < motas.length; i++) {
      var m = motas[i];
      var brillo = m.luz
        ? 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * m.pulso + m.fase)), 2)
        : 0.22 + 0.18 * Math.sin(t * m.vaiven * 2 + m.fase);
      if (m.vida !== Infinity) brillo *= clamp(1 - m.edad / m.vida, 0, 1);
      if (brillo <= 0.01) continue;
      var s = m.luz ? chispa.ambar : chispa.jade;
      var tam = m.r * (m.luz ? 13 : 8);
      ctx.globalAlpha = clamp(brillo * (m.luz ? 0.85 : 0.5), 0, 1);
      ctx.drawImage(s, m.x - tam / 2, m.y - tam / 2, tam, tam);
    }
    ctx.restore();
  }

  /* ── bucle ──────────────────────────────────────────────── */

  var tPrev = 0;

  function cuadro(ahora) {
    lazo = requestAnimationFrame(cuadro);
    if (!corriendo) { tPrev = ahora; return; }
    var dt = Math.min(ahora - tPrev, 50);
    tPrev = ahora;
    var t = ahora - t0;

    // profundidad: cuanto más abajo, más hondo el bosque
    var maxS = Math.max(1, document.body.scrollHeight - window.innerHeight);
    scrollObj = clamp(window.scrollY / maxS, 0, 1);
    scroll += (scrollObj - scroll) * 0.07;
    var prof = scroll;

    fondo(prof);
    dibujarHaces(t, prof);

    for (var i = 0; i < capas.length; i++) {
      var c = capas[i];
      var off = -window.scrollY * c.vel * 0.42;
      off = clamp(off, -(c.alto - H), 0);
      ctx.drawImage(c.lienzo, 0, off, W, c.alto);
    }

    for (var j = 0; j < suelos.length; j++) {
      ctx.drawImage(suelos[j].lienzo, 0, H - suelos[j].alto, W, suelos[j].alto);
    }

    dibujarNiebla(t, prof);
    if (!quieto) moverMotas(t, dt);
    dibujarMotas(t);

    // penumbra: al dejar el umbral el bosque se cierra y el texto respira
    var salida = clamp(window.scrollY / (H * 0.85), 0, 1);
    var velo = salida * 0.42 + prof * 0.12;
    if (velo > 0.01) {
      ctx.fillStyle = 'rgba(2,6,4,' + velo.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function unCuadro() {
    fondo(0);
    dibujarHaces(0, 0);
    for (var i = 0; i < capas.length; i++) ctx.drawImage(capas[i].lienzo, 0, 0, W, capas[i].alto);
    for (var j = 0; j < suelos.length; j++) ctx.drawImage(suelos[j].lienzo, 0, H - suelos[j].alto, W, suelos[j].alto);
    dibujarNiebla(0, 0);
    dibujarMotas(0);
  }

  /* ── arranque ───────────────────────────────────────────── */

  function iniciar() {
    chispa.ambar = sprite('rgba(255,196,102,ALFA)', 64);
    chispa.jade = sprite('rgba(178,232,196,ALFA)', 48);
    medir();
    poblar();
    if (quieto) { unCuadro(); return; }
    tPrev = performance.now();
    lazo = requestAnimationFrame(cuadro);
  }

  var temporizador;
  var anchoPrev = window.innerWidth;
  window.addEventListener('resize', function () {
    // en móviles la barra de direcciones cambia el alto: sólo reconstruir si cambia el ancho
    var mismoAncho = Math.abs(window.innerWidth - anchoPrev) < 2;
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      anchoPrev = window.innerWidth;
      medir();
      if (!mismoAncho || Math.abs(H - window.innerHeight) > 160) poblar();
      if (quieto) unCuadro();
    }, 220);
  }, { passive: true });

  window.addEventListener('pointermove', function (e) {
    raton.x = e.clientX; raton.y = e.clientY; raton.vivo = true;
  }, { passive: true });
  window.addEventListener('pointerleave', function () { raton.vivo = false; });

  document.addEventListener('visibilitychange', function () {
    corriendo = !document.hidden;
  });

  /* API para los secretos del bosque */
  window.Bosque = {
    enjambre: function (cuantas, x, y) {
      if (quieto) return;
      var n = cuantas || 46;
      var px = x === undefined ? W / 2 : x;
      var py = y === undefined ? H / 2 : y;
      for (var i = 0; i < n; i++) motas.push(nuevaMota(true, px, py));
    },
    luciernagas: function () {
      if (quieto) return;
      for (var i = 0; i < 34; i++) {
        var m = nuevaMota(false);
        m.luz = true; m.r = rnd(2, 3.8);
        motas.push(m);
      }
    },
    quieto: quieto
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
