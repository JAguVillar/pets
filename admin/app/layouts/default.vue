<script setup>
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const route = useRoute();
const { profile, isAdmin, loadMyProfile, clearProfile } = useProfile();

const open = ref(false);

const links = [
  {
    label: "Inicio",
    icon: "i-lucide-home",
    to: "/",
    onSelect: () => (open.value = false),
  },
  {
    label: "Adopciones",
    icon: "i-lucide-heart-handshake",
    to: "/adopciones",
    onSelect: () => (open.value = false),
  },
];

const pageTitle = computed(() => {
  const match = [...links]
    .sort((a, b) => b.to.length - a.to.length)
    .find((l) => route.path === l.to || route.path.startsWith(l.to + "/"));
  return match?.label ?? "Panel";
});

const greeting = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name;
  return user.value?.email ?? "";
});

async function logout() {
  await supabase.auth.signOut();
  clearProfile();
  router.push("/login");
}

watchEffect(() => {
  if (user.value && !profile.value) {
    loadMyProfile().catch(() => {});
  }
});

watch(
  () => route.path,
  () => {
    open.value = false;
  },
);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header>
        <div class="flex items-center gap-2 px-2 py-1">
          <UIcon name="i-lucide-paw-print" class="w-6 h-6 text-primary" />
          <span class="font-bold">Pets</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <div v-if="!collapsed" class="px-2 py-1 text-xs text-muted">
          <p class="truncate">{{ greeting }}</p>
          <p v-if="isAdmin" class="text-primary font-medium">Admin</p>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="main">
      <template #header>
        <UDashboardNavbar :ui="{ right: 'gap-2' }">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #title>
            <div class="font-medium">
              {{ pageTitle }}
            </div>
          </template>

          <template #right>
            <UButton
              icon="i-lucide-log-out"
              variant="ghost"
              color="neutral"
              @click="logout"
            />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
