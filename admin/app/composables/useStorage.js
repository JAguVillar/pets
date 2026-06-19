import { createStorageRepo } from "@/lib/repositories/storage.repo";

export function useStorage() {
  const supabase = useSupabaseClient();
  const repo = createStorageRepo(supabase);

  const uploading = ref(false);
  const error = ref(null);

  async function uploadPetImage(file) {
    uploading.value = true;
    error.value = null;
    try {
      return await repo.uploadPetImage(file);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      uploading.value = false;
    }
  }

  async function deletePetImage(pathOrUrl) {
    error.value = null;
    try {
      await repo.deletePetImage(pathOrUrl);
    } catch (e) {
      error.value = e;
      throw e;
    }
  }

  return { uploading, error, uploadPetImage, deletePetImage };
}
