import { createOrganizationsRepo } from "@/lib/repositories/organizations.repo";

export function useOrganizations() {
  const supabase = useSupabaseClient();
  const repo = createOrganizationsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  async function loadOrganizations({ page = 1, pageSize = 20, q } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await repo.list({ from, to, q });
      return { data: data ?? [], count: count ?? 0, page, pageSize };
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getOrganization(id) {
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

  async function createOrganization(payload) {
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

  async function updateOrganization(id, payload) {
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

  async function deleteOrganization(id) {
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
    loadOrganizations,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}
