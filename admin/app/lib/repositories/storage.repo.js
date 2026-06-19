// Helpers para Supabase Storage. La convención de path es
//   <user_id>/<uuid>.<ext>
// para que las policies de RLS solo permitan al dueño subir/modificar
// archivos en su propia carpeta.

const BUCKET = "pet_images";

function getExt(file) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(file.name ?? "");
  return m ? m[1].toLowerCase() : "bin";
}

export function createStorageRepo(supabase) {
  return {
    /**
     * Sube un archivo al bucket pet_images. Devuelve { path, publicUrl }.
     */
    async uploadPetImage(file, { userId } = {}) {
      const owner = userId ?? (await supabase.auth.getUser()).data?.user?.id;
      if (!owner) throw new Error("Necesitás iniciar sesión");

      const path = `${owner}/${crypto.randomUUID()}.${getExt(file)}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { path, publicUrl: data.publicUrl };
    },

    /**
     * Borra una imagen por URL pública (la convierte a path) o por path directo.
     */
    async deletePetImage(pathOrUrl) {
      const path = pathOrUrl.includes("/storage/v1/object/public/")
        ? pathOrUrl.split(`/${BUCKET}/`)[1]
        : pathOrUrl;

      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
    },
  };
}
