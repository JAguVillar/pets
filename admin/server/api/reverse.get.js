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
