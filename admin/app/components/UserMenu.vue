<script setup>
defineProps({
  collapsed: { type: Boolean, default: false },
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const { profile, isAdmin, clearProfile } = useProfile();

const displayName = computed(
  () => profile.value?.full_name || user.value?.email || "—",
);

const initials = computed(() => {
  const src = profile.value?.full_name || user.value?.email || "";
  if (!src) return "?";
  const parts = src.split(/[\s@]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
});

async function logout() {
  await supabase.auth.signOut();
  clearProfile();
  await router.push("/login");
}

const items = [
  [
    {
      label: "Mi perfil",
      icon: "i-lucide-user",
      to: "/perfil",
    },
  ],
  [
    {
      label: "Cerrar sesión",
      icon: "i-lucide-log-out",
      onSelect: logout,
    },
  ],
];
</script>

<template>
  <UDropdownMenu :items="items" :ui="{ content: 'w-56' }">
    <button
      type="button"
      class="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-elevated/50 transition-colors text-left"
    >
      <UAvatar size="sm" :alt="displayName">{{ initials }}</UAvatar>
      <div v-if="!collapsed" class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ displayName }}</p>
        <p
          class="text-xs"
          :class="isAdmin ? 'text-primary font-medium' : 'text-muted'"
        >
          {{ isAdmin ? "Admin" : "Usuario" }}
        </p>
      </div>
      <UIcon
        v-if="!collapsed"
        name="i-lucide-chevrons-up-down"
        class="w-4 h-4 text-muted shrink-0"
      />
    </button>
  </UDropdownMenu>
</template>
