<script setup>
const { createAdoption, loading } = useAdoptions();
const toast = useToast();
const router = useRouter();
const formRef = ref(null);

async function onSubmit(payload) {
  try {
    const row = await createAdoption(payload);
    formRef.value?.commit();
    toast.add({ title: "Publicación creada", color: "success" });
    router.push(`/adopciones/${row.id}`);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div>
      <h2 class="text-xl font-semibold">Publicar mascota en adopción</h2>
      <p class="text-sm text-muted">Completá los datos de la mascota. Después podés editarlos.</p>
    </div>

    <AdopcionForm
      ref="formRef"
      :submitting="loading"
      submit-label="Publicar"
      @submit="onSubmit"
    />
  </div>
</template>
