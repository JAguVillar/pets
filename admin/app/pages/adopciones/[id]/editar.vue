<script setup>
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { getAdoption, updateAdoption, loading } = useAdoptions();
const adoption = ref(null);
const loadingInitial = ref(true);
const formRef = ref(null);

onMounted(async () => {
  try {
    adoption.value = await getAdoption(route.params.id);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    loadingInitial.value = false;
  }
});

async function onSubmit(payload) {
  try {
    await updateAdoption(route.params.id, payload);
    formRef.value?.commit();
    toast.add({ title: "Cambios guardados", color: "success" });
    router.push(`/adopciones/${route.params.id}`);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div>
      <h2 class="text-xl font-semibold">Editar publicación</h2>
    </div>

    <div v-if="loadingInitial" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
    </div>

    <AdopcionForm
      v-else-if="adoption"
      ref="formRef"
      :initial="adoption"
      :submitting="loading"
      submit-label="Guardar cambios"
      @submit="onSubmit"
    />

    <UAlert
      v-else
      icon="i-lucide-alert-circle"
      color="error"
      title="No encontrado"
      description="La publicación que buscás no existe o no podés verla."
    />
  </div>
</template>
