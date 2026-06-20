<script setup>
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { getLostPet, updateLostPet, loading } = useLostPets();
const item = ref(null);
const loadingInitial = ref(true);

onMounted(async () => {
  try {
    item.value = await getLostPet(route.params.id);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    loadingInitial.value = false;
  }
});

async function onSubmit(payload) {
  try {
    await updateLostPet(route.params.id, payload);
    toast.add({ title: "Cambios guardados", color: "success" });
    router.push(`/perdidos/${route.params.id}`);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div>
      <h2 class="text-xl font-semibold">Editar reporte</h2>
    </div>

    <div v-if="loadingInitial" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
    </div>

    <LostPetForm
      v-else-if="item"
      :initial="item"
      :submitting="loading"
      submit-label="Guardar cambios"
      @submit="onSubmit"
    />

    <UAlert
      v-else
      icon="i-lucide-alert-circle"
      color="error"
      title="No encontrado"
      description="El reporte que buscás no existe o no podés verlo."
    />
  </div>
</template>
