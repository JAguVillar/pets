<script setup>
const user = useSupabaseUser();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <UCard class="max-w-md w-full">
      <template #header>
        <h1 class="text-xl font-semibold">Pets — Admin</h1>
      </template>

      <p class="text-sm text-muted">
        Setup base listo. Próximo paso: definir el schema de Supabase y armar el
        layout del dashboard.
      </p>

      <template #footer>
        <p class="text-xs text-muted">
          Sesión:
          <span v-if="user">{{ user.email }}</span>
          <span v-else>sin iniciar</span>
        </p>
      </template>
    </UCard>
  </div>
</template>
