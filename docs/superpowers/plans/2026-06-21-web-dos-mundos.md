# Separar la web en dos mundos (Adopción / Perdidos) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la web pública de una landing larga que mezcla todo en dos mundos separados color-codeados (Adopción = emerald, Perdidos = naranja), con la home como hub neutro que bifurca hacia cada uno.

**Architecture:** Astro 5 SSR. `Nav.astro` y `Footer.astro` son componentes compartidos. La home (`index.astro`) pasa a hub. Las páginas `/adopciones` y `/perdidos` se amplifican a landings completas, cada una reuniendo los componentes de su mundo. Los componentes que hoy sólo usa la home se redistribuyen o se borran.

**Tech Stack:** Astro 5, Tailwind CSS (utilidades inline en `.astro`), Supabase JS (queries existentes, sin cambios).

## Global Constraints

- Todo el código en **JavaScript**, nunca TypeScript.
- Texto de UI en **español rioplatense** ("vos").
- **Sin framework de tests**: la verificación de cada tarea es `pnpm build:web` sin errores + revisión visual en `pnpm dev:web`. No hay pasos de test automatizado (el patrón TDD de la skill se reemplaza por build + verificación manual, por instrucción explícita del proyecto).
- No tocar las apps `admin`, el schema, ni la lógica de Supabase.
- Color Adopción: Tailwind `emerald-*` (#10b981). Color Perdidos: Tailwind `orange-*` (#ea580c, = pin del LocationPicker).
- Rama de trabajo: `feat/web-dos-mundos` (ya creada).
- Ningún acento emerald en el mundo perdidos ni naranja en el de adopción.

## Arquitectura de archivos resultante

**Compartidos (varias páginas):**
- `Nav.astro` — MODIFICAR (dos links color-codeados)
- `Footer.astro` — MODIFICAR (arreglar links a refugios)
- `PawLogo.astro`, `PetCard.astro`, `LostCard.astro` — sin cambios

**Hub (`index.astro`):**
- hero corto inline + `WorldCards.astro` (NUEVO) + `Values.astro` + `Testimonials.astro`

**Mundo Adopción (`/adopciones`):**
- hero existente + `ComoAdoptar.astro` (NUEVO) + grilla existente + `Shelters.astro` + `FinalCta.astro` (copy ajustado)

**Mundo Perdidos (`/perdidos`):**
- hero existente + `ComoReportar.astro` (NUEVO) + `MiniMap.astro` (editado) + grilla existente + `FinalCtaPerdidos.astro` (NUEVO)

**Se borran (hoy sólo los usa la home, quedan sin uso):**
- `Hero.astro` (reemplazado por el hero corto del hub)
- `HowItWorks.astro` (reemplazado por `ComoAdoptar`/`ComoReportar`)
- `AdoptionGrid.astro` (`/adopciones` ya tiene su propia grilla)
- `LostBand.astro` (`/perdidos` ya tiene su propia grilla)

---

## Task 1: Nav de dos mundos + arreglo de links del Footer

**Files:**
- Modify: `web/src/components/landing/Nav.astro` (reemplazo completo)
- Modify: `web/src/components/landing/Footer.astro:11` y `:24` (links a refugios)

**Interfaces:**
- Consumes: `PawLogo` (sin cambios), `ROUTES.adminLogin` de `lib/config.js`.
- Produces: nav presente en todas las páginas con links `Adoptar`→`/adopciones` (emerald) y `Perdidos`→`/perdidos` (naranja + dot). Ninguna otra tarea depende de su API (no recibe props).

- [ ] **Step 1: Reemplazar `Nav.astro` por la versión de dos links**

Reemplazar TODO el contenido de `web/src/components/landing/Nav.astro` por:

```astro
---
import PawLogo from "./PawLogo.astro";
import { ROUTES } from "../../lib/config.js";
---

<nav
  class="sticky top-0 z-30 backdrop-blur-md bg-white/85 border-b border-slate-100"
>
  <div
    class="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-10 lg:px-16 py-4"
  >
    <a href="/" class="shrink-0" aria-label="Pets — inicio">
      <PawLogo size={30} iconSize={17} textSize="text-xl" />
    </a>

    <div class="flex items-center gap-1.5 sm:gap-2">
      <a
        href="/adopciones"
        class="font-bold text-sm px-3.5 sm:px-4 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors"
      >
        Adoptar
      </a>
      <a
        href="/perdidos"
        class="font-bold text-sm px-3.5 sm:px-4 py-2 rounded-xl text-orange-700 hover:bg-orange-50 transition-colors inline-flex items-center gap-2"
      >
        <span
          class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,.15)]"
        ></span>
        Perdidos
      </a>
      <a
        href={ROUTES.adminLogin}
        class="hidden sm:inline font-bold text-sm text-slate-500 hover:text-slate-900 transition-colors ml-1 sm:ml-2"
      >
        Ingresar
      </a>
    </div>
  </div>
</nav>
```

- [ ] **Step 2: Arreglar los links a refugios en `Footer.astro`**

En `web/src/components/landing/Footer.astro`, la sección de refugios se muda a `/adopciones` (Task 3), así que los anchors `/#refugios` deben apuntar a `/adopciones#refugios`.

Cambiar en la columna "Adopciones" (línea ~11):
```js
      { label: "Refugios", href: "/#refugios" },
```
por:
```js
      { label: "Refugios", href: "/adopciones#refugios" },
```

Y en la columna "Refugios" (línea ~24):
```js
      { label: "Verificación", href: "/#refugios" },
```
por:
```js
      { label: "Verificación", href: "/adopciones#refugios" },
```

- [ ] **Step 3: Build**

Run: `pnpm build:web`
Expected: build OK, sin errores de import ni de sintaxis.

- [ ] **Step 4: Verificación visual**

Run: `pnpm dev:web` y abrir `http://localhost:4321/`
Verificar: el nav muestra logo + "Adoptar" (verde) + "Perdidos" (naranja con puntito) + "Ingresar". "Adoptar" lleva a `/adopciones`, "Perdidos" a `/perdidos`, el logo a `/`. Ya no aparece el botón "Publicar mascota" ni los links "Cómo funciona"/"Refugios" en el nav.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/landing/Nav.astro web/src/components/landing/Footer.astro
git commit -m "feat(web): nav de dos mundos (Adoptar/Perdidos) color-codeado"
```

---

## Task 2: Home como hub neutro

**Files:**
- Create: `web/src/components/landing/WorldCards.astro`
- Modify: `web/src/pages/index.astro` (reemplazo completo)
- Delete: `web/src/components/landing/Hero.astro`, `web/src/components/landing/HowItWorks.astro`, `web/src/components/landing/AdoptionGrid.astro`, `web/src/components/landing/LostBand.astro`

**Interfaces:**
- Consumes: `Nav`, `Footer`, `Values`, `Testimonials` (existentes, sin cambios), `Layout`.
- Produces: `WorldCards.astro` (sin props) usado sólo por la home. `MiniMap.astro` y `Shelters.astro` quedan temporalmente sin importar hasta Tasks 4 y 3 (no es un error: un `.astro` sin uso no rompe el build).

- [ ] **Step 1: Crear `WorldCards.astro`**

Crear `web/src/components/landing/WorldCards.astro` con:

```astro
---
---

<section class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 pb-16 lg:pb-20">
  <div class="grid md:grid-cols-2 gap-5 lg:gap-6">
    <a
      href="/adopciones"
      class="group relative overflow-hidden rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 sm:p-10 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
    >
      <span
        class="w-14 h-14 rounded-2xl bg-emerald-500 inline-flex items-center justify-center mb-6"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          stroke-width="2.2"
          aria-hidden="true"
        >
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z"
          ></path>
        </svg>
      </span>
      <div
        class="font-bold text-[13px] uppercase tracking-[.1em] text-emerald-600 mb-2"
      >
        Adoptar
      </div>
      <h2
        class="font-extrabold text-2xl sm:text-3xl leading-tight text-emerald-950 tracking-tight mb-2.5"
      >
        Encontrá tu próximo compañero.
      </h2>
      <p class="text-[15px] leading-relaxed text-emerald-900/70 mb-6 max-w-sm">
        Mirá las mascotas en adopción de refugios y familias verificadas.
        Filtrá, conectá y sumá uno a tu casa.
      </p>
      <span
        class="font-bold text-sm text-emerald-700 inline-flex items-center gap-1.5"
      >
        Ver en adopción
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          aria-hidden="true"
          class="transition-transform group-hover:translate-x-1"
        >
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </span>
    </a>

    <a
      href="/perdidos"
      class="group relative overflow-hidden rounded-[28px] border border-orange-200 bg-orange-50 p-8 sm:p-10 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(234,88,12,0.2)]"
    >
      <span
        class="w-14 h-14 rounded-2xl bg-orange-600 inline-flex items-center justify-center mb-6"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          stroke-width="2.2"
          aria-hidden="true"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </span>
      <div
        class="inline-flex items-center gap-2 font-bold text-[13px] uppercase tracking-[.1em] text-orange-600 mb-2"
      >
        <span
          class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,.18)]"
        ></span>
        Perdidos
      </div>
      <h2
        class="font-extrabold text-2xl sm:text-3xl leading-tight text-orange-950 tracking-tight mb-2.5"
      >
        Ayudá a una familia a reencontrarse.
      </h2>
      <p class="text-[15px] leading-relaxed text-orange-900/70 mb-6 max-w-sm">
        Mirá los reportes activos en el mapa de tu zona, o reportá una mascota
        perdida o encontrada. Es gratis.
      </p>
      <span
        class="font-bold text-sm text-orange-700 inline-flex items-center gap-1.5"
      >
        Ver perdidos
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          aria-hidden="true"
          class="transition-transform group-hover:translate-x-1"
        >
          <path d="M5 12h14M12 5l7 7-7 7"></path>
        </svg>
      </span>
    </a>
  </div>
</section>
```

- [ ] **Step 2: Reemplazar `index.astro` por el hub**

Reemplazar TODO el contenido de `web/src/pages/index.astro` por:

```astro
---
import Layout from "../layouts/Layout.astro";
import Nav from "../components/landing/Nav.astro";
import WorldCards from "../components/landing/WorldCards.astro";
import Values from "../components/landing/Values.astro";
import Testimonials from "../components/landing/Testimonials.astro";
import Footer from "../components/landing/Footer.astro";
---

<Layout>
  <Nav />
  <main>
    <section
      class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 pt-14 sm:pt-20 lg:pt-24 pb-10 lg:pb-12 text-center"
    >
      <div
        class="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-full mb-6"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        +1.240 familias reunidas en Argentina
      </div>
      <h1
        class="font-extrabold text-4xl sm:text-5xl lg:text-[58px] leading-[1.04] text-slate-900 tracking-tight mb-5"
        style="letter-spacing:-.035em;"
      >
        Adoptá. Reportá. Reencontrá.
      </h1>
      <p
        class="text-base sm:text-lg lg:text-[19px] leading-[1.5] text-slate-500 max-w-xl mx-auto"
      >
        Dos formas de ayudar, un solo lugar. Elegí por dónde querés empezar.
      </p>
    </section>

    <WorldCards />
    <Values />
    <Testimonials />
  </main>
  <Footer />
</Layout>
```

- [ ] **Step 3: Borrar los componentes home-only que quedan sin uso**

```bash
git rm web/src/components/landing/Hero.astro web/src/components/landing/HowItWorks.astro web/src/components/landing/AdoptionGrid.astro web/src/components/landing/LostBand.astro
```

- [ ] **Step 4: Build**

Run: `pnpm build:web`
Expected: build OK. Sin errores de import (la home ya no referencia Hero/HowItWorks/AdoptionGrid/LostBand). `MiniMap` y `Shelters` quedan sin importar todavía — eso no rompe el build.

- [ ] **Step 5: Verificación visual**

Run: `pnpm dev:web` y abrir `http://localhost:4321/`
Verificar: la home es un hub — hero corto "Adoptá. Reportá. Reencontrá." + dos cards grandes (verde "Adoptar" / naranja "Perdidos"), cada una clickeable y llevando a su mundo + sección Values + Testimonios + Footer. Ya NO aparecen la grilla de adopción, la banda de perdidos ni el mini-mapa en la home.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/landing/WorldCards.astro web/src/pages/index.astro
git commit -m "feat(web): home como hub neutro que bifurca a los dos mundos"
```

---

## Task 3: Mundo Adopción (`/adopciones`) — landing completa verde

**Files:**
- Create: `web/src/components/landing/ComoAdoptar.astro`
- Modify: `web/src/components/landing/FinalCta.astro:18` (copy a adopción)
- Modify: `web/src/pages/adopciones/index.astro` (imports + composición)

**Interfaces:**
- Consumes: `Shelters` (existente), `FinalCta` (existente, copy ajustado), `PetCard` (existente), queries Supabase de la página (sin cambios).
- Produces: `ComoAdoptar.astro` (sin props), usado por `/adopciones`.

- [ ] **Step 1: Crear `ComoAdoptar.astro`** (hereda los pasos de adopción que tenía `HowItWorks`)

Crear `web/src/components/landing/ComoAdoptar.astro` con:

```astro
---
const steps = [
  {
    n: "Paso 1",
    title: "Buscá",
    desc: "Filtrá por especie, tamaño, edad y zona. Mirá las que te laten.",
    icon: `<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`,
  },
  {
    n: "Paso 2",
    title: "Conectá",
    desc: "Hablá directo con el refugio o la familia. Coordinás la visita.",
    icon: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>`,
  },
  {
    n: "Paso 3",
    title: "Adoptá",
    desc: "Sumás un compañero a tu casa. Una familia más, completa.",
    icon: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path>`,
  },
];
---

<section class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 pb-16 lg:pb-20">
  <div class="mb-7">
    <div
      class="font-bold text-[13px] uppercase tracking-[.1em] text-emerald-600 mb-2"
    >
      Cómo adoptar
    </div>
    <h2
      class="font-extrabold text-2xl sm:text-3xl lg:text-[32px] leading-tight text-slate-900 tracking-tight"
    >
      Tres pasos, sin vueltas.
    </h2>
  </div>

  <div class="grid sm:grid-cols-3 gap-5">
    {steps.map((s) => (
      <div class="flex gap-4 items-start bg-slate-50 border border-slate-200/70 rounded-[20px] p-6">
        <span class="shrink-0 w-12 h-12 rounded-[14px] bg-emerald-50 inline-flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            stroke-width="2.2"
            aria-hidden="true"
            set:html={s.icon}
          />
        </span>
        <div>
          <div class="font-semibold text-xs text-slate-400 mb-1">{s.n}</div>
          <div class="font-bold text-lg text-slate-900 mb-1">{s.title}</div>
          <p class="text-sm leading-relaxed text-slate-500 m-0">{s.desc}</p>
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Ajustar el copy de `FinalCta.astro` a adopción**

En `web/src/components/landing/FinalCta.astro` (línea ~18), el heading menciona los dos fines. Acotarlo a adopción.

Cambiar:
```astro
        ¿Tenés una mascota para dar en adopción o reportar una pérdida?
```
por:
```astro
        ¿Tenés una mascota para dar en adopción?
```

(El resto de `FinalCta.astro` queda igual: fondo emerald, botones "Publicar mascota" y "Ver en adopción".)

- [ ] **Step 3: Componer la landing de adopción**

En `web/src/pages/adopciones/index.astro`, agregar los imports debajo de los existentes (tras la línea `import { ROUTES } from "../../lib/config.js";`):

```astro
import ComoAdoptar from "../../components/landing/ComoAdoptar.astro";
import Shelters from "../../components/landing/Shelters.astro";
import FinalCta from "../../components/landing/FinalCta.astro";
```

Luego insertar los componentes en el `<main>`. La estructura final del `<main>` debe quedar: hero (sección existente) → `<ComoAdoptar />` → grilla (sección existente) → `<Shelters />` → `<FinalCta />`.

Insertar `<ComoAdoptar />` entre el cierre de la sección hero (`</section>`) y la apertura de la sección de la grilla (`<section class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 pb-20">`).

Insertar `<Shelters />` y `<FinalCta />` inmediatamente antes de `</main>` (después de la sección de la grilla), en ese orden.

- [ ] **Step 4: Build**

Run: `pnpm build:web`
Expected: build OK, sin imports rotos.

- [ ] **Step 5: Verificación visual**

Run: `pnpm dev:web` y abrir `http://localhost:4321/adopciones`
Verificar: hero verde + "Cómo adoptar" (3 pasos) + grilla de mascotas + sección Refugios + CTA final verde ("¿Tenés una mascota para dar en adopción?"). Todos los acentos en emerald, ninguno naranja. El ancla `/adopciones#refugios` del footer baja a la sección de refugios.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/landing/ComoAdoptar.astro web/src/components/landing/FinalCta.astro web/src/pages/adopciones/index.astro
git commit -m "feat(web): /adopciones como landing completa del mundo adopción"
```

---

## Task 4: Mundo Perdidos (`/perdidos`) — landing completa naranja

**Files:**
- Create: `web/src/components/landing/ComoReportar.astro`
- Create: `web/src/components/landing/FinalCtaPerdidos.astro`
- Modify: `web/src/components/landing/MiniMap.astro:24-41` (quitar CTA autorreferencial)
- Modify: `web/src/pages/perdidos/index.astro` (imports + composición)

**Interfaces:**
- Consumes: `MiniMap` (editado), `LostCard` (existente), `ROUTES.adminLostNew`, queries Supabase de la página (sin cambios).
- Produces: `ComoReportar.astro` y `FinalCtaPerdidos.astro` (sin props), usados por `/perdidos`.

- [ ] **Step 1: Crear `ComoReportar.astro`**

Crear `web/src/components/landing/ComoReportar.astro` con:

```astro
---
const steps = [
  {
    n: "Paso 1",
    title: "Reportá",
    desc: "Cargá la foto, la zona donde la viste por última vez y un contacto. Toma dos minutos.",
    icon: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>`,
  },
  {
    n: "Paso 2",
    title: "Difundí",
    desc: "El reporte aparece en el mapa de la zona. Cuantos más ojos, más chances.",
    icon: `<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"></path>`,
  },
  {
    n: "Paso 3",
    title: "Reencontrá",
    desc: "Quien la vea contacta a la familia desde el detalle. Un mensaje puede cambiar todo.",
    icon: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z"></path>`,
  },
];
---

<section class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-14 lg:py-16">
  <div class="mb-7">
    <div
      class="font-bold text-[13px] uppercase tracking-[.1em] text-orange-600 mb-2"
    >
      Cómo reportar
    </div>
    <h2
      class="font-extrabold text-2xl sm:text-3xl lg:text-[32px] leading-tight text-slate-900 tracking-tight"
    >
      Reportar es gratis y rápido.
    </h2>
  </div>

  <div class="grid sm:grid-cols-3 gap-5">
    {steps.map((s) => (
      <div class="flex gap-4 items-start bg-orange-50 border border-orange-200/70 rounded-[20px] p-6">
        <span class="shrink-0 w-12 h-12 rounded-[14px] bg-orange-100 inline-flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ea580c"
            stroke-width="2.2"
            aria-hidden="true"
            set:html={s.icon}
          />
        </span>
        <div>
          <div class="font-semibold text-xs text-orange-400 mb-1">{s.n}</div>
          <div class="font-bold text-lg text-slate-900 mb-1">{s.title}</div>
          <p class="text-sm leading-relaxed text-slate-500 m-0">{s.desc}</p>
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Crear `FinalCtaPerdidos.astro`**

Crear `web/src/components/landing/FinalCtaPerdidos.astro` con:

```astro
---
import { ROUTES } from "../../lib/config.js";
---

<section class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 pb-16 lg:pb-20">
  <div
    class="bg-orange-600 rounded-[28px] p-10 sm:p-12 lg:p-14 relative overflow-hidden"
  >
    <div
      class="absolute -right-10 -top-12 w-60 h-60 rounded-full bg-white/10"
    ></div>
    <div
      class="absolute right-24 -bottom-16 w-44 h-44 rounded-full bg-white/[.08]"
    ></div>
    <div class="relative max-w-2xl">
      <h2
        class="font-extrabold text-3xl sm:text-4xl leading-[1.1] text-white tracking-tight mb-4"
        style="letter-spacing:-.03em;"
      >
        ¿Perdiste una mascota o encontraste una?
      </h2>
      <p class="text-base sm:text-lg text-orange-100 mb-7">
        Reportalo ahora. Es gratis y toma menos de dos minutos.
      </p>
      <div class="flex flex-wrap gap-3.5">
        <a
          href={ROUTES.adminLostNew}
          class="bg-white text-orange-700 font-extrabold text-base px-7 py-4 rounded-2xl hover:-translate-y-0.5 hover:shadow-xl transition-all"
        >
          Reportar pérdida
        </a>
        <a
          href="/perdidos"
          class="bg-white/15 hover:bg-white/25 text-white font-bold text-base px-7 py-4 rounded-2xl border-[1.5px] border-white/50 transition-colors"
        >
          Ver reportes
        </a>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Quitar el CTA autorreferencial de `MiniMap.astro`**

`MiniMap` ahora vive dentro de `/perdidos`, así que su botón "Ver mapa completo → /perdidos" apunta a la misma página. Quitar ese botón.

En `web/src/components/landing/MiniMap.astro`, borrar el bloque del anchor completo (líneas ~24-41), es decir desde:
```astro
      <a
        href="/perdidos"
        class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] px-6 py-3.5 rounded-[13px] inline-flex items-center gap-2.5 transition-colors"
      >
```
hasta su cierre:
```astro
        Ver mapa completo
      </a>
```
(incluyendo el `<svg>` interno). El párrafo descriptivo que está encima del anchor se conserva.

- [ ] **Step 4: Componer la landing de perdidos**

En `web/src/pages/perdidos/index.astro`, agregar los imports debajo de los existentes (tras `import { ROUTES } from "../../lib/config.js";`):

```astro
import ComoReportar from "../../components/landing/ComoReportar.astro";
import MiniMap from "../../components/landing/MiniMap.astro";
import FinalCtaPerdidos from "../../components/landing/FinalCtaPerdidos.astro";
```

Luego insertar los componentes en el `<main>`. La estructura final del `<main>` debe quedar: hero (sección existente, naranja) → `<ComoReportar />` → `<MiniMap />` → grilla (sección existente) → `<FinalCtaPerdidos />`.

- Insertar `<ComoReportar />` y `<MiniMap />` (en ese orden) entre el cierre de la sección hero (`</section>` que cierra el bloque `bg-orange-50 border-b border-orange-200`) y la apertura de la sección de la grilla (`<section class="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-14 lg:py-16">`).
- Insertar `<FinalCtaPerdidos />` inmediatamente antes de `</main>` (después de la sección de la grilla).

- [ ] **Step 5: Build**

Run: `pnpm build:web`
Expected: build OK, sin imports rotos. Ya no quedan componentes sin usar (MiniMap volvió a usarse).

- [ ] **Step 6: Verificación visual**

Run: `pnpm dev:web` y abrir `http://localhost:4321/perdidos`
Verificar: hero naranja + "Cómo reportar" (3 pasos naranjas) + mini-mapa (sin el botón "Ver mapa completo") + grilla de perdidos + CTA final naranja ("¿Perdiste una mascota o encontraste una?"). Todos los acentos en orange, ninguno emerald. El botón "Reportar pérdida" lleva al alta del admin.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/landing/ComoReportar.astro web/src/components/landing/FinalCtaPerdidos.astro web/src/components/landing/MiniMap.astro web/src/pages/perdidos/index.astro
git commit -m "feat(web): /perdidos como landing completa del mundo perdidos"
```

---

## Verificación final (tras las 4 tareas)

1. `pnpm build:web` corre limpio.
2. Nav en todas las páginas: dos links color-codeados + Ingresar; sin botón "Publicar mascota".
3. Home (`/`): hub con hero corto + dos cards (verde/naranja) + Values + Testimonios. Sin grillas ni mapa.
4. `/adopciones`: hero verde + cómo adoptar + grilla + refugios + CTA verde. Sólo emerald.
5. `/perdidos`: hero naranja + cómo reportar + mapa + grilla + CTA naranja. Sólo orange.
6. Coherencia de color de punta a punta (nav → hero → botones → pin del mapa del admin para perdidos).
7. Responsivo: nav con ambos links visibles en mobile; cards del hub apiladas; grillas a 1–2 columnas.
8. No quedan componentes `.astro` sin uso ni imports rotos (`Hero`, `HowItWorks`, `AdoptionGrid`, `LostBand` borrados).
9. Links del footer a refugios apuntan a `/adopciones#refugios` y funcionan.
