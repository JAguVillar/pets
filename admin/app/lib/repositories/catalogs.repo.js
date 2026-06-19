// Repositorio de catálogos: tablas chicas, casi inmutables, lectura pública.
// Los métodos están separados para que cada pantalla traiga solo lo que necesita.

export function createCatalogsRepo(supabase) {
  async function listSimple(table, order = "name") {
    const { data, error } = await supabase.from(table).select("*").order(order);
    if (error) throw error;
    return data ?? [];
  }

  return {
    listSpecies() {
      return listSimple("species");
    },

    async listBreeds({ speciesId } = {}) {
      let q = supabase.from("breeds").select("*").order("name");
      if (speciesId) q = q.eq("species_id", speciesId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    listColors() {
      return listSimple("colors");
    },

    listCoatTypes() {
      return listSimple("coat_types");
    },

    listSexes() {
      return listSimple("sexes");
    },

    listSizes() {
      return listSimple("sizes", "sort_order");
    },

    listPetStatus() {
      return listSimple("pet_status");
    },

    listAdoptionStatus() {
      return listSimple("adoption_status");
    },

    listOrganizations() {
      return listSimple("organizations");
    },
  };
}
