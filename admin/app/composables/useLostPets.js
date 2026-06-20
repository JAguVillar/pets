import { createLostPetsRepo } from "@/lib/repositories/lostPets.repo";

export function useLostPets() {
  const supabase = useSupabaseClient();
  const repo = createLostPetsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadLostPets({
    page = 1,
    pageSize = 10,
    q,
    statusId,
    sexId,
    speciesId,
    sort,
  } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await repo.list({
        from,
        to,
        q,
        statusId,
        sexId,
        speciesId,
        sort,
      });
      return {
        data: data ?? [],
        count: count ?? 0,
        page,
        pageSize,
      };
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getLostPet(id) {
    loading.value = true;
    error.value = null;
    try {
      return await repo.getById(id);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createLostPet(payload) {
    loading.value = true;
    error.value = null;
    try {
      return await repo.create(payload);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateLostPet(id, payload) {
    loading.value = true;
    error.value = null;
    try {
      return await repo.update(id, payload);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLostPet(id) {
    loading.value = true;
    error.value = null;
    try {
      return await repo.delete(id);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    loadLostPets,
    getLostPet,
    createLostPet,
    updateLostPet,
    deleteLostPet,
  };
}
