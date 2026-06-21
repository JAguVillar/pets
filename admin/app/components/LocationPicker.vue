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
        class="absolute z-[1100] mt-1 w-full bg-default border border-default rounded-lg shadow-lg max-h-60 overflow-auto"
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
