# Selector de ubicación en mapa para perdidos — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la carga manual de Lugar + Latitud + Longitud en el form de reportes de perdidos por un selector en mapa (buscador + Leaflet) que autocompleta nombre y coordenadas.

**Architecture:** Un componente aislado `LocationPicker.vue` encapsula Leaflet y la búsqueda; el geocoding (forward y reverse) pasa por dos rutas proxy del server de Nuxt que le pegan a Nominatim (OSM). El form sigue guardando los mismos tres campos en la DB — solo cambia cómo se llenan.

**Tech Stack:** Nuxt 4 (admin), Vue 3 `<script setup>`, Nuxt UI 4, Leaflet vanilla + tiles raster de OpenStreetMap, Nominatim vía proxy en `server/api`.

## Global Constraints

- **Todo en JavaScript, nunca TypeScript.** (preferencia explícita del usuario)
- **Textos de UI en español rioplatense.**
- El admin usa Nuxt 4 con `srcDir = app/`: componentes en `admin/app/components/`, composables en `admin/app/composables/`, rutas server en `admin/server/api/`.
- Componentes de UI: Nuxt UI 4 (`UInput`, `UButton`, `UFormField`, etc.), auto-importados.
- **No se agrega framework de tests.** Verificación manual corriendo `pnpm dev:admin`.
- Geocoding: Leaflet vanilla + tiles de OSM + Nominatim **vía proxy en el server** (nunca pegarle a Nominatim desde el cliente).
- Vista default del mapa cuando no hay coords: **Santiago del Estero capital**, `lat -27.7951, lng -64.2615`, zoom 13.
- Componentes de `admin/app/components/` se auto-importan (no hace falta `import`).

---

### Task 1: Rutas proxy de geocoding en el server

**Files:**
- Create: `admin/server/api/geocode.get.js`
- Create: `admin/server/api/reverse.get.js`

**Interfaces:**
- Consumes: nada de tareas previas. Usa `defineEventHandler`, `getQuery` y `$fetch` (auto-importados por Nitro).
- Produces:
  - `GET /api/geocode?q=<texto>` → `Array<{ name: string, lat: number, lng: number }>` (array vacío si `q` < 3 chars o ante error).
  - `GET /api/reverse?lat=<num>&lng=<num>` → `{ name: string | null }` (`{ name: null }` si faltan params o ante error).

- [ ] **Step 1: Crear la ruta forward `geocode.get.js`**

Create `admin/server/api/geocode.get.js`:

```js
// Proxy a Nominatim (OSM) para búsqueda de lugares (forward geocoding).
// Centralizado en el server para mandar un User-Agent identificable y
// respetar la política de uso de Nominatim. Cache simple en memoria.
const cache = new Map();
const UA = "PetsApp/1.0 (reportes de mascotas perdidas)";

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);
  const query = String(q ?? "").trim();
  if (query.length < 3) return [];

  if (cache.has(query)) return cache.get(query);

  try {
    const results = await $fetch(
      "https://nominatim.openstreetmap.org/search",
      {
        query: {
          q: query,
          format: "jsonv2",
          limit: 5,
          "accept-language": "es",
          countrycodes: "ar",
        },
        headers: { "User-Agent": UA },
      },
    );
    const mapped = (results ?? []).map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
    cache.set(query, mapped);
    return mapped;
  } catch (e) {
    console.warn("[api/geocode] Nominatim falló:", e.message);
    return [];
  }
});
```

- [ ] **Step 2: Crear la ruta reverse `reverse.get.js`**

Create `admin/server/api/reverse.get.js`:

```js
// Proxy a Nominatim (OSM) para obtener el nombre de un punto (reverse geocoding).
const UA = "PetsApp/1.0 (reportes de mascotas perdidas)";

export default defineEventHandler(async (event) => {
  const { lat, lng } = getQuery(event);
  if (lat == null || lng == null) return { name: null };

  try {
    const r = await $fetch("https://nominatim.openstreetmap.org/reverse", {
      query: {
        lat,
        lon: lng,
        format: "jsonv2",
        "accept-language": "es",
      },
      headers: { "User-Agent": UA },
    });
    return { name: r?.display_name ?? null };
  } catch (e) {
    console.warn("[api/reverse] Nominatim falló:", e.message);
    return { name: null };
  }
});
```

- [ ] **Step 3: Verificar las rutas manualmente**

Run: `pnpm dev:admin`

Con el dev server corriendo, abrir en el navegador (o curl):
- `http://localhost:3000/api/geocode?q=Plaza%20Mitre%20Santiago%20del%20Estero`
  Esperado: array JSON con objetos `{ name, lat, lng }` (al menos 1 resultado en Santiago del Estero).
- `http://localhost:3000/api/geocode?q=ab`
  Esperado: `[]` (menos de 3 chars).
- `http://localhost:3000/api/reverse?lat=-27.7951&lng=-64.2615`
  Esperado: `{ "name": "…Santiago del Estero…" }`.
- `http://localhost:3000/api/reverse`
  Esperado: `{ "name": null }`.

- [ ] **Step 4: Commit**

```bash
git add admin/server/api/geocode.get.js admin/server/api/reverse.get.js
git commit -m "feat(admin): rutas proxy de geocoding (Nominatim) para perdidos"
```

---

### Task 2: Componente `LocationPicker.vue` montado en el form

**Files:**
- Modify: `admin/package.json` (agregar dependencia `leaflet`)
- Modify: `admin/nuxt.config.ts` (agregar CSS de Leaflet)
- Create: `admin/app/components/LocationPicker.vue`
- Modify: `admin/app/components/LostPetForm.vue` (montar el picker; los campos viejos quedan por ahora)

**Interfaces:**
- Consumes: `GET /api/geocode` y `GET /api/reverse` (Task 1).
- Produces: componente `LocationPicker` con `v-model` de forma `{ location: string|null, lat: number|null, lng: number|null }`. Emite `update:modelValue` al elegir sugerencia, mover/clickear el marcador, editar el nombre o quitar la ubicación.

- [ ] **Step 1: Instalar Leaflet**

Run: `pnpm --filter admin add leaflet`
Expected: `leaflet` aparece en `admin/package.json` → `dependencies`.

- [ ] **Step 2: Agregar el CSS de Leaflet a la config de Nuxt**

Modify `admin/nuxt.config.ts` — cambiar la línea del `css`:

```ts
  css: ["~/assets/css/main.css"],
```
por:
```ts
  css: ["~/assets/css/main.css", "leaflet/dist/leaflet.css"],
```

- [ ] **Step 3: Crear el componente `LocationPicker.vue`**

Create `admin/app/components/LocationPicker.vue`:

```vue
<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ location: null, lat: null, lng: null }),
  },
});
const emit = defineEmits(["update:modelValue"]);

// Vista default: Santiago del Estero capital.
const DEFAULT_CENTER = [-27.7951, -64.2615];
const DEFAULT_ZOOM = 13;

const mapEl = ref(null);
const name = ref(props.modelValue?.location ?? "");
const lat = ref(props.modelValue?.lat ?? null);
const lng = ref(props.modelValue?.lng ?? null);

const searchQuery = ref("");
const suggestions = ref([]);
const searching = ref(false);
const searchError = ref(false);

let L = null;
let map = null;
let marker = null;
let pinIcon = null;
let searchTimer;

function emitValue() {
  emit("update:modelValue", {
    location: name.value || null,
    lat: lat.value,
    lng: lng.value,
  });
}

function placeMarker(latitude, longitude) {
  lat.value = latitude;
  lng.value = longitude;
  if (!map) return;
  if (marker) {
    marker.setLatLng([latitude, longitude]);
  } else {
    marker = L.marker([latitude, longitude], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onPointChosen(p.lat, p.lng);
    });
  }
}

async function reverseLookup(latitude, longitude) {
  try {
    const res = await $fetch("/api/reverse", {
      query: { lat: latitude, lng: longitude },
    });
    if (res?.name) name.value = res.name;
  } catch {
    // Degradación: si Nominatim falla, el nombre queda editable a mano.
  }
}

async function onPointChosen(latitude, longitude) {
  placeMarker(latitude, longitude);
  await reverseLookup(latitude, longitude);
  emitValue();
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchError.value = false;
  const q = searchQuery.value.trim();
  if (q.length < 3) {
    suggestions.value = [];
    return;
  }
  searchTimer = setTimeout(runSearch, 400);
}

async function runSearch() {
  searching.value = true;
  searchError.value = false;
  try {
    suggestions.value = await $fetch("/api/geocode", {
      query: { q: searchQuery.value.trim() },
    });
    if (!suggestions.value.length) searchError.value = true;
  } catch {
    suggestions.value = [];
    searchError.value = true;
  } finally {
    searching.value = false;
  }
}

function selectSuggestion(s) {
  name.value = s.name;
  searchQuery.value = "";
  suggestions.value = [];
  placeMarker(s.lat, s.lng);
  if (map) map.setView([s.lat, s.lng], 16);
  emitValue();
}

function onNameEdit() {
  emitValue();
}

function clearLocation() {
  name.value = "";
  lat.value = null;
  lng.value = null;
  searchQuery.value = "";
  suggestions.value = [];
  if (marker && map) {
    map.removeLayer(marker);
    marker = null;
  }
  emitValue();
}

onMounted(async () => {
  const leaflet = await import("leaflet");
  L = leaflet.default ?? leaflet;

  pinIcon = L.divIcon({
    className: "location-pin",
    html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="#ea580c" stroke="#fff" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/></svg>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const center =
    lat.value != null && lng.value != null
      ? [lat.value, lng.value]
      : DEFAULT_CENTER;
  const zoom = lat.value != null ? 16 : DEFAULT_ZOOM;

  map = L.map(mapEl.value).setView(center, zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  }).addTo(map);

  if (lat.value != null && lng.value != null) {
    placeMarker(lat.value, lng.value);
  }

  map.on("click", (e) => onPointChosen(e.latlng.lat, e.latlng.lng));
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="space-y-3">
    <div class="relative">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Buscá una dirección o lugar…"
        :loading="searching"
        class="w-full"
        @input="onSearchInput"
      />
      <ul
        v-if="suggestions.length"
        class="absolute z-[1000] mt-1 w-full bg-default border border-default rounded-lg shadow-lg max-h-60 overflow-auto"
      >
        <li
          v-for="(s, i) in suggestions"
          :key="i"
          class="px-3 py-2 text-sm hover:bg-elevated cursor-pointer"
          @click="selectSuggestion(s)"
        >
          {{ s.name }}
        </li>
      </ul>
      <p v-if="searchError" class="text-xs text-error mt-1">
        No encontramos ese lugar. Probá con otra búsqueda o marcá el punto en el mapa.
      </p>
    </div>

    <div
      ref="mapEl"
      class="h-72 w-full rounded-lg overflow-hidden border border-default"
    />

    <div>
      <label class="block text-sm font-medium mb-1">
        Lugar
        <span class="text-muted font-normal">(editable)</span>
      </label>
      <UInput
        v-model="name"
        placeholder="Se completa al elegir un punto en el mapa"
        class="w-full"
        @input="onNameEdit"
      />
    </div>

    <div
      v-if="lat != null || name"
      class="flex items-center justify-between"
    >
      <span class="text-xs text-muted tabular-nums">
        <template v-if="lat != null">
          {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}
        </template>
        <template v-else>Sin coordenadas</template>
      </span>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="xs"
        @click="clearLocation"
      >
        Quitar ubicación
      </UButton>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Montar el picker en el form (sin sacar los campos viejos todavía)**

Modify `admin/app/components/LostPetForm.vue`.

Primero, en el `<script setup>`, después de la declaración de `state` (después de la línea 50, antes del `const schema`), agregar el computed que mapea el picker a los tres campos del state:

```js
const locationModel = computed({
  get: () => ({
    location: state.last_seen_location || null,
    lat: state.last_seen_lat,
    lng: state.last_seen_lng,
  }),
  set: (v) => {
    state.last_seen_location = v.location ?? "";
    state.last_seen_lat = v.lat;
    state.last_seen_lng = v.lng;
  },
});
```

Después, en el `<template>`, dentro de la `UCard` de "Dónde y cuándo", justo después del `UFormField` de "Recompensa" (después de la línea 283, antes del `UFormField` de "Lugar"), insertar:

```vue
        <div class="sm:col-span-2">
          <p class="text-sm font-medium mb-2">Ubicación</p>
          <ClientOnly>
            <LocationPicker v-model="locationModel" />
            <template #fallback>
              <div
                class="h-72 w-full rounded-lg border border-default bg-elevated/30 flex items-center justify-center text-muted text-sm"
              >
                Cargando mapa…
              </div>
            </template>
          </ClientOnly>
        </div>
```

(Los `UFormField` de Lugar / Latitud / Longitud se dejan donde están por ahora — sirven para ver que el picker escribe en el mismo state. Se quitan en la Task 3.)

- [ ] **Step 5: Verificar el picker manualmente**

Run: `pnpm dev:admin`

Ir a `http://localhost:3000/perdidos/nuevo` y en la sección "Dónde y cuándo":
1. El mapa carga centrado en Santiago del Estero capital.
2. Escribir "Plaza Mitre Santiago del Estero" en el buscador → aparecen sugerencias → elegir una → el mapa se centra, aparece el pin naranja, y el campo "Lugar" del picker se autocompleta. Verificar que el `UFormField` viejo "Lugar" y los de Latitud/Longitud (abajo) también se llenaron con el mismo valor.
3. Clickear otro punto del mapa → el pin se mueve y el nombre se actualiza (reverse geocoding).
4. Arrastrar el pin → idem.
5. Editar a mano el campo "Lugar" del picker → el `UFormField` viejo refleja el cambio; las coords no cambian.
6. Tocar "Quitar ubicación" → desaparece el pin y los tres campos viejos quedan vacíos.

- [ ] **Step 6: Commit**

```bash
git add admin/package.json admin/pnpm-lock.yaml admin/nuxt.config.ts admin/app/components/LocationPicker.vue admin/app/components/LostPetForm.vue
git commit -m "feat(admin): LocationPicker con Leaflet + búsqueda Nominatim"
```

> Nota: si el lockfile está en la raíz del monorepo (`pnpm-lock.yaml` en `Z:/Code/pets/`), ajustá la ruta del `git add` a la del lockfile real.

---

### Task 3: Quitar los campos manuales viejos

**Files:**
- Modify: `admin/app/components/LostPetForm.vue` (eliminar los `UFormField` de Lugar / Latitud / Longitud)

**Interfaces:**
- Consumes: `LocationPicker` + `locationModel` (Task 2).
- Produces: form final donde la ubicación se carga solo por el picker; el payload sigue teniendo `last_seen_location` / `last_seen_lat` / `last_seen_lng`.

- [ ] **Step 1: Eliminar los tres `UFormField` manuales**

Modify `admin/app/components/LostPetForm.vue`. Borrar el bloque de los tres campos viejos dentro de la `UCard` "Dónde y cuándo" (el `UFormField` de "Lugar" con `name="last_seen_location"`, el de "Latitud" con `name="last_seen_lat"` y el de "Longitud" con `name="last_seen_lng"` — originalmente líneas ~285-318):

```vue
        <UFormField
          label="Lugar"
          name="last_seen_location"
          hint="Barrio, calle o referencia"
          class="sm:col-span-2"
        >
          <UInput
            v-model="state.last_seen_location"
            placeholder="Palermo, esquina Honduras y Thames"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Latitud" name="last_seen_lat">
          <UInputNumber
            v-model="state.last_seen_lat"
            :step="0.000001"
            :min="-90"
            :max="90"
            placeholder="-34.5"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Longitud" name="last_seen_lng">
          <UInputNumber
            v-model="state.last_seen_lng"
            :step="0.000001"
            :min="-180"
            :max="180"
            placeholder="-58.4"
            class="w-full"
          />
        </UFormField>
```

El picker dentro del `<ClientOnly>` (agregado en Task 2) queda como única forma de cargar la ubicación.

- [ ] **Step 2: Verificar crear un reporte nuevo**

Run: `pnpm dev:admin`

En `http://localhost:3000/perdidos/nuevo`:
1. Llenar los campos requeridos (estado) + un nombre.
2. Buscar y elegir un punto en el mapa → ver el pin y el nombre.
3. Publicar.
4. En la tabla `/perdidos`, la fila nueva muestra el lugar en la columna "Última vez vista".
5. En Supabase (o entrando a editar), confirmar que `last_seen_location`, `last_seen_lat` y `last_seen_lng` quedaron guardados.

- [ ] **Step 3: Verificar editar un reporte existente**

Abrir `/perdidos/<id>/editar` de un reporte que tenga coordenadas (alguno seedeado):
1. El mapa arranca centrado en el punto guardado con el pin puesto y el nombre cargado.
2. Cambiar el punto → guardar → confirmar que se actualizó.
3. Abrir uno SIN coordenadas → el mapa arranca en Santiago del Estero capital, sin pin.

- [ ] **Step 4: Verificar quitar ubicación**

En un reporte con ubicación, tocar "Quitar ubicación" → guardar → confirmar que los tres campos quedan en `null` y el form no tira error de validación.

- [ ] **Step 5: Commit**

```bash
git add admin/app/components/LostPetForm.vue
git commit -m "feat(admin): reemplazar carga manual de ubicación por el mapa"
```

---

## Notas de verificación final

- El form completo (`/perdidos/nuevo` y `/perdidos/<id>/editar`) carga ubicación solo por mapa/buscador.
- La validación zod existente (`last_seen_lat`/`lng` juntas, rangos) sigue intacta y siempre pasa porque el picker setea ambas coords juntas o ambas en null.
- Si Nominatim está caído: la búsqueda muestra el mensaje de error y el mapa sigue permitiendo marcar el punto (las coords salen del click aunque el reverse falle); el nombre queda editable a mano.

## Fuera de alcance (futuras iteraciones)

- CTA "Ver ubicación" + mapa en la tabla del admin.
- Mapa embebido en el detalle de la web pública (hoy linkea a Google Maps).
- Reemplazar el `MiniMap` decorativo de la landing.
