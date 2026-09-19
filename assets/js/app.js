/* ════════════════════════════════════════════════════════════
   EL BOSQUE — interacción
   Sendero, susurros, revelados, secretos y sonido ambiental.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Brindis (avisos) ───────────────────────────────────── */

  var brindis = $('#brindis'), brindisT;
  function avisar(texto, ms) {
    if (!brindis) return;
    brindis.textContent = texto;
    brindis.classList.add('ver');
    clearTimeout(brindisT);
    brindisT = setTimeout(function () { brindis.classList.remove('ver'); }, ms || 3400);
  }

  /* ── Datos vivos: años, reloj ───────────────────────────── */

  var anios = new Date().getFullYear() - 2012;
  $$('[data-anios]').forEach(function (n) { n.textContent = anios; });
  var contExp = $('#anios-exp');
  if (contExp) contExp.setAttribute('data-contador', String(anios));
  var elAnio = $('#anio');
  if (elAnio) elAnio.textContent = new Date().getFullYear();

  var reloj = $('#reloj');
  function marcarHora() {
    if (!reloj) return;
    try {
      reloj.textContent = new Intl.DateTimeFormat('es-EC', {
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'America/Guayaquil'
      }).format(new Date());
    } catch (e) {
      reloj.textContent = new Date().toTimeString().slice(0, 5);
    }
  }
  marcarHora();
  setInterval(marcarHora, 20000);

  /* ── Susurros del bosque ────────────────────────────────── */

  var susurros = [
    'El bosque no se recorre con prisa: se aprende.',
    'Todo sistema es un árbol: lo que sostiene, casi nunca se ve.',
    anios + ' años escribiendo código bajo el mismo cielo de Quito.',
    'Mi universidad fue el error en producción a las 3 a.m.',
    'Del ESP32 al clúster: la misma curiosidad, distinta escala.',
    'No vendo horas. Entrego sistemas que quedan de pie.'
  ];

  (function tejerSusurro() {
    var caja = $('#susurro');
    if (!caja) return;
    if (quieto) { caja.textContent = susurros[0]; return; }
    var i = 0, j = 0, borrando = false;

    (function paso() {
      var frase = susurros[i];
      caja.textContent = frase.slice(0, j);
      if (!borrando) {
        if (j < frase.length) { j++; setTimeout(paso, 34 + Math.random() * 42); }
        else setTimeout(function () { borrando = true; paso(); }, 2900);
      } else {
        if (j > 0) { j--; setTimeout(paso, 16); }
        else { borrando = false; i = (i + 1) % susurros.length; setTimeout(paso, 420); }
      }
    })();
  })();

  /* ── Revelado y contadores ──────────────────────────────── */

  function animarContador(el) {
    var meta = parseInt(el.getAttribute('data-contador'), 10);
    if (isNaN(meta) || quieto) { if (!isNaN(meta)) el.textContent = meta; return; }
    var ini = performance.now(), dur = 1300;
    (function paso(t) {
      var p = Math.min((t - ini) / dur, 1);
      el.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(paso);
    })(ini);
  }

  if ('IntersectionObserver' in window) {
    var ojo = new IntersectionObserver(function (ent) {
      ent.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        $$('[data-contador]', e.target).forEach(animarContador);
        ojo.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.revelar').forEach(function (n, i) {
      n.style.transitionDelay = Math.min(i % 5, 4) * 60 + 'ms';
      ojo.observe(n);
    });
  } else {
    $$('.revelar').forEach(function (n) { n.classList.add('visible'); });
    $$('[data-contador]').forEach(function (n) { n.textContent = n.getAttribute('data-contador'); });
  }

  /* ── Sendero activo + savia ─────────────────────────────── */

  var enlaces = $$('.sendero a, .nav-movil a');
  var secciones = $$('main .claro');
  var savia = $('#savia');

  function pintarSendero() {
    // rect en vez de offsetTop: .mundo es el offsetParent y desplazaría la cuenta
    var umbral = window.innerHeight * 0.34;
    var actual = null;
    for (var i = 0; i < secciones.length; i++) {
      if (secciones[i].getBoundingClientRect().top <= umbral) actual = secciones[i].id;
    }
    enlaces.forEach(function (a) {
      a.classList.toggle('activo', a.getAttribute('href') === '#' + actual);
    });
    if (savia) {
      var mundo = $('.mundo');
      if (mundo) {
        var caja = mundo.getBoundingClientRect();
        var largo = Math.max(1, caja.height - window.innerHeight * 0.5);
        var hecho = (window.innerHeight * 0.5 - caja.top) / largo;
        savia.style.height = Math.max(0, Math.min(1, hecho)) * 100 + '%';
      }
    }
    document.body.classList.toggle('navegando', window.scrollY > window.innerHeight * 0.75);
  }

  var tic = false;
  window.addEventListener('scroll', function () {
    if (tic) return;
    tic = true;
    requestAnimationFrame(function () { pintarSendero(); tic = false; });
  }, { passive: true });
  pintarSendero();

  /* ── Filtros del dosel ──────────────────────────────────── */

  $$('.chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filtro');
      $$('.chip').forEach(function (o) { o.classList.toggle('is-on', o === b); });
      $$('.hoja').forEach(function (h) {
        h.classList.toggle('apagada', f !== 'todo' && h.getAttribute('data-cat') !== f);
      });
    });
  });

  /* ── Inclinación de tarjetas ────────────────────────────── */

  if (!quieto && window.matchMedia('(hover:hover)').matches) {
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (px * 100) + '%');
        c.style.setProperty('--my', (py * 100) + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 4).toFixed(2) +
          'deg) rotateY(' + ((px - 0.5) * 5).toFixed(2) + 'deg) translateY(-4px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  /* ── Linterna ───────────────────────────────────────────── */

  var linterna = $('#linterna'), btnLinterna = $('#btn-linterna');
  function moverLuz(e) {
    if (!linterna) return;
    linterna.style.setProperty('--lx', e.clientX + 'px');
    linterna.style.setProperty('--ly', e.clientY + 'px');
  }
  function alternarLinterna() {
    var on = document.body.classList.toggle('linterna-on');
    if (btnLinterna) btnLinterna.setAttribute('aria-pressed', String(on));
    if (on) {
      window.addEventListener('pointermove', moverLuz, { passive: true });
      avisar('Linterna encendida. El bosque guarda lo suyo en la penumbra.');
    } else {
      window.removeEventListener('pointermove', moverLuz);
    }
  }
  if (btnLinterna) btnLinterna.addEventListener('click', alternarLinterna);

  /* ── Sonidos del bosque (sintetizados, sin archivos) ────── */

  var audio = null, maestro = null, vivos = [], grillos = null, aves = null;
  var btnSonido = $('#btn-sonido');

  function ruido(ctxA, segundos) {
    var buf = ctxA.createBuffer(1, ctxA.sampleRate * segundos, ctxA.sampleRate);
    var d = buf.getChannelData(0), ult = 0;
    for (var i = 0; i < d.length; i++) {
      var blanco = Math.random() * 2 - 1;
      ult = (ult + 0.021 * blanco) / 1.021;
      d[i] = ult * 3.4;
    }
    return buf;
  }

  function encenderBosqueSonoro() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { avisar('Tu navegador no deja sonar el bosque.'); return false; }
    audio = new AC();
    maestro = audio.createGain();
    maestro.gain.value = 0;
    maestro.connect(audio.destination);
    maestro.gain.linearRampToValueAtTime(0.16, audio.currentTime + 2.4);

    // viento entre las hojas
    var v = audio.createBufferSource();
    v.buffer = ruido(audio, 4); v.loop = true;
    var filtro = audio.createBiquadFilter();
    filtro.type = 'lowpass'; filtro.frequency.value = 460; filtro.Q.value = 0.6;
    var gv = audio.createGain(); gv.gain.value = 0.55;
    var lfo = audio.createOscillator(); lfo.frequency.value = 0.055;
    var lfoG = audio.createGain(); lfoG.gain.value = 240;
    lfo.connect(lfoG); lfoG.connect(filtro.frequency);
    var lfo2 = audio.createOscillator(); lfo2.frequency.value = 0.031;
    var lfoG2 = audio.createGain(); lfoG2.gain.value = 0.28;
    lfo2.connect(lfoG2); lfoG2.connect(gv.gain);
    v.connect(filtro); filtro.connect(gv); gv.connect(maestro);
    v.start(); lfo.start(); lfo2.start();
    vivos.push(v, lfo, lfo2);

    // rumor grave del suelo
    var drone = audio.createOscillator();
    drone.type = 'sine'; drone.frequency.value = 57.5;
    var gd = audio.createGain(); gd.gain.value = 0.055;
    drone.connect(gd); gd.connect(maestro); drone.start();
    vivos.push(drone);

    // grillos
    grillos = setInterval(function () {
      if (!audio || document.hidden) return;
      for (var k = 0; k < 2 + Math.floor(Math.random() * 3); k++) chirrido(0.06 * k);
    }, 1500);

    // un ave lejana de vez en cuando
    aves = setInterval(function () {
      if (!audio || document.hidden) return;
      if (Math.random() < 0.42) canto();
    }, 11000);

    return true;
  }

  function chirrido(retraso) {
    var t = audio.currentTime + retraso;
    var o = audio.createOscillator();
    o.type = 'square';
    o.frequency.value = 3900 + Math.random() * 1100;
    var bp = audio.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = o.frequency.value; bp.Q.value = 14;
    var g = audio.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o.connect(bp); bp.connect(g); g.connect(maestro);
    o.start(t); o.stop(t + 0.1);
  }

  function canto() {
    var t = audio.currentTime + Math.random() * 0.4;
    for (var n = 0; n < 2 + Math.floor(Math.random() * 2); n++) {
      var ini = t + n * (0.16 + Math.random() * 0.1);
      var o = audio.createOscillator();
      o.type = 'sine';
      var f = 1300 + Math.random() * 900;
      o.frequency.setValueAtTime(f, ini);
      o.frequency.exponentialRampToValueAtTime(f * (1.3 + Math.random() * 0.5), ini + 0.1);
      var g = audio.createGain();
      g.gain.setValueAtTime(0, ini);
      g.gain.linearRampToValueAtTime(0.028, ini + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ini + 0.17);
      o.connect(g); g.connect(maestro);
      o.start(ini); o.stop(ini + 0.2);
    }
  }

  function apagarBosqueSonoro() {
    clearInterval(grillos); clearInterval(aves);
    if (maestro && audio) {
      maestro.gain.cancelScheduledValues(audio.currentTime);
      maestro.gain.setValueAtTime(maestro.gain.value, audio.currentTime);
      maestro.gain.linearRampToValueAtTime(0, audio.currentTime + 0.7);
    }
    var ctxA = audio;
    var lista = vivos.slice();
    setTimeout(function () {
      lista.forEach(function (n) { try { n.stop(); } catch (e) {} });
      if (ctxA) { try { ctxA.close(); } catch (e) {} }
    }, 900);
    vivos = []; audio = null; maestro = null;
  }

  function alternarSonido() {
    if (audio) {
      apagarBosqueSonoro();
      if (btnSonido) btnSonido.setAttribute('aria-pressed', 'false');
      avisar('El bosque calla.');
    } else if (encenderBosqueSonoro()) {
      if (btnSonido) btnSonido.setAttribute('aria-pressed', 'true');
      avisar('Sube el volumen: viento, grillos y algún ave lejana.', 4200);
    }
  }
  if (btnSonido) btnSonido.addEventListener('click', alternarSonido);

  /* ── El sendero (paleta de comandos) ────────────────────── */

  var paleta = $('#paleta'), entrada = $('#paleta-in'), lista = $('#paleta-lista');
  var sel = 0, filtrados = [];

  var destinos = [
    { t: 'La raíz — de dónde vengo', g: 'g-raiz', a: '#raiz', k: 'origen sobre mi bio historia quito autodidacta' },
    { t: 'Los anillos — trayectoria', g: 'g-anillos', a: '#anillos', k: 'experiencia trabajo telconet fibramax globonet cv curriculum' },
    { t: 'El dosel — tecnologías', g: 'g-dosel', a: '#dosel', k: 'stack skills python php java react kubernetes habilidades' },
    { t: 'Los frutos — proyectos', g: 'g-obras', a: '#obras', k: 'obras portafolio gesco citacar ultimasync naro sistemas' },
    { t: 'El claro — lo que construyo', g: 'g-claro', a: '#claro', k: 'servicios soluciones ia iot seguridad' },
    { t: 'El pacto — cómo trabajo', g: 'g-pacto', a: '#pacto', k: 'condiciones tarifa contratar freelance precio' },
    { t: 'La señal — contacto', g: 'g-senal', a: '#senal', k: 'contacto hablar escribir email correo' },
    { t: 'Escribirme por WhatsApp', g: 'g-wsp', a: 'https://wa.me/593995391318', k: 'whatsapp telefono celular 0995391318', ext: true },
    { t: 'Enviarme un correo', g: 'g-mail', a: 'mailto:jcruz@software-total.com', k: 'email correo mail', ext: true },
    { t: 'Visitar Software Total', g: 'g-web', a: 'https://software-total.com', k: 'cronleads empresa software total', ext: true },
    { t: 'Copiar mi número', g: 'g-wsp', f: function () {
        copiar('+593995391318', 'Número copiado: +593 99 539 1318');
      }, k: 'copiar telefono numero' },
    { t: 'Copiar mi correo', g: 'g-mail', f: function () {
        copiar('jcruz@software-total.com', 'Correo copiado: jcruz@software-total.com');
      }, k: 'copiar email correo' },
    { t: 'Encender / apagar el sonido', g: 'g-claro', f: alternarSonido, k: 'sonido audio musica ambiente viento' },
    { t: 'Encender / apagar la linterna', g: 'g-claro', f: alternarLinterna, k: 'linterna luz oscuridad' },
    { t: 'Soltar las luciérnagas', g: 'g-obras', f: function () {
        if (window.Bosque) { window.Bosque.enjambre(70); avisar('Luciérnagas libres.'); }
      }, k: 'luciernagas secreto magia fuego fatuo' },
    { t: 'Ir al umbral', g: 'g-flecha', a: '#portal', k: 'inicio arriba portada top' }
  ];

  function copiar(txt, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { avisar(msg); },
        function () { avisar(txt); });
    } else { avisar(txt); }
  }

  function pintarLista() {
    if (!lista) return;
    lista.innerHTML = '';
    if (!filtrados.length) {
      var v = document.createElement('li');
      v.className = 'vacio';
      v.textContent = 'Ese sendero no existe… todavía.';
      lista.appendChild(v);
      return;
    }
    filtrados.forEach(function (d, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === sel));
      if (i === sel) li.className = 'sel';
      li.innerHTML = '<svg aria-hidden="true"><use href="#' + d.g + '"/></svg><span></span>' +
        (d.ext ? '<em>externo</em>' : d.f ? '<em>acción</em>' : '<em>ir</em>');
      $('span', li).textContent = d.t;
      li.addEventListener('click', function () { ejecutar(d); });
      li.addEventListener('pointerenter', function () {
        sel = i;
        $$('li', lista).forEach(function (o, k) { o.classList.toggle('sel', k === i); });
      });
      lista.appendChild(li);
    });
  }

  function filtrar() {
    var q = (entrada ? entrada.value : '').toLowerCase().trim();
    filtrados = !q ? destinos.slice() : destinos.filter(function (d) {
      return (d.t + ' ' + d.k).toLowerCase().indexOf(q) > -1;
    });
    sel = 0;
    pintarLista();
  }

  function ejecutar(d) {
    cerrarPaleta();
    if (d.f) { d.f(); return; }
    if (d.ext) { window.open(d.a, '_blank', 'noopener'); return; }
    var destino = document.querySelector(d.a);
    if (destino) destino.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' });
  }

  var focoPrevio = null;
  function abrirPaleta() {
    if (!paleta) return;
    focoPrevio = document.activeElement;
    paleta.hidden = false;
    entrada.value = '';
    filtrar();
    entrada.focus();
  }
  function cerrarPaleta() {
    if (!paleta || paleta.hidden) return;
    paleta.hidden = true;
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  if (entrada) {
    entrada.addEventListener('input', filtrar);
    entrada.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!filtrados.length) return;
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + filtrados.length) % filtrados.length;
        pintarLista();
        var act = $('li.sel', lista);
        if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtrados[sel]) ejecutar(filtrados[sel]);
      }
    });
  }
  $$('[data-cerrar]').forEach(function (n) { n.addEventListener('click', cerrarPaleta); });
  var btnSendero = $('#btn-sendero');
  if (btnSendero) btnSendero.addEventListener('click', abrirPaleta);

  /* ── Secretos del bosque ────────────────────────────────── */

  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pasosKonami = 0;
  var tecleado = '';
  var ultimaLetra = 0;

  function fuegoFatuo() {
    if (window.Bosque) {
      window.Bosque.enjambre(130);
      window.Bosque.luciernagas();
    }
    document.body.classList.add('linterna-on');
    if (btnLinterna) btnLinterna.setAttribute('aria-pressed', 'true');
    window.addEventListener('pointermove', moverLuz, { passive: true });
    avisar('Fuego fatuo. Dicen que solo lo ve quien ya conoce el camino.', 5200);
  }

  document.addEventListener('keydown', function (e) {
    var escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) ||
      document.activeElement.isContentEditable;

    if (e.key === 'Escape') { cerrarPaleta(); return; }

    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); abrirPaleta(); return;
    }
    if (escribiendo) return;

    if (e.key === '/') { e.preventDefault(); abrirPaleta(); return; }

    // Atajos de una tecla, pero sin pisar a quien esté tecleando una palabra
    // secreta: la «s» de «bosque» no debe encender el sonido.
    var esLetra = /^[a-záéíóúñ]$/i.test(e.key);
    var ahora = Date.now();
    var enRacha = esLetra && (ahora - ultimaLetra < 650);
    if (esLetra) ultimaLetra = ahora;

    if (!enRacha) {
      if (e.key === 's' || e.key === 'S') alternarSonido();
      else if (e.key === 'l' || e.key === 'L') alternarLinterna();
    }

    // konami
    if (e.key === konami[pasosKonami] || e.key.toLowerCase() === konami[pasosKonami]) {
      pasosKonami++;
      if (pasosKonami === konami.length) { pasosKonami = 0; fuegoFatuo(); }
    } else {
      pasosKonami = (e.key === konami[0]) ? 1 : 0;
    }

    // palabras secretas
    if (esLetra) {
      tecleado = (tecleado + e.key.toLowerCase()).slice(-9);
      if (tecleado.indexOf('bosque') > -1) {
        tecleado = '';
        if (window.Bosque) window.Bosque.luciernagas();
        avisar('«Bosque». Buena palabra. Aquí tienes luciérnagas.', 4200);
      } else if (tecleado.indexOf('quito') > -1) {
        tecleado = '';
        avisar('2 850 m sobre el nivel del mar. Aquí el código se escribe con menos oxígeno.', 5200);
      } else if (tecleado.indexOf('jc') > -1 && tecleado.slice(-2) === 'jc') {
        tecleado = '';
        var em = $('#emblema');
        if (em) { em.classList.add('gira'); setTimeout(function () { em.classList.remove('gira'); }, 5000); }
      }
    }
  });

  var emblema = $('#emblema'), toques = 0, toquesT;
  if (emblema) {
    emblema.addEventListener('click', function (e) {
      toques++;
      clearTimeout(toquesT);
      toquesT = setTimeout(function () { toques = 0; }, 2600);
      if (window.Bosque) window.Bosque.enjambre(10, e.clientX, e.clientY);
      if (toques === 5) {
        toques = 0;
        emblema.classList.add('gira');
        setTimeout(function () { emblema.classList.remove('gira'); }, 5000);
        if (window.Bosque) window.Bosque.enjambre(90, e.clientX, e.clientY);
        avisar('El ouróboros se muerde la cola: todo sistema vuelve a empezar.', 5200);
      }
    });
  }

  var semilla = $('#semilla');
  if (semilla) {
    semilla.addEventListener('click', function () {
      avisar('Secretos: / sendero · S sonido · L linterna · teclea «bosque» o «quito» · ↑↑↓↓←→←→BA', 8000);
      if (window.Bosque) window.Bosque.enjambre(30);
    });
  }

  /* ── Consola ────────────────────────────────────────────── */

  try {
    console.log(
      '%c\n  ✦  EL BOSQUE  ✦\n' +
      '  Jose Francisco Cruz Corro — Quito, Ecuador\n' +
      '  ' + anios + ' años construyendo sistemas de extremo a extremo.\n\n' +
      '  Si estás leyendo esto, ya somos del mismo gremio.\n' +
      '  Hablemos: https://wa.me/593995391318\n',
      'color:#e0a850;font-family:monospace;font-size:12px;line-height:1.6'
    );
    console.log('%c  Pista: pulsa / en la página.', 'color:#86c9a1;font-family:monospace');
  } catch (e) {}
})();
