<script setup>
const { profile, isAdmin } = useProfile();
const user = useSupabaseUser();

const name = computed(() => profile.value?.full_name || user.value?.email || "");
</script>

<template>
  <div class="p-6 space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Hola{{ name ? `, ${name}` : "" }}</h1>
      <p class="text-muted text-sm">
        {{ isAdmin ? "Tenés acceso de administrador." : "Gestioná tus publicaciones desde acá." }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard
        as="NuxtLink"
        to="/adopciones"
        class="hover:border-primary transition-colors"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-heart-handshake" class="w-8 h-8 text-primary" />
          <div>
            <h3 class="font-semibold">Adopciones</h3>
            <p class="text-sm text-muted mt-1">
              Publicá una mascota en adopción o gestioná las existentes.
            </p>
          </div>
        </div>
      </UCard>

      <UCard
        as="NuxtLink"
        to="/perdidos"
        class="hover:border-primary transition-colors"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-search-x" class="w-8 h-8 text-primary" />
          <div>
            <h3 class="font-semibold">Perdidos</h3>
            <p class="text-sm text-muted mt-1">
              Reportá una mascota perdida o encontrada y seguila desde acá.
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
