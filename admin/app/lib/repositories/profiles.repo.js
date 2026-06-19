export function createProfilesRepo(supabase) {
  return {
    async getMyProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateMyProfile(payload) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Necesitás iniciar sesión");

      // Nunca enviamos role ni id desde el cliente — role lo bloquea un trigger,
      // pero igual lo filtramos acá para que el error venga del cliente.
      const { role, id, ...safe } = payload;
      void role;
      void id;

      const { data, error } = await supabase
        .from("profiles")
        .update(safe)
        .eq("id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  };
}
