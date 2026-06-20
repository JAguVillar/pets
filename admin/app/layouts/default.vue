<script setup>
const user = useSupabaseUser();
const route = useRoute();
const { profile, isAdmin, loadMyProfile } = useProfile();

const open = ref(false);

const links = computed(() => {
  const base = [
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
      {
        label: "Perdidos",
        icon: "i-lucide-search-x",
        to: "/perdidos",
        onSelect: () => (open.value = false),
      },
    ],
  ];
  if (isAdmin.value) {
    base.push([
      {
        label: "Organizaciones",
        icon: "i-lucide-building-2",
        to: "/organizaciones",
        onSelect: () => (open.value = false),
      },
    ]);
  }
  return base;
});

const flatLinks = computed(() => links.value.flat());

// Rutas que viven fuera del sidebar pero queremos titular igual.
const offNavTitles = {
  "/perfil": "Mi perfil",
  "/organizaciones": "Organizaciones",
};

const pageTitle = computed(() => {
  for (const [path, label] of Object.entries(offNavTitles)) {
    if (route.path === path || route.path.startsWith(path + "/")) return label;
  }
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
