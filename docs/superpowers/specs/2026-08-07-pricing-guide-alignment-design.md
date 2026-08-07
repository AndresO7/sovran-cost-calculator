# Alineación del calculador con la Price Guide de Sovran

Fecha: 2026-08-07
Fuente: `Price guide.pdf` — "SOVRAN GROUP · Cost Calculator — Pricing Logic"

## Problema

El calculador actual deriva un total único (`área × £3,200/m² + recargos`) y fabrica un
rango aplicándole ±8%. La guía de precios define algo distinto: dos tipos de proyecto con
métodos de cálculo propios, tarifas que dependen de la zona geográfica del inmueble, y
rangos que salen del propio método, no de un margen decorativo.

## Método de cálculo

### Extensión trasera

```
low  = tarifaBaja × m² + Σ recargos
high = tarifaAlta × m² + Σ recargos
```

### Conversión de loft

```
base = profundidad(m) × tarifa
low  = base × 0.85 + Σ recargos
high = base × 1.15 + Σ recargos
```

### Total

Suma de los extremos de cada proyecto activo. Un proyecto inactivo (extensión apagada,
loft en "none") aporta cero y no aparece en el desglose.

## Zonas

Se detectan desde el código postal vía `api.postcodes.io`, cuyo campo `admin_district`
da el borough. La consulta se hace directa desde el cliente: la API es pública y con CORS
abierto, y `AGENTS.md` advierte que las APIs de servidor de esta versión de Next difieren
de lo conocido, así que un route handler añadiría riesgo sin beneficio.

**Zone 1 — Prime / Inner London:** Kensington and Chelsea, Westminster, City of London,
Islington, Camden, Hammersmith and Fulham, Wandsworth, Southwark, Lambeth, Richmond upon
Thames, Greenwich.

**Zone 2 — Greater London / resto del Reino Unido:** todo lo demás. También es el valor de
respaldo cuando el usuario omite el código postal o el lookup falla.

El mapeo normaliza el texto del borough (minúsculas, sin "London Borough of" / "Royal
Borough of", `&` → `and`) para no depender del formato exacto que devuelva la API.

## Tarifas

| Tier | Zone 1 | Zone 2 |
|---|---|---|
| Standard | £2,200 – £2,600 /m² | £1,700 – £2,000 /m² |
| High End | £2,800 – £3,400 /m² | £2,200 – £2,600 /m² |

| Buhardilla | Zone 1 | Zone 2 |
|---|---|---|
| Box dormer | £10,000 / m | £7,500 / m |
| Mansard dormer | £12,000 / m | £9,000 / m |

### Recargos de extensión

- **Techo:** plano £0 · plano + rooflights £2,800 · plano + lantern £4,500 · monopendiente £1,800
- **Acabado exterior:** render blanco £0 · London stock £1,400 · ladrillo rojo £1,800 · madera £2,200 · zinc £3,500
- **Puertas:** dobles £0 · bifold £800 · correderas £1,200
- **Marcos:** negro £0 · blanco £0 · gris/antracita £400 · marrón/bronce £600

### Recargos de loft

- **Distribución:** A dormitorio £0 · B dormitorio + baño £8,500 · C 2 dormitorios + baño £14,000 · D dormitorio + baño + estudio £11,000
- **Marcos:** negro £0 · blanco £0 · gris/antracita £400 · marrón/bronce £500

El bronce cuesta £600 en extensión y £500 en loft, por lo que cada proyecto lleva su
propia tabla de marcos y su propio selector.

## Opciones fuera de la guía

El acabado de patio (York / porcelana / deck) y el re-tejado (pizarra / arcilla / zinc)
no aparecen en el documento pero sí están cableados al modelo 3D. Se conservan como
opciones puramente visuales a £0, de forma que el total siempre coincide con la guía sin
perder configurabilidad ya construida.

## Estado

```ts
interface CalculatorState {
  started: boolean;
  location: {
    postcode: string;
    zone: ZoneId;                 // respaldo: "zone2"
    borough: string | null;
    status: "idle" | "loading" | "ok" | "notfound" | "error";
  };
  ground: {
    enabled: boolean;
    tier: TierId;                 // "standard" | "highEnd"
    depth: number;                // metros, 2–6; el ancho es siempre el de la casa
    material: MaterialId;
    roof: ExtRoofId;              // flat | rooflights | lantern | pitched
    glazing: GlazingId;
    frame: FrameId;               // black | white | anthracite | bronze
    patio: PatioId;               // solo visual
  };
  loft: {
    type: LoftTypeId;
    depth: number;                // metros, 5–10; por defecto el fondo de la casa
    layout: LoftLayoutId;         // a | b | c | d
    frame: FrameId;
    finish: LoftFinishId;         // solo visual
  };
  activeTab: TabId;
  quoteOpen: boolean;
}
```

Los presets S/M/L desaparecen: la guía toma los m² como input, así que el área es lo que
alimenta el precio. Un slider de profundidad la deriva (`anchoCasa × profundidad`) y un
campo numérico permite escribirla directamente. Por encima de lo que el modelo sabe
dibujar los dos dejan de coincidir: la profundidad se queda en su máximo y el área
introducida es la que cotiza.

La profundidad del loft sí redimensiona la casa en 3D. `HOUSE.d` era una constante
alimentando una geometría ya paramétrica, así que basta con conectarla. La altura del
tejado escala con la profundidad para mantener la pendiente, y la cámara reencuadra sola.

Con la profundidad variable, el alto de las ventanas de la buhardilla debe derivarse del
faldón: un hueco fijo de 1.5 m no cabe en el muro que deja una casa de menos de 5.34 m de
fondo, y `WallWithOpenings` produce geometría rota.

Si no hay ni extensión ni loft no hay nada que cotizar. El total es cero, pero la interfaz
muestra un estado neutro en vez de "£0" y desactiva la solicitud de presupuesto.

## UI

- **StartScreen** — tras elegir qué extender, la columna derecha pasa a la pregunta 02: código
  postal con lookup en vivo que muestra borough y zona antes de entrar. Se puede omitir.
- **ConfigPanel / Ground** — interruptor de extensión, nivel de especificación (mostrando el
  £/m² vigente para la zona), slider de profundidad con m² en vivo, acabado, techo, puertas,
  marcos, patio.
- **ConfigPanel / Loft** — tipo de buhardilla, slider de profundidad, distribución interior,
  marcos, acabado de tejado.
- **TopBar** — zona detectada junto al nombre del inmueble, más el rango en vivo.
- **QuoteModal** — subtotales de extensión y loft como rangos independientes, código postal
  precargado desde el estado.
- **controls.tsx** — controles nuevos `Slider` y `Toggle`, iconos de techo plano y de las
  cuatro distribuciones de loft.

## Pruebas

`pricing.test.ts` se reescribe contra los números del documento: ambas zonas, ambos tiers,
cada tabla de recargos, el buffer ±15% del loft, la suma de proyectos y el comportamiento de
los proyectos apagados. `zones.test.ts` cubre el mapeo borough → zona, incluida la
normalización y el respaldo a Zone 2.
