# El Bosque — josefranciscocruzcorro.github.io

Sitio personal de **Jose Francisco Cruz Corro** — arquitecto de software, DevOps, IA aplicada,
IoT y ciberseguridad. Quito, Ecuador.

> Un bosque profundo y ancestral: se entra por el umbral y se desciende, claro a claro,
> hasta la señal de humo.

**En línea:** <https://josefranciscocruzcorro.github.io>

---

## Cómo está hecho

Sin frameworks, sin build, sin backend, sin base de datos y sin rastreadores.
HTML + CSS + JavaScript plano servido tal cual por GitHub Pages.

```
index.html              El recorrido completo (umbral + 7 claros)
404.html                Te perdiste en el bosque
favicon.ico
assets/
  css/bosque.css        Sistema visual: tokens, tipografía, retícula, componentes
  js/bosque.js          Escenario procedural en canvas 2D
  js/app.js             Interacción: sendero, susurros, revelados, secretos, sonido
  img/                  Emblema y open graph (derivados de logo-jc-2.png)
logo-jc.png             Logos originales en alta (no se publican en el sitio)
logo-jc-2.png
```

### El escenario (`bosque.js`)

Canvas 2D puro, sin librerías. Cada capa se dibuja una sola vez a un lienzo fuera de pantalla
y después sólo se compone, así que el bucle por cuadro es barato:

- cuatro capas de árboles generadas con ramificación recursiva y parallax por profundidad;
- dosel colgante y sotobosque anclado al borde inferior;
- haces de luz que se mecen y bancos de niebla a la deriva;
- esporas y luciérnagas dibujadas con sprites precalculados, atraídas por el cursor;
- penumbra que se cierra a medida que desciendes.

Respeta `prefers-reduced-motion` (dibuja un solo cuadro), se detiene con la pestaña oculta
y limita el DPR a 2.

### Detalles de interacción (`app.js`)

- Raíl lateral con sección activa y savia que sube con el scroll.
- Susurros escritos a máquina en el umbral.
- Revelado por `IntersectionObserver` y contadores animados.
- Filtros del arsenal, inclinación 3D de las tarjetas.
- Sonido ambiental **sintetizado con Web Audio** (viento, grillos, algún ave): cero archivos.

### Atajos y secretos

| | |
|---|---|
| <kbd>/</kbd> o <kbd>Ctrl</kbd>+<kbd>K</kbd> | Invocar el sendero (paleta de comandos) |
| <kbd>S</kbd> | Sonidos del bosque |
| <kbd>L</kbd> | Modo linterna |
| teclear `bosque` | Luciérnagas |
| teclear `quito` | Un dato de altura |
| teclear `jc` | Gira el sello |
| <kbd>↑</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd><kbd>←</kbd><kbd>→</kbd><kbd>B</kbd><kbd>A</kbd> | Fuego fatuo |
| 5 clics en el sello | El ouróboros se muerde la cola |
| ✦ en el pie | La lista de secretos |

## Desarrollo

No hay nada que compilar. Basta con servir la carpeta:.

## Créditos

Emblema (ouróboros, estrella y monograma JC) y contenido: Jose Francisco Cruz Corro.
Tipografías: Cormorant Garamond, Inter y JetBrains Mono (Google Fonts).
