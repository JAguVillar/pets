import { createProfilesRepo } from "@/lib/repositories/profiles.repo";

export function useProfile() {
  const supabase = useSupabaseClient();
  const repo = createProfilesRepo(supabase);

  const loading = ref(false);
  const error = ref(null);
  const profile = useState("profile:current", () => null);

  const isAdmin = computed(() => profile.value?.role === "admin");

  async function loadMyProfile() {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.getMyProfile();
      profile.value = data;
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateMyProfile(payload) {
    loading.value = true;
    error.value = null;
    try {
      const data = await repo.updateMyProfile(payload);
      profile.value = data;
      return data;
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function clearProfile() {
    profile.value = null;
  }

  return {
    loading,
    error,
    profile,
    isAdmin,
    loadMyProfile,
    updateMyProfile,
    clearProfile,
  };
}
