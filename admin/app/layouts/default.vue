<script setup>
const user = useSupabaseUser();
const route = useRoute();
const { profile, loadMyProfile } = useProfile();

const open = ref(false);

const links = [
  [
    {
      label: "Inicio",
      icon: "i-lucide-home",
      to: "/",
      onSelect: () => (open.value = false),
    },
  ],
  [
    {
      label: "Adopciones",
      icon: "i-lucide-heart-handshake",
      to: "/adopciones",
      onSelect: () => (open.value = false),
    },
  ],
];

const flatLinks = computed(() => links.flat());

const pageTitle = computed(() => {
  const match = [...flatLinks.value]
    .sort((a, b) => b.to.length - a.to.length)
    .find((l) => route.path === l.to || route.path.startsWith(l.to + "/"));
  return match?.label ?? "Panel";
});

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
    >
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />
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
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="main">
      <template #header>
        <UDashboardNavbar>
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #title>
            <div class="font-medium">{{ pageTitle }}</div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
