function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function createOrganizationsRepo(supabase) {
  return {
    async list({ from, to, q } = {}) {
      let query = supabase
        .from("organizations")
        .select("*", { count: "exact" })
        .order("name", { ascending: true });

      if (q && q.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(`name.ilike.${term},email.ilike.${term}`);
      }
      if (from !== undefined && to !== undefined) query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },

    async getById(id) {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const insert = {
        ...payload,
        slug: payload.slug?.trim() || slugify(payload.name),
      };
      const { data, error } = await supabase
        .from("organizations")
        .insert(insert)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { id: _id, ...safe } = payload;
      void _id;
      if (safe.slug) safe.slug = safe.slug.trim();
      const { data, error } = await supabase
        .from("organizations")
        .update(safe)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { data, error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
