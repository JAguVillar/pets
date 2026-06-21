# Selector de ubicación en mapa para reportes de perdidos

**Fecha:** 2026-06-20
**Estado:** Diseño aprobado, pendiente de plan de implementación

## Problema

Hoy, en el form de reporte de mascotas perdidas (`admin/app/components/LostPetForm.vue`),
la ubicación se carga con **tres campos manuales y tipeados a mano**:

- **Lugar** (`last_seen_location`): texto libre. El nombre ("Plaza Mitre", "Honduras y
  Thames") sale de lo que la persona escribe; no viene de ningún lado.
- **Latitud** / **Longitud** (`last_seen_lat` / `last_seen_lng`): dos `UInputNumber` donde
  hay que tipear coordenadas a mano (`-34.5` / `-58.4`). En la práctica nadie sabe sus
  coordenadas, así que casi nunca se llenan bien.

El resultado: las coordenadas quedan vacías o mal, y el nombre del lugar y las coords no
están sincronizados.

## Objetivo

Invertir la captura: la persona **marca un punto en un mapa** (o busca una dirección/lugar),
y de ahí se derivan **a la vez** el nombre legible del lugar y las coordenadas exactas.
Nadie tipea coordenadas a mano y el texto siempre corresponde al punto del mapa.

Alcance de esta iteración: **solo el form del admin** (la captura). La visualización en la
web pública y/o en la tabla del admin queda para una iteración futura.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Interacción | Buscador + mapa interactivo (marcador arrastrable + click) |
| Lib de mapa | Leaflet vanilla + tiles raster de OpenStreetMap (sin API key) |
| Geocoding | Nominatim (OSM), vía **proxy en el server de Nuxt** |
| Nombre del lugar | Autocompletado por reverse-geocoding, pero **editable** |
| Quitar ubicación | Botón explícito que limpia nombre + coords (reporte sin ubicación es válido) |
| "Usar mi ubicación" | **No** se incluye (el form lo carga personal del refugio, no está en el lugar) |
| Vista default del mapa | Santiago del Estero capital: `lat -27.7951, lng -64.2615`, zoom ~13 |

## Arquitectura

### 1. Componente nuevo: `LocationPicker.vue`

Componente aislado y reusable (a futuro sirve también para la web pública). Encapsula
**toda** la lógica de Leaflet y Nominatim — el form no sabe nada de mapas.

**Interfaz (v-model):**
```
modelValue = { location: string|null, lat: number|null, lng: number|null }
```
Emite `update:modelValue` cuando cambia cualquiera de los tres.

**UI, de arriba hacia abajo:**
- **Input de búsqueda**: debounce ~400ms; al tipear consulta forward-geocode y muestra
  una lista de sugerencias. Al elegir una → centra el mapa, pone el marcador, autocompleta
  nombre + coords.
- **Mapa Leaflet**: marcador arrastrable. Click en el mapa o arrastre del marcador →
  reverse-geocode → actualiza el nombre (editable) y guarda lat/lng.
- **Input de nombre del lugar** (editable): muestra lo autocompletado; la persona puede
  pulirlo a mano sin perder las coords.
- **Botón "Quitar ubicación"**: limpia nombre + coords (los tres a null).

**Inicialización (SSR):** Leaflet es client-only. El componente se monta dentro de
`<ClientOnly>` y se inicializa Leaflet en `onMounted` (import dinámico de `leaflet`).

### 2. Geocoding vía proxy en el server

Para respetar la política de uso de Nominatim (User-Agent identificable, throttling, evitar
bloqueos) y no exponer detalles en el cliente, dos rutas en el server de Nuxt:

- `server/api/geocode.get.js` — forward: `?q=<texto>` → lista de `{ name, lat, lng }`.
- `server/api/reverse.get.js` — reverse: `?lat=&lng=` → `{ name }`.

Ambas le pegan a Nominatim con un `User-Agent` propio que identifica la app. Pueden cachear
en memoria de forma simple para no repetir requests.

### 3. Cambios en `LostPetForm.vue`

- Se quitan los `UFormField` de Lugar / Latitud / Longitud (hoy líneas ~285-318).
- En la sección "Dónde y cuándo" se agrega:
  ```
  <ClientOnly>
    <LocationPicker v-model="locationState" />
  </ClientOnly>
  ```
- `locationState` es un computed/proxy sobre los tres campos del `state`
  (`last_seen_location`, `last_seen_lat`, `last_seen_lng`), de modo que **el payload y la DB
  no cambian** — solo cambia cómo se llenan.
- Se mantiene la validación zod existente: lat/lng deben informarse juntas, rangos
  (`lat ∈ [-90,90]`, `lng ∈ [-180,180]`).

### 4. Comportamiento al editar

- Reporte con coords → mapa centrado en el punto guardado, marcador puesto, nombre cargado.
- Reporte sin coords → mapa en la vista default (Santiago del Estero capital), sin marcador
  hasta que la persona elija/busque/clickee.

## Flujo de datos

```
[usuario tipea en buscador]
    → debounce → GET /api/geocode?q=... → Nominatim forward
    → lista de sugerencias → elige una
    → set marcador + center + { location, lat, lng } → emit update:modelValue

[usuario clickea/arrastra marcador]
    → GET /api/reverse?lat=&lng=... → Nominatim reverse
    → set nombre (editable) + { lat, lng } → emit update:modelValue

[usuario edita el nombre a mano]
    → set location (coords intactas) → emit update:modelValue

[usuario toca "Quitar ubicación"]
    → { location: null, lat: null, lng: null } → emit update:modelValue
```

## Manejo de errores / edge cases

- **Búsqueda sin resultados** → mensaje "No encontramos ese lugar".
- **Nominatim caído / error de red** → no rompe el form; el input de nombre sigue editable a
  mano (degradación elegante). El mapa sigue permitiendo marcar el punto (coords sí salen
  del click aunque el reverse-geocode falle).
- **Reporte sin ubicación** → válido; se guarda con los tres campos en null.
- **Throttling de Nominatim** → el debounce del buscador + el reverse solo al soltar el
  marcador mantienen el volumen bajo el límite (~1 req/seg).

## Testing

- `LocationPicker`: emite el objeto correcto al elegir sugerencia, al mover el marcador, al
  editar el nombre y al quitar ubicación; arranca en la vista default sin coords y centrado
  cuando las hay.
- Rutas server `geocode` / `reverse`: mapean la respuesta de Nominatim al shape esperado y
  degradan ante error.
- `LostPetForm`: el payload final sigue teniendo `last_seen_location/lat/lng` y pasa la
  validación zod (lat/lng juntas).

## Fuera de alcance (futuras iteraciones)

- CTA "Ver ubicación" + mapa en la tabla del admin (`admin/app/pages/perdidos/index.vue`).
- Mapa embebido en el detalle de la web pública (`web/src/pages/perdidos/[id].astro`,
  hoy linkea a Google Maps).
- Reemplazar el `MiniMap` decorativo de la landing por uno real con marcadores.
