# SOVRAN GROUP - Design System & Style Guide

Remake del sitio [sovrangroup.co.uk](https://sovrangroup.co.uk/) — Luxury Architecture & Interior Design Studio.

---

## 1. Identidad Visual

### Concepto
**"Monolith Noir"** — Elegancia arquitectonica con tipografia monumental. El sitio alterna entre fondos oscuros (#0a0a0a) y claros (#f2f0ed) creando contraste dramatico. La experiencia es cinematica: cada seccion tiene su propia narrativa visual con animaciones GSAP que revelan contenido de forma secuencial.

### Tono
Luxury / Refined — Minimalismo sofisticado con detalles editoriales. No es brutalist ni maximalist, es contenido pero con momentos de impacto tipografico.

---

## 2. Paleta de Colores

### Variables CSS (`:root`)
```css
--background: #0a0a0a;      /* Negro profundo — fondo principal */
--foreground: #f5f0eb;       /* Blanco calido — texto principal sobre oscuro */
--accent: #c9a96e;           /* Dorado sutil — detalles (scrollbar, cursor hover) */
--muted: rgba(245, 240, 235, 0.5);  /* Texto secundario */
--nav-height: 72px;
```

### Colores por contexto

| Contexto | Color | Uso |
|---|---|---|
| **Fondo oscuro** | `#0a0a0a` | Hero, Video, Services, Marquee, Stats, Footer |
| **Fondo claro** | `#f2f0ed` | About, Portfolio, Contact (antes del reveal) |
| **Texto principal (oscuro)** | `#f5f0eb` | Sobre fondos oscuros |
| **Texto principal (claro)** | `#1a1a1a` | Sobre fondos claros |
| **Texto secundario (oscuro)** | `rgba(245,240,235,0.4-0.5)` | Labels, descripciones |
| **Texto secundario (claro)** | `rgba(26,26,26,0.4)` | Labels, descripciones |
| **Lineas decorativas (oscuro)** | `rgba(245,240,235,0.08-0.1)` | Separadores |
| **Lineas decorativas (claro)** | `rgba(26,26,26,0.1-0.15)` | Separadores |
| **Acento dorado** | `#c9a96e` / `rgba(201,169,110,0.45)` | Scrollbar, cursor hover state |

### Opacidades frecuentes
- **Labels/Subtitulos**: `0.3 - 0.4`
- **Texto cuerpo**: `0.45 - 0.5`
- **Elementos fantasma/ghost**: `0.03 - 0.04`
- **Lineas separadoras**: `0.05 - 0.1`
- **Hover links**: `1.0` (blanco completo)

---

## 3. Tipografia

### Fuentes (Google Fonts via Next.js)

| Variable CSS | Fuente | Pesos | Uso |
|---|---|---|---|
| `--font-outfit` | **Outfit** | 300, 400, 500, 600 | Body text, labels, navegacion, descripciones |
| `--font-syne` | **Syne** | 700, 800 | Brand "SOVRAN", headlines hero, titulos de seccion, numeros grandes |
| `--font-inter-tight` | **Inter Tight** | 800, 900 | Titulos de alto impacto (WHAT WE DO, FEATURED WORK, LET'S TALK, stats) |
| `--font-manrope` | **Manrope** | 700, 800 | Disponible pero poco usada |
| `--font-jakarta` | **Plus Jakarta Sans** | 700, 800 | Disponible pero poco usada |

### Jerarquia tipografica

#### Titulos monumentales (H1)
```
font-family: var(--font-inter-tight)
font-size: clamp(48px, 7vw, 130px)
font-weight: 900
line-height: 1
letter-spacing: -0.03em
text-transform: uppercase
```

#### Titulos de seccion (H2)
```
font-family: var(--font-syne)
font-size: clamp(36px, 5vw, 80px)
font-weight: 700
line-height: 1.05
letter-spacing: -0.01em
```

#### Brand "SOVRAN"
```
font-family: var(--font-syne)
font-weight: 800
letter-spacing: 0.18em
text-transform: uppercase
```
- Navbar: `clamp(20px, 1.8vw, 28px)`
- Footer: `clamp(48px, 6vw, 110px)`
- Hero intro: `clamp(80px, 6.5vw, 120px)` → escala a navbar

#### Labels/Subtitulos
```
font-family: var(--font-outfit)
font-size: clamp(9px, 0.75vw, 12px)
font-weight: 400
letter-spacing: 0.25em
text-transform: uppercase
color: rgba(opacidad 0.3-0.4)
```

#### Body text
```
font-family: var(--font-outfit)
font-size: clamp(14px, 1.1vw, 18px)
font-weight: 300
line-height: 1.75
```

#### Navegacion
```
font-size: clamp(13px, 0.85vw, 14px)
font-weight: 300 (light)
letter-spacing: 0.14em
text-transform: uppercase
```

---

## 4. Layout & Espaciado

### Patron de spacing (responsive con clamp)
```
Padding horizontal pagina: clamp(32px, 6vw, 120px)
Padding vertical secciones: clamp(80px, 10vh, 140px)
Gaps entre elementos: clamp(16px, 2vw, 40px)
```

### Sistema de clamp()
Todas las medidas usan `clamp(min, preferred, max)` en vez de breakpoints. Esto garantiza fluides total sin media queries.

### Estructura de pagina
```
<main>
  <div fixed z-0>     Hero (fijo, video de fondo) </div>
  <div h-screen />    Spacer para scroll sobre hero
  <div relative z-10> Todas las secciones con bg solido </div>
</main>
```

El hero queda en `position: fixed` con `z-index: 0`. Las secciones despues flotan sobre el con `z-index: 10` y fondos solidos, creando un efecto de "cortina" natural al scrollear.

---

## 5. Secciones del Sitio (orden)

### 5.1 Hero (`Hero.tsx`)
- **Fondo**: Video `/hero.mp4` en autoplay loop
- **Overlay**: Negro con gradiente `from-black/50 via-transparent to-black/60`
- **Animacion de entrada** (8.2s secuencial):
  1. `0-0.8s` — Video overlay fade a 0.25
  2. `0.8-2.6s` — Letras "SOVRAN" suben desde abajo (clip mask), stagger 0.12s
  3. `2.8-3.6s` — Subtitulo "Architecture & Interior Design Studio" sube
  4. `4.2s` — Subtitulo sale hacia arriba
  5. `4.7-6.1s` — Brand se mueve al navbar (scale + position, plano secuencia)
  6. `5.8-6.5s` — Links del nav entran desde los lados
  7. `6.2-7.5s` — Headline "LUXURY ARCHITECTURE & DESIGN" + descripcion
  8. `7.2-8.2s` — Bottom bar, linea decorativa, scroll indicator
- **Brand portal**: El brand se renderiza via `createPortal` en `document.body` para escapar del stacking context z-0
- **Navbar portal**: Igualmente via portal para estar siempre encima
- **Scroll behavior**: El body se bloquea (`overflow: hidden`) durante los 8.2s de la animacion

### 5.2 About Section (`AboutSection.tsx`)
- **Fondo**: `#f2f0ed` (claro) — `data-nav-theme="light"`
- **Headline vanishing**: Letras empiezan dispersas con blur, se ensamblan al scrollear (`scrub`)
- **Grid editorial**: 2 columnas asimetricas (1.2fr 1fr)
  - Imagen principal: clip-path reveal `inset(100% 0% 0% 0%)` → `inset(0%)`
  - Imagen detalle: wipe horizontal `inset(0% 100% 0% 0%)` → `inset(0%)`
  - Imagen pequena: scale desde centro `inset(50% 50% 50% 50%)` → `inset(0%)`
- **Elementos decorativos**:
  - "25+" en texto outlined gigante (stroke only, opacity 0.1)
  - "LUXURY" en Inter Tight 900, `mixBlendMode: multiply`
  - SVG circulos concentricos con lineas (stroke draw animation)
- **Parallax**: Las 3 imagenes se mueven a velocidades distintas (`y: -40, -70, -30`)

### 5.3 Video Scroll Section (`VideoScrollSection.tsx`)
- **Video**: `/section2_scroll.mp4` — 60fps, all keyframes (re-encodeado con ffmpeg)
- **Mecanica**: Seccion de `500vh`, video en sticky `100vh`. El scroll controla `video.currentTime`
- **Suavizado**: Lerp factor 0.15 via `gsap.ticker` para interpolar el tiempo del video
- **Contenido**: 3 bloques de texto que aparecen/desaparecen segun progreso del scroll:
  1. "Design Without Compromise" (left)
  2. "Built to Endure" (right)
  3. "Spaces That Outlive Us" (left) — este se queda visible
- **Overlay**: Se oscurece de 0.3 a 0.7 conforme avanza el scroll
- **Barra de progreso**: Linea delgada en la parte inferior

### 5.4 Services Section (`ServicesSection.tsx`)
- **Fondo**: `#0a0a0a` — `data-nav-theme="dark"`
- **Header**: "OUR SERVICES" label + "WHAT WE DO" en Inter Tight 900
- **Scroll horizontal**: Track con 4 tarjetas, `pin: true`, `scrub: 1`
- **Tarjetas**: Cada una tiene imagen (4/3 ratio), linea, numero, titulo (Syne 700), descripcion
- **Servicios**: Architecture, Interior Design, Project Management, Renovation
- **Animaciones**: Staggered reveal al entrar la seccion (imagen scale + fade, titulo y desc fade up)

### 5.5 Marquee Section (`MarqueeSection.tsx`)
- **Posicion**: Entre Services y Portfolio
- **Contenido**: "SOVRAN GROUP · LUXURY ARCHITECTURE · INTERIOR DESIGN · LONDON ·"
- **Estilo**: Syne 800, **italic**, blanco, `clamp(32px, 4vw, 72px)`
- **Animacion dual**:
  1. Loop infinito base: `xPercent: -50` en 60s (lento)
  2. Scroll-driven boost: `x: "-=300"` con `scrub: 1.5`
- **Bordes**: `borderTop/Bottom: 1px solid rgba(245,240,235,0.06)`
- **Padding vertical**: `clamp(36px, 5vh, 72px)`

### 5.6 Portfolio Section (`PortfolioSection.tsx`)
- **Fondo**: `#f2f0ed` (claro) — `data-nav-theme="light"`
- **Header**: "Selected Projects" + "FEATURED WORK" + numero outlined "05"
- **Scroll horizontal**: 5 proyectos con alturas alternas (grande/pequeno)
- **Clip-path reveal**: `polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)` → completo (diagonal wipe)
- **Parallax en imagenes**: `xPercent: -15 → 15`, `scale: 1.2 → 1`
- **Gradient overlay**: Se intensifica al acercar la tarjeta al centro
- **CTA final**: Cuadrado con flecha, hover cambia a fondo negro
- **Proyectos**: Belgravia Residence, Kensington Townhouse, Chelsea Penthouse, Mayfair Office, Hampstead Villa

### 5.7 Stats Section (`StatsSection.tsx`)
- **Fondo**: `#0a0a0a` — `data-nav-theme="dark"`
- **Pinned section**: `pin: true`, `end: "+=250%"`
- **2 fases en timeline scrub**:
  1. **Quote reveal**: Cada palabra aparece secuencialmente (opacity 0.06 → 1)
     - Texto: "We don't just build spaces — we craft legacies..."
     - Syne 700, `clamp(30px, 4.5vw, 76px)`
  2. **Stats**: Quote sale (fade up), estadisticas entran con counter animado
     - 25+ Years of Excellence
     - 150+ Projects Completed
     - 40M+ Portfolio Value
     - 98% Client Satisfaction
     - Inter Tight 900, `clamp(48px, 6vw, 110px)`
- **Lineas**: Grow de izquierda a derecha (staggered)
- **Progress bar**: Linea en top que se llena segun scroll

### 5.8 Contact Section (`ContactSection.tsx`)
- **Fondo inicial**: `#f2f0ed` con imagen de fondo que se revela via `clip-path: circle()`
- **`data-nav-theme="dark"`**
- **Clip-path reveal**: `circle(0% at 50% 50%)` → `circle(100% at 50% 50%)` con scrub
- **Layout**: Grid 1.2fr / 1fr
  - Izquierda: "GET IN TOUCH" label, "LET'S" y "TALK" (cada palabra en su linea, Inter Tight 900), descripcion, info de contacto
  - Derecha: Formulario (Name, Email, Message) + boton "SEND MESSAGE"
- **Form inputs**: Border bottom only, transparentes, focus cambia opacity del border
- **Boton**: bg blanco, hover invierte a negro

### 5.9 Footer (`Footer.tsx`)
- **Fondo**: `#0a0a0a`
- **Elemento distintivo**: "S" gigante en Syne 800, `clamp(400px, 50vw, 800px)`, color `rgba(245,240,235,0.04)` — parallax sutil al scrollear
- **Brand**: "SOVRAN" grande con letter stagger reveal
- **Grid 3 columnas** con separadores verticales (`border-right: 1px solid rgba(245,240,235,0.05)`)
  - Navigation: Projects, Services, About, Career
  - Contact: email, telefono, location
  - Social: Instagram, LinkedIn, Pinterest
- **Links hover**: Color completo + translateX(8px)
- **Bottom bar**: Copyright + boton "Back to top" con borde, hover con background sutil
- **Animaciones**: Brand chars stagger up, content fade up, lines grow

---

## 6. Animaciones GSAP

### Libreria
- `gsap` + `ScrollTrigger` plugin
- Registrado globalmente: `gsap.registerPlugin(ScrollTrigger)`

### Patrones de animacion recurrentes

#### Clip-path reveals
```javascript
// Vertical wipe (arriba a abajo)
gsap.set(el, { clipPath: "inset(100% 0% 0% 0%)" });
gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut" });

// Horizontal wipe (derecha a izquierda)
gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut" });

// Diagonal wipe
gsap.set(el, { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" });
gsap.to(el, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });

// Circular reveal
gsap.set(el, { clipPath: "circle(0% at 50% 50%)" });
gsap.to(el, { clipPath: "circle(100% at 50% 50%)" });

// Scale desde centro
gsap.set(el, { clipPath: "inset(50% 50% 50% 50%)" });
gsap.to(el, { clipPath: "inset(0% 0% 0% 0%)" });
```

#### Text reveal (clip mask)
```javascript
// Letras suben desde abajo
gsap.set(chars, { yPercent: 110 });
gsap.to(chars, { yPercent: 0, stagger: 0.08-0.12, duration: 0.8-1.2, ease: "power4.out" });
```

#### Fade up
```javascript
gsap.from(el, { opacity: 0, y: 20-40, duration: 0.8, ease: "power2.out" });
```

#### Line grow
```javascript
gsap.from(line, { scaleX: 0, transformOrigin: "left center", duration: 1.2, ease: "power3.inOut" });
```

#### Counter animado
```javascript
const counter = { val: 0 };
gsap.to(counter, {
  val: targetNumber,
  duration: 0.8,
  ease: "power2.out",
  onUpdate: () => { el.textContent = Math.floor(counter.val) + suffix; }
});
```

#### Parallax
```javascript
gsap.to(el, {
  y: -40 to -70,  // o yPercent
  ease: "none",
  scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true }
});
```

#### Scroll horizontal
```javascript
gsap.to(track, {
  x: -totalScroll,
  ease: "none",
  scrollTrigger: {
    trigger: section,
    start: "top top",
    end: () => `+=${totalScroll}`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onRefresh: (self) => {
      // Fix: dar background al pin-spacer
      if (self.pin && self.pin.parentElement) {
        self.pin.parentElement.style.background = "color";
      }
    }
  }
});
```

### Easing favoritos
| Ease | Uso |
|---|---|
| `power4.out` | Text reveals, entradas dramaticas |
| `power4.inOut` | Clip-path reveals |
| `power3.out` | Movimientos suaves |
| `power3.inOut` | Lineas, transiciones |
| `power2.out` | Fades, counters |
| `power2.inOut` | Overlays |
| `none` | Parallax, scroll-driven |
| `elastic.out(1, 0.4)` | Cursor mouseup |

---

## 7. Navbar Behavior

### Estructura
- Fixed, `z-index: 9999`, height 72px
- Grid de 3 columnas: `1fr auto 1fr`
- Links izquierda: Projects, Services, Contact
- Centro: Brand "SOVRAN" (via portal)
- Links derecha: About, Career + CTA "Let's Talk"

### CTA Button
- Glass morphism: `backdrop-filter: blur(16px) saturate(180%)`
- Border: `1px solid rgba(255,255,255,0.18)`
- Inner icon: circulo con "+" que rota 90deg en hover
- Shine effect: gradiente diagonal semi-transparente

### Cambio de tema (dark/light)
Las secciones tienen `data-nav-theme="light"` o `"dark"`. Un scroll listener detecta cual seccion esta en la posicion del navbar (top 80px) y aplica/quita la clase `.nav-on-light`.

```css
.nav-on-light,
.nav-on-light a,
.nav-on-light span {
  color: #1a1a1a !important;
}
.nav-on-light .nav-cta {
  background: #1a1a1a !important;
  border: 1px solid #1a1a1a !important;
}
.nav-on-light .nav-cta span { color: #f5f0eb !important; }
```

### Mapa de temas por seccion
| Seccion | data-nav-theme | Fondo |
|---|---|---|
| Hero | (default dark) | Video oscuro |
| About | `light` | `#f2f0ed` |
| Video Scroll | `dark` | `#0a0a0a` + video |
| Services | `dark` | `#0a0a0a` |
| Marquee | `dark` | `#0a0a0a` |
| Portfolio | `light` | `#f2f0ed` |
| Stats | `dark` | `#0a0a0a` |
| Contact | `dark` | Imagen con overlay oscuro |
| Footer | (no theme) | `#0a0a0a` |

---

## 8. Custom Cursor

### Elementos
1. **Dot** (inner): 6px, `#f5f0eb`, `mixBlendMode: difference`
2. **Ring** (outer): 42px, border `1px solid rgba(245,240,235,0.5)`, `mixBlendMode: difference`

### Comportamiento
- Dot sigue el mouse instantaneamente
- Ring sigue con lerp (speed 0.15, 0.12 en hover)
- **Hover interactive**: Ring crece a 64px, border cambia a dorado `rgba(201,169,110,0.45)`, dot desaparece (scale 0)
- **Click**: Ring squeeze a 0.8, release con elastic
- **Fuera de ventana**: Ambos fade out
- Oculto en dispositivos tactiles (`hidden md:block`)
- CSS: `cursor: none !important` via `@media (pointer: fine)`

### Deteccion de interactivos
Observa `a, button, [role='button'], input, textarea, select, [data-cursor-hover]`. Un `MutationObserver` re-attacha listeners cuando el DOM cambia.

---

## 9. Scrollbar

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }
```

---

## 10. Video Scroll - Optimizacion

### Problema
Videos H.264 a 24fps tienen keyframes cada 1-2 segundos. Seeking a frames intermedios es lento porque el navegador debe decodificar desde el keyframe mas cercano.

### Solucion (ffmpeg)
```bash
ffmpeg -i input.mp4 \
  -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -g 1 -keyint_min 1 -bf 0 \
  -c:v libx264 -crf 18 -preset slow \
  -an \
  output_scroll.mp4
```

| Flag | Efecto |
|---|---|
| `-g 1 -keyint_min 1 -bf 0` | Cada frame es un keyframe (seeking instantaneo) |
| `minterpolate=fps=60` | Interpola de 24fps a 60fps |
| `-crf 18` | Calidad alta |
| `-an` | Sin audio |

### Resultado
- Input: 24fps, 2.3MB, keyframes cada ~2s
- Output: 60fps, 13MB, all-intra (cada frame es keyframe)

---

## 11. Stack Tecnologico

| Tecnologia | Version/Detalle |
|---|---|
| **Framework** | Next.js (App Router) |
| **Lenguaje** | TypeScript |
| **CSS** | Tailwind CSS v4 (`@import "tailwindcss"`) + inline styles |
| **Animaciones** | GSAP + ScrollTrigger |
| **Fuentes** | Google Fonts via `next/font/google` |
| **Rendering** | Client-side (`"use client"` en todos los componentes) |
| **Portales** | React `createPortal` para navbar y brand (escapar stacking context) |

---

## 12. Imagenes

Todas las imagenes usan **Unsplash** con parametros de calidad:
```
?w=1200&q=80&auto=format&fit=crop
```

Las imagenes tienen `object-cover` y estan dentro de contenedores con `overflow: hidden` para clip-path animations.

---

## 13. Patrones de Responsive

### NO usamos media queries tradicionales
Todo el responsive se maneja con `clamp()`:
```
clamp(valor_minimo, valor_preferido, valor_maximo)
```

### Breakpoints implicitos en clamp
- **Font sizes**: `clamp(36px, 5.8vw, 108px)` — 36px en ~620px, 108px en ~1860px
- **Padding**: `clamp(32px, 6vw, 120px)` — 32px en ~533px, 120px en ~2000px
- **Gaps**: `clamp(16px, 2.5vw, 40px)`

### Cursor
- Solo visible en desktop: `hidden md:block` (768px+)
- `@media (pointer: fine)` para ocultar cursor nativo

---

## 14. Reglas de Interaccion

### Hover en links
```javascript
onMouseEnter: color → #f5f0eb, transform: translateX(8px)
onMouseLeave: color → rgba(245,240,235,0.45), transform: translateX(0)
transition: color 0.3s ease, transform 0.3s ease
```

### Hover en botones
- Inversion de color (blanco → negro o viceversa)
- `transform: scale(0.97)` sutil en click
- Transitions: `0.4s ease`

### Focus en inputs
- Solo `borderBottom` cambia de opacity (0.15 → 0.5)
- Sin outline visible, sin box-shadow

---

## 15. Pin-spacer Fix

Cuando GSAP crea un `pin-spacer` para scroll horizontal, el fondo del spacer queda transparente, revelando el video del hero debajo. La solucion:

```javascript
scrollTrigger: {
  onRefresh: (self) => {
    if (self.pin && self.pin.parentElement) {
      self.pin.parentElement.style.background = "#0a0a0a"; // o "#f2f0ed" segun seccion
    }
  }
}
```

---

## 16. Orden de z-index

| Elemento | z-index |
|---|---|
| Hero (video) | `0` (fixed) |
| Secciones | `10-20` (relative) |
| Overlay hero | `1-2` |
| Contenido hero | `10` |
| Brand SOVRAN | `60` |
| Navbar | `9999` |
| Cursor dot | `10001` |
| Cursor ring | `10000` |
