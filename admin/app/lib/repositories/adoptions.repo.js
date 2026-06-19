const SELECT_FULL = `
  *,
  breed:breed_id (id, slug, name, species:species_id (id, slug, name, icon)),
  status:status_id (id, slug, name, color),
  color:color_id (id, slug, name),
  coat_type:coat_type_id (id, slug, name),
  sex:sex_id (id, slug, name),
  size:size_id (id, slug, name, sort_order),
  organization:organization_id (id, slug, name, verified, email, phone)
`;

export function createAdoptionsRepo(supabase) {
  return {
    async list({ from, to } = {}) {
      let q = supabase
        .from("animals_for_adoption")
        .select(SELECT_FULL, { count: "exact" })
        .order("created_at", { ascending: false });

      if (from !== undefined && to !== undefined) q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async getById(id) {
      const { data, error } = await supabase
        .from("animals_for_adoption")
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
        .from("animals_for_adoption")
        .insert({ ...payload, owner_user_id: user.id })
        .select(SELECT_FULL)
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      // ignoramos owner_user_id y id si vienen en el payload
      const { owner_user_id, id: _id, ...safe } = payload;
      void owner_user_id;
      void _id;

      const { data, error } = await supabase
        .from("animals_for_adoption")
        .update(safe)
        .eq("id", id)
        .select(SELECT_FULL)
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("animals_for_adoption")
        .delete()
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
