const SELECT_FULL = `
  *,
  breed:breed_id (id, slug, name, species:species_id (id, slug, name, icon)),
  status:status_id (id, slug, name, color),
  color:color_id (id, slug, name),
  coat_type:coat_type_id (id, slug, name),
  sex:sex_id (id, slug, name),
  size:size_id (id, slug, name, sort_order)
`;

const SORTS = {
  recent: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  last_seen_recent: { column: "last_seen_date", ascending: false, nullsFirst: false },
  name_asc: { column: "name", ascending: true },
};

export function createLostPetsRepo(supabase) {
  return {
    async list({ from, to, q, statusId, sexId, speciesId, sort } = {}) {
      const sortDef = SORTS[sort] ?? SORTS.recent;

      const selectExpr = speciesId
        ? SELECT_FULL.replace(
            "breed:breed_id (id, slug, name, species:species_id (id, slug, name, icon))",
            "breed:breed_id!inner (id, slug, name, species:species_id!inner (id, slug, name, icon))",
          )
        : SELECT_FULL;

      let query = supabase
        .from("lost_pets")
        .select(selectExpr, { count: "exact" })
        .order(sortDef.column, {
          ascending: sortDef.ascending,
          nullsFirst: sortDef.nullsFirst ?? sortDef.ascending,
        });

      if (q && q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(`name.ilike.${term},last_seen_location.ilike.${term}`);
      }
      if (statusId) query = query.eq("status_id", statusId);
      if (sexId) query = query.eq("sex_id", sexId);
      if (speciesId) query = query.eq("breed.species_id", speciesId);

      if (from !== undefined && to !== undefined) query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async getById(id) {
      const { data, error } = await supabase
        .from("lost_pets")
        .select(SELECT_FULL)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Necesitás iniciar sesión");

      const { data, error } = await supabase
        .from("lost_pets")
        .insert({ ...payload, owner_user_id: user.id })
        .select(SELECT_FULL)
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { owner_user_id, id: _id, ...safe } = payload;
      void owner_user_id;
      void _id;

      const { data, error } = await supabase
        .from("lost_pets")
        .update(safe)
        .eq("id", id)
        .select(SELECT_FULL)
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("lost_pets")
        .delete()
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
