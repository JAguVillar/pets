import { createAdoptionsRepo } from "@/lib/repositories/adoptions.repo";

export function useAdoptions() {
  const supabase = useSupabaseClient();
  const repo = createAdoptionsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadAdoptions({ page = 1, pageSize = 10 } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await repo.list({ from, to });
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

  async function getAdoption(id) {
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

  async function createAdoption(payload) {
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

  async function updateAdoption(id, payload) {
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

  async function deleteAdoption(id) {
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
    loadAdoptions,
    getAdoption,
    createAdoption,
    updateAdoption,
    deleteAdoption,
  };
}
