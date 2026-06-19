import { createCatalogsRepo } from "@/lib/repositories/catalogs.repo";

export function useCatalogs() {
  const supabase = useSupabaseClient();
  const repo = createCatalogsRepo(supabase);

  const loading = ref(false);
  const error = ref(null);

  function wrap(fn) {
    return async (...args) => {
      loading.value = true;
      error.value = null;
      try {
        return await fn(...args);
      } catch (e) {
        error.value = e;
        throw e;
      } finally {
        loading.value = false;
      }
    };
  }

  return {
    loading,
    error,
    listSpecies: wrap(repo.listSpecies),
    listBreeds: wrap(repo.listBreeds),
    listColors: wrap(repo.listColors),
    listCoatTypes: wrap(repo.listCoatTypes),
    listSexes: wrap(repo.listSexes),
    listSizes: wrap(repo.listSizes),
    listPetStatus: wrap(repo.listPetStatus),
    listAdoptionStatus: wrap(repo.listAdoptionStatus),
    listOrganizations: wrap(repo.listOrganizations),
  };
}
