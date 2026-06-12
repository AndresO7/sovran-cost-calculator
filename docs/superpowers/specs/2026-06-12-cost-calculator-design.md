# Sovran Group — Cost Calculator 3D: Design Spec

**Fecha:** 2026-06-12
**Estado:** Aprobado por el usuario (estética, prototipos y alcance confirmados en brainstorming)

## 1. Resumen

Página web de cost calculator para Sovran Group (estudio de arquitectura de lujo, Londres), inspirada en el configurador de resi.co.uk pero diferenciada visualmente. El usuario configura una extensión de planta baja y una conversión de loft sobre uno de dos prototipos de casa británica en 3D, viendo el precio estimado en vivo.

- **Ubicación:** página principal `/` de este repo (Next.js 16.2.9, App Router).
- **3D:** three.js vía `@react-three/fiber` + `@react-three/drei`, geometría 100% procedural y texturas generadas con canvas (sin assets externos).
- **Estética:** sistema "Monolith Noir" de `DESIGN.md` — fondo `#0a0a0a`, acento dorado `#c9a96e`, tipografías Syne / Inter Tight / Outfit, responsive vía `clamp()`.

## 2. Los dos prototipos

Originales y llamativos pero comerciales, alineados con el portfolio luxury de Sovran (Chelsea, Hampstead):

1. **The Townhouse** — townhouse victoriana londinense de 3 plantas (estilo Chelsea/Kensington): ladrillo, bay window en planta baja, pórtico de entrada, techo con parapeto. Extensión trasera configurable + loft tipo mansard/dormer.
2. **The Villa** — villa detached estilo Hampstead de 2 plantas: doble gable, jardín amplio, garaje lateral implícito en volumen. Extensiones más grandes (incluida wrap-around L) + loft hip-to-gable/dormer.

Ambas casas comparten el sistema de piezas: la casa base es fija por prototipo; la extensión y el loft son paramétricos.

## 3. Presentación 3D "Monolith Noir"

Diferenciador clave frente al fondo blanco clínico de resi: la casa se presenta como **maqueta de estudio de arquitectura**:

- Plinto monolítico oscuro (caja baja con bisel) "flotando" sobre fondo `#0a0a0a` con leve niebla/gradiente.
- Iluminación dramática: key light cálida direccional + rim light fría tenue + ambiente bajo.
- **Ventanas emisivas doradas** (`#c9a96e`) — render nocturno luxury.
- Sobre el plinto: césped UK, patio de losas junto a la extensión, 2-3 planters con arbustos.
- Sombras suaves (`ContactShadows` de drei) y tone mapping ACES.
- `OrbitControls` con límites (no ir bajo el suelo, zoom acotado), auto-rotación suave hasta la primera interacción.

## 4. Layout y UI

Como la referencia de resi:

- **Top bar** (fijo, oscuro): brand "SOVRAN" (Syne 800), selector de prototipo (The Townhouse / The Villa), **rango de precio en vivo** con counter animado (Inter Tight 900, ej. "£71K – £87K"), CTA "Get detailed quote".
- **Viewport 3D**: columna izquierda ~66% del ancho.
- **Panel de configuración**: columna derecha ~34%, fondo `#111`, scroll propio, con tabs **Ground / Loft**.
- **Small print** bajo el precio: "Construction estimate only. Design & planning fees quoted separately."
- Microcopy en inglés (sitio UK); el código y commits en inglés.

### Tab Ground
| Control | Opciones |
|---|---|
| Size (S/M/L, círculos como resi) | m² reales por prototipo (ver §6) |
| Material (swatches circulares con textura) | White render (incluido), Red brick, London stock, Charred timber, Zinc cladding |
| Extension roof (cards con mini-icono) | Flat (incluido), Flat + skylights, Pitched slate |
| Glazing (cards) | French doors (incluido), Sliding doors, Bifold doors |

### Tab Loft
| Control | Opciones |
|---|---|
| Loft type (cards) | None (incluido), Velux only, Flat dormer, Mansard (Townhouse) / Hip-to-gable (Villa) |
| Roof finish (swatches) | Slate (incluido), Clay tiles, Zinc |

Cada opción muestra nombre y delta de precio ("+£1,800" / "Included"), seleccionada con borde dorado.

### Lead capture
CTA abre **QuoteModal**: resumen de la configuración (prototipo, tamaño, materiales, rango), formulario nombre/email/postcode, botón "Request detailed quote". **Sin backend**: al enviar muestra estado de éxito local (se conectará después). Validación mínima (campos no vacíos, email con formato).

## 5. Arquitectura de código

```
app/
  layout.tsx              — fuentes via next/font (Outfit, Syne, Inter Tight), metadata
  globals.css             — variables Monolith Noir, scrollbar dorado
  page.tsx                — server shell, renderiza <Calculator/>
  calculator/
    Calculator.tsx        — "use client"; useReducer; compone TopBar + Scene + ConfigPanel + QuoteModal
    state.ts              — tipos del estado + reducer + estado inicial
    config.ts             — catálogo único: prototipos, opciones, precios, dimensiones (single source of truth)
    pricing.ts            — funciones puras: calculatePrice(state) → { low, high }, formatRange()
    Scene.tsx             — <Canvas> R3F: cámara, luces, plinto, niebla, controles; dynamic import ssr:false
    models/
      Townhouse.tsx       — casa base prototipo A
      Villa.tsx           — casa base prototipo B
      Extension.tsx       — extensión paramétrica compartida (width/depth, material, roof, glazing)
      Loft.tsx            — pieza de loft paramétrica (velux/dormer/mansard/hip-to-gable)
      Garden.tsx          — plinto, césped, patio, planters
      materials.ts        — hooks de materiales con canvas textures memoizadas (brick, render, slate, timber, zinc, clay)
    ui/
      TopBar.tsx
      ConfigPanel.tsx     — tabs + secciones
      controls.tsx        — SizePicker, SwatchPicker, OptionCard, Tabs
      QuoteModal.tsx
```

**Dependencias nuevas:** `three`, `@react-three/fiber` (v9, compatible React 19), `@react-three/drei`, `@types/three`, `gsap` (counter del precio y reveals de entrada), `maath` (damping de transiciones 3D). Dev: `vitest` para tests de pricing.

**Nota Next.js 16:** este repo usa una versión con breaking changes — leer `node_modules/next/dist/docs/` (App Router, `next/dynamic`, fonts) antes de implementar cada parte.

## 6. Modelo de precios (Londres premium, indicativo)

- **Base extensión:** £3,200/m² construcción luxury.
- **Tamaños Townhouse:** S 3×4m (12m²), M 4×5m (20m²), L 4×7m (28m²).
- **Tamaños Villa:** S 4×4m (16m²), M 4×6m (24m²), L wrap-around 6×6m (36m²).
- **Material (suma fija):** render £0, red brick +£1,800, london stock +£2,600, charred timber +£3,400, zinc +£4,800.
- **Techo extensión:** flat £0, flat + skylights +£3,600, pitched slate +£6,800.
- **Glazing:** french £0, sliding +£4,200, bifold +£6,400.
- **Loft:** none £0, Velux +£42,000, flat dormer +£68,000, mansard +£95,000 (Townhouse), hip-to-gable +£85,000 (Villa).
- **Roof finish loft:** slate £0, clay +£2,800, zinc +£5,200 (solo aplica si loft ≠ none).
- **Rango mostrado:** total × [0.92, 1.08], redondeado al £1K más cercano, formato "£71K – £87K".

Los números viven solo en `config.ts`; `pricing.ts` solo agrega y formatea.

## 7. Flujo de datos

1. `useReducer` en `Calculator.tsx`: `{ prototype, ground: { size, material, roof, glazing }, loft: { type, finish } }`.
2. Cambiar de prototipo conserva las selecciones compatibles y resetea las que no existan en el nuevo catálogo (ej. mansard → hip-to-gable equivalente).
3. `useMemo(calculatePrice)` → TopBar anima del valor anterior al nuevo con GSAP counter.
4. El estado baja como props a `Scene` → los modelos interpolan dimensiones/posiciones con `maath/easing.damp` en `useFrame` (morph suave, ~0.4s). Los materiales cambian de forma directa (swap instantáneo, sin crossfade): el morph dimensional ya aporta la sensación de transición.

## 8. Manejo de errores y rendimiento

- **WebGL no disponible / error del Canvas:** error boundary alrededor de `Scene` → fallback con imagen estática del prototipo y mensaje; el panel y el precio siguen funcionando.
- **SSR:** el Canvas se carga con `next/dynamic` `ssr: false` dentro de un client component; placeholder con spinner dorado mientras carga.
- **Texturas canvas:** generadas una vez y memoizadas por material (módulo `materials.ts`); resolución ≤512px; `anisotropy` moderada.
- **DPR acotado** (`dpr={[1, 2]}`), sombras solo de contacto (baratas), geometrías simples (< 50k tris total).

## 9. Responsive

- Todo con `clamp()` según DESIGN.md, sin media queries salvo el cambio estructural de layout.
- **Mobile (< 768px):** viewport 3D arriba (~55vh), panel como bottom sheet scrolleable debajo; top bar compacto (precio + CTA).

## 10. Testing

- **Unit (vitest):** `pricing.ts` (cada adder suma, rango ±8%, redondeo y formato £K/£M) y `state.ts` (reducer: cambio de prototipo migra selecciones correctamente).
- **Verificación visual:** dev server + revisión en navegador de ambos prototipos y todas las opciones (screenshots).
- No se testean los componentes 3D unitariamente (verificación visual).

## 11. Fuera de alcance

- Backend/envío real de leads, CMS, persistencia de diseños guardados.
- El resto del sitio Sovran (hero, portfolio, etc. de DESIGN.md).
- Exportación de planos/PDF, login, multi-idioma.
