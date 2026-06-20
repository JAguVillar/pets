<script setup>
const { createLostPet, loading } = useLostPets();
const toast = useToast();
const router = useRouter();

async function onSubmit(payload) {
  try {
    const row = await createLostPet(payload);
    toast.add({ title: "Reporte creado", color: "success" });
    router.push(`/perdidos/${row.id}`);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4">
    <div>
      <h2 class="text-xl font-semibold">Reportar mascota perdida</h2>
      <p class="text-sm text-muted">
        Completá la información que tengas. Cuanta más, más chances de reencuentro.
      </p>
    </div>

    <LostPetForm
      :submitting="loading"
      submit-label="Publicar reporte"
      @submit="onSubmit"
    />
  </div>
</template>
