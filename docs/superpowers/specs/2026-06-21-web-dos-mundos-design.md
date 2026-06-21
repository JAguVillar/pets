# Diseño — Separar la web en dos mundos: Adopción y Perdidos

Fecha: 2026-06-21
Rama: `feat/web-dos-mundos`
App afectada: `web` (Astro 5 SSR). No se tocan las apps admin ni el schema.

## Problema

La web pública es hoy una sola landing larga (`web/src/pages/index.astro`) que
amontona los dos fines del producto —adopción y mascotas perdidas— en la misma
página, con un único color dominante (emerald) para todo. Los dos propósitos no
se distinguen visualmente ni tienen un hogar propio. Existen ya las páginas
`/adopciones` y `/perdidos`, pero son secundarias frente a la home.

Referencia de la dirección buscada: petcolove.org, cuyo navbar sobrio ofrece dos
links color-codeados ("Lost" y "Adopt") que dirigen a páginas dedicadas que casi
no conviven.

## Objetivo

Independizar adopción y perdidos como **dos mundos separados**, cada uno con su
identidad de color y su propia landing completa, dejando la home como un hub
neutro que bifurca hacia ellos. La navegación principal se reduce a dos links
color-codeados al estilo petcolove.

No-objetivos (fuera de alcance): apps admin, lógica de Supabase, páginas de
detalle `[id].astro`, el LocationPicker del admin, tests automatizados
(verificación manual).

## Estado actual relevante

- `web/src/pages/index.astro`: landing larga que compone `Hero`, `HowItWorks`,
  `AdoptionGrid`, `LostBand`, `MiniMap`, `Values`, `Testimonials`, `Shelters`,
  `FinalCta`, `Footer`.
- `web/src/components/landing/Nav.astro`: nav con links
  `[Adoptar, Perdidos, Cómo funciona, Refugios]` + "Ingresar" + botón verde fijo
  "Publicar mascota".
- `web/src/pages/adopciones/index.astro`: ya usa acentos **emerald** y CTA
  "Publicar mascota". Grilla de `animals_for_adoption` (status `available`).
- `web/src/pages/perdidos/index.astro`: ya usa acentos **naranja**
  (`orange-50/600/900`, dot `red-500`) y CTA "Reportar pérdida". Grilla de
  `lost_pets` (status `lost`).
- `web/src/lib/config.js`: `ROUTES` con `adminAdoptionsNew`, `adminLostNew`,
  `adminLogin`, `adminProfile`.

Insight clave: las dos páginas ya tienen identidad de color naciente. Esto es
más **consolidar y amplificar** que construir de cero.

## Sistema de color (formalizado)

| | Adopción | Perdidos |
|---|---|---|
| Color base | `emerald` (Tailwind `emerald-*`, #10b981) | `orange` (Tailwind `orange-*`, #ea580c) |
| Botón primario | `bg-emerald-500 hover:bg-emerald-600`, texto blanco | `bg-orange-600 hover:bg-orange-700`, texto blanco |
| Acentos | badges, links, hover, sombras de CTA | badges, links, hover, dot "activo", sombras |

El naranja de Perdidos (#ea580c = `orange-600`) coincide deliberadamente con el
pin del LocationPicker del admin, para que el sistema sea coherente de punta a
punta: link del nav → hero → botón → pin del mapa.

## Diseño

### 1. Nav (`Nav.astro`) — componente compartido

Se simplifica al estilo petcolove. Los dos links son protagonistas, cada uno con
su color; "Ingresar" queda discreto. **El botón de acción (Publicar/Reportar)
sale del nav global** y vive dentro de cada landing.

```
[🐾 Pets]          Adoptar      Perdidos              Ingresar
                   (emerald)    (orange + dot)
```

- "Adoptar" → `/adopciones`, hover/acento emerald.
- "Perdidos" → `/perdidos`, hover/acento naranja + puntito de "reportes activos".
- Se quitan "Cómo funciona" y "Refugios" del nav (pasan a vivir dentro de cada
  mundo).
- Se quita el botón fijo "Publicar mascota" del nav.
- En mobile: los dos links color-codeados quedan visibles (no escondidos tras
  hamburguesa), porque son la navegación principal. "Ingresar" puede colapsar.

El `Nav.astro` actual no recibe props; tras el cambio sigue sin recibirlos (los
dos links y sus colores son fijos). El estado "activo" del link según la página
es deseable pero opcional (nice-to-have); si se hace, se resuelve con
`Astro.url.pathname`.

### 2. Home = hub neutro (`index.astro`)

Deja de ser la landing larga. Pasa a bifurcación clara + prueba social
compartida:

```
┌───────────────────────────────────────────────┐
│  Hero corto:  "Adoptá. Reportá. Reencontrá."   │
│                                                 │
│  ┌─────────────────┐   ┌─────────────────┐     │
│  │  🐶 ADOPTAR      │   │  📍 PERDIDOS     │     │
│  │  (card verde)    │   │  (card ámbar)    │     │
│  │  "Encontrá tu    │   │  "Ayudá a una    │     │
│  │   compañero"     │   │   familia a      │     │
│  │  → /adopciones   │   │   reencontrarse" │     │
│  └─────────────────┘   │  → /perdidos     │     │
│                         └─────────────────┘     │
│                                                 │
│  Stats globales  ·  Testimonios  ·  Footer      │
└───────────────────────────────────────────────┘
```

- Hero corto y neutro (no el hero largo actual con imagen de un solo perro).
- Dos cards grandes color-codeadas son el corazón del hub: cada una con ícono,
  título, frase y link a su mundo. La card es clickeable completa.
- Stats globales (reusar/adaptar la prueba social existente) + `Testimonials`
  (compartido, sirve a ambos mundos) + `Footer`.

Componente nuevo sugerido: `WorldCards.astro` (o las dos cards inline en la home,
si quedan simples). Se decide en el plan según tamaño.

### 3. Mundo Adopción (`/adopciones`) — emerald

Se amplifica de simple grilla a landing completa:

- Hero propio (acento emerald) + CTA "Publicar mascota" (verde) →
  `ROUTES.adminAdoptionsNew`.
- "Cómo adoptar": versión adopción de los pasos (deriva de `HowItWorks`).
- Grilla de mascotas en adopción (la que ya tiene la página).
- Refugios: la sección `Shelters` se muda acá.
- CTA final verde (versión adopción de `FinalCta`).

### 4. Mundo Perdidos (`/perdidos`) — orange

Misma estructura, su color:

- Hero propio naranja (ya existe, se potencia) + CTA "Reportar pérdida"
  (naranja) → `ROUTES.adminLostNew`.
- "Cómo reportar / cómo ayudar": versión perdidos de los pasos.
- Mapa con reportes: `MiniMap` se muda acá, junto a la grilla de perdidos
  (`LostCard`).
- CTA final naranja.

### 5. Redistribución de componentes

| Componente actual | Destino |
|---|---|
| `Hero` (general) | Reemplazado por hero corto del hub (se conserva o se archiva) |
| `HowItWorks` | Se divide → "Cómo adoptar" (verde) y "Cómo reportar" (naranja) |
| `AdoptionGrid` | Ya vive en `/adopciones`; se quita de la home |
| `LostBand` | → `/perdidos` (o se funde con el hero/grilla de perdidos) |
| `MiniMap` | → `/perdidos` |
| `Shelters` | → `/adopciones` |
| `Values` | Hub o se reparte; se define al implementar |
| `Testimonials` | Queda en el hub (compartido) |
| `FinalCta` | Una versión por mundo, con su color |
| `Footer` | Compartido, sin cambios |

Criterio: cada componente tiene una sola responsabilidad y se ubica en el mundo
al que sirve. Los que sirven a ambos (Testimonials, Footer, Nav) quedan
compartidos.

## Flujo de navegación resultante

```
            ┌─────────── Home (hub neutro) ───────────┐
            │                                          │
       Adoptar (verde)                          Perdidos (ámbar)
            │                                          │
            ▼                                          ▼
   /adopciones (mundo verde)                /perdidos (mundo ámbar)
   hero · cómo adoptar · grilla ·           hero · cómo reportar · mapa ·
   refugios · CTA publicar                  grilla · CTA reportar
            │                                          │
            ▼                                          ▼
   /adopciones/[id]                          /perdidos/[id]
   (sin cambios)                             (sin cambios)
```

El Nav (presente en home y en ambos mundos) permite saltar de un mundo al otro
en cualquier momento, pero el contenido de cada mundo no se mezcla.

## Manejo de errores

Sin cambios respecto del patrón actual: cada página que consulta Supabase ya
envuelve el fetch en try/catch, registra `console.warn` y muestra un estado
vacío/error. Se conserva ese patrón en las landings amplificadas.

## Verificación (manual, sin tests automatizados)

1. Nav: en home y en ambas landings se ven los dos links color-codeados;
   "Adoptar" lleva a `/adopciones`, "Perdidos" a `/perdidos`; "Ingresar" va al
   login del admin. No aparece el botón fijo "Publicar mascota" en el nav.
2. Home: es un hub con las dos cards grandes; al clickear cada card se llega al
   mundo correcto. No quedan en la home las grillas/secciones que se mudaron.
3. `/adopciones`: hero verde + cómo adoptar + grilla + refugios + CTA "Publicar
   mascota"; todos los acentos en emerald.
4. `/perdidos`: hero naranja + cómo reportar + mapa + grilla + CTA "Reportar
   pérdida"; todos los acentos en orange.
5. Coherencia de color: ningún acento emerald en el mundo perdidos ni viceversa.
6. Responsivo: en mobile los dos links del nav siguen visibles; las cards del hub
   se apilan; las grillas colapsan a 1–2 columnas.
7. Build de Astro corre sin errores (`pnpm --filter web build`) y no quedan
   imports rotos de componentes mudados/eliminados.

## Restricciones globales (heredadas del proyecto)

- Todo el código en **JavaScript**, nunca TypeScript.
- Texto de UI en **español rioplatense**.
- Sin framework de tests: verificación manual en browser.
- No tocar apps admin, schema, ni Supabase.
- Trabajo en la rama `feat/web-dos-mundos`.
