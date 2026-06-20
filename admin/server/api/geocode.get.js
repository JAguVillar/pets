// Proxy a Nominatim (OSM) para búsqueda de lugares (forward geocoding).
// Centralizado en el server para mandar un User-Agent identificable y
// respetar la política de uso de Nominatim. Cache simple en memoria.
const cache = new Map();
const MAX_CACHE = 500;
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
    if (cache.size >= MAX_CACHE) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(query, mapped);
    return mapped;
  } catch (e) {
    console.warn("[api/geocode] Nominatim falló:", e.message);
    return [];
  }
});
