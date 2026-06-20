<script setup>
import * as z from "zod";

const user = useSupabaseUser();
const { profile, isAdmin, loadMyProfile, updateMyProfile, loading } = useProfile();
const toast = useToast();

const state = reactive({
  full_name: "",
  phone: "",
});

const schema = z.object({
  full_name: z.string().max(120).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

function hydrate() {
  state.full_name = profile.value?.full_name ?? "";
  state.phone = profile.value?.phone ?? "";
}

watch(profile, hydrate, { immediate: true });

onMounted(async () => {
  if (!profile.value) {
    try {
      await loadMyProfile();
    } catch (e) {
      toast.add({ title: "Error", description: e.message, color: "error" });
    }
  }
});

async function onSubmit({ data }) {
  const payload = { ...data };
  for (const k of ["full_name", "phone"]) {
    if (payload[k] === "") payload[k] = null;
  }
  try {
    await updateMyProfile(payload);
    toast.add({ title: "Perfil actualizado", color: "success" });
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
  }).format(new Date(iso));
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6 max-w-2xl">
    <div>
      <h2 class="text-xl font-semibold">Mi perfil</h2>
      <p class="text-sm text-muted">Actualizá tus datos de contacto.</p>
    </div>

    <UCard>
      <template #header>
        <h3 class="font-semibold">Cuenta</h3>
      </template>

      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt class="text-muted">Email</dt>
          <dd class="font-medium break-all">{{ user?.email || "—" }}</dd>
        </div>
        <div>
          <dt class="text-muted">Rol</dt>
          <dd>
            <UBadge
              :color="isAdmin ? 'primary' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ isAdmin ? "Administrador" : "Usuario" }}
            </UBadge>
          </dd>
        </div>
        <div>
          <dt class="text-muted">Miembro desde</dt>
          <dd class="font-medium">{{ formatDate(profile?.created_at) }}</dd>
        </div>
        <div v-if="profile?.updated_at">
          <dt class="text-muted">Última actualización</dt>
          <dd class="font-medium">{{ formatDate(profile.updated_at) }}</dd>
        </div>
      </dl>
    </UCard>

    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Datos personales</h3>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nombre completo" name="full_name" class="sm:col-span-2">
            <UInput v-model="state.full_name" placeholder="Juan Pérez" class="w-full" />
          </UFormField>

          <UFormField label="Teléfono" name="phone" class="sm:col-span-2">
            <UInput
              v-model="state.phone"
              placeholder="+54 9 11 ..."
              class="w-full"
            />
          </UFormField>
        </div>
      </UCard>

      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="loading"
          @click="hydrate"
        >
          Deshacer cambios
        </UButton>
        <UButton type="submit" color="primary" :loading="loading">
          Guardar
        </UButton>
      </div>
    </UForm>
  </div>
</template>
