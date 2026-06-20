<script setup>
const route = useRoute();
const router = useRouter();
const toast = useToast();
const user = useSupabaseUser();
const { isAdmin } = useProfile();
const { getLostPet, deleteLostPet, loading } = useLostPets();

const item = ref(null);
const openConfirm = ref(false);
const deleting = ref(false);

const isOwner = computed(
  () => user.value && item.value?.owner_user_id === user.value.id,
);
const canManage = computed(() => isOwner.value || isAdmin.value);

const primary = computed(() => item.value?.images?.[0] ?? null);
const restImages = computed(() => item.value?.images?.slice(1) ?? []);

const hasGeo = computed(
  () => item.value?.last_seen_lat != null && item.value?.last_seen_lng != null,
);
const mapsUrl = computed(() => {
  if (!hasGeo.value) return null;
  return `https://www.google.com/maps?q=${item.value.last_seen_lat},${item.value.last_seen_lng}`;
});

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatDateShort(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(iso));
}

function formatMoney(v) {
  if (v == null) return "—";
  return `$ ${new Intl.NumberFormat("es-AR").format(v)}`;
}

onMounted(async () => {
  try {
    item.value = await getLostPet(route.params.id);
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
});

async function confirmDelete() {
  deleting.value = true;
  try {
    await deleteLostPet(route.params.id);
    toast.add({ title: "Reporte eliminado", color: "success" });
    router.push("/perdidos");
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div v-if="loading && !item" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
    </div>

    <div v-else-if="item" class="space-y-6 max-w-5xl mx-auto">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <UBreadcrumb
            :items="[
              { label: 'Perdidos', to: '/perdidos' },
              { label: item.name || 'Sin nombre' },
            ]"
          />
          <h1 class="text-2xl font-bold mt-2 flex items-center gap-2 flex-wrap">
            {{ item.name || "Sin nombre" }}
            <UBadge
              v-if="item.status"
              variant="subtle"
              :style="{
                backgroundColor: `${item.status.color}20`,
                color: item.status.color,
              }"
            >
              {{ item.status.name }}
            </UBadge>
          </h1>
        </div>

        <div v-if="canManage" class="flex gap-2">
          <UButton
            icon="i-lucide-pencil"
            variant="soft"
            :to="`/perdidos/${item.id}/editar`"
          >
            Editar
          </UButton>
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="soft"
            @click="openConfirm = true"
          >
            Eliminar
          </UButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-12">
        <div class="lg:col-span-7 space-y-3">
          <div class="rounded-2xl overflow-hidden border border-default bg-elevated/25">
            <img
              v-if="primary"
              :src="primary"
              :alt="item.name || 'Mascota perdida'"
              class="w-full h-[360px] object-cover"
            />
            <div
              v-else
              class="h-[360px] flex items-center justify-center text-muted"
            >
              <UIcon
                :name="item.breed?.species?.icon || 'i-lucide-paw-print'"
                class="w-16 h-16"
              />
            </div>
          </div>

          <div v-if="restImages.length" class="grid grid-cols-4 gap-2">
            <img
              v-for="(src, i) in restImages"
              :key="src"
              :src="src"
              :alt="`Foto ${i + 2}`"
              class="aspect-square object-cover rounded-lg border border-default"
            />
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <UCard>
            <template #header>
              <h3 class="font-semibold">Última vez vista</h3>
            </template>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-muted">Fecha</dt>
                <dd class="font-medium">{{ formatDateShort(item.last_seen_date) }}</dd>
              </div>
              <div v-if="item.last_seen_location">
                <dt class="text-muted">Lugar</dt>
                <dd class="font-medium">{{ item.last_seen_location }}</dd>
              </div>
              <div v-if="hasGeo">
                <dt class="text-muted">Coordenadas</dt>
                <dd>
                  <a
                    :href="mapsUrl"
                    target="_blank"
                    rel="noopener"
                    class="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    {{ item.last_seen_lat }}, {{ item.last_seen_lng }}
                    <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
                  </a>
                </dd>
              </div>
              <div v-if="item.reward != null">
                <dt class="text-muted">Recompensa</dt>
                <dd class="font-medium tabular-nums">{{ formatMoney(item.reward) }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="font-semibold">Características</h3>
            </template>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt class="text-muted">Especie</dt>
                <dd class="font-medium">{{ item.breed?.species?.name || "—" }}</dd>
              </div>
              <div>
                <dt class="text-muted">Raza</dt>
                <dd class="font-medium">{{ item.breed?.name || "—" }}</dd>
              </div>
              <div>
                <dt class="text-muted">Edad</dt>
                <dd class="font-medium">
                  {{
                    item.age_years
                      ? `${item.age_years} ${item.age_years === 1 ? "año" : "años"}`
                      : "—"
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-muted">Sexo</dt>
                <dd class="font-medium">{{ item.sex?.name || "—" }}</dd>
              </div>
              <div>
                <dt class="text-muted">Tamaño</dt>
                <dd class="font-medium">{{ item.size?.name || "—" }}</dd>
              </div>
              <div>
                <dt class="text-muted">Color</dt>
                <dd class="font-medium">{{ item.color?.name || "—" }}</dd>
              </div>
              <div>
                <dt class="text-muted">Pelo</dt>
                <dd class="font-medium">{{ item.coat_type?.name || "—" }}</dd>
              </div>
              <div>
                <dt class="text-muted">Reportada</dt>
                <dd class="font-medium">{{ formatDate(item.created_at) }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard
            v-if="item.reporter_name || item.reporter_phone || item.reporter_email"
          >
            <template #header>
              <h3 class="font-semibold">Contacto</h3>
            </template>
            <div class="space-y-2 text-sm">
              <p v-if="item.reporter_name" class="font-medium flex items-center gap-2">
                <UIcon name="i-lucide-user" class="w-4 h-4 text-muted" />
                {{ item.reporter_name }}
              </p>
              <p v-if="item.reporter_phone" class="text-muted flex items-center gap-2">
                <UIcon name="i-lucide-phone" class="w-4 h-4" />
                <a :href="`tel:${item.reporter_phone}`" class="hover:text-primary hover:underline">
                  {{ item.reporter_phone }}
                </a>
              </p>
              <p v-if="item.reporter_email" class="text-muted flex items-center gap-2">
                <UIcon name="i-lucide-mail" class="w-4 h-4" />
                <a :href="`mailto:${item.reporter_email}`" class="hover:text-primary hover:underline">
                  {{ item.reporter_email }}
                </a>
              </p>
            </div>
          </UCard>
        </div>
      </div>

      <UCard v-if="item.description">
        <template #header>
          <h3 class="font-semibold">Descripción</h3>
        </template>
        <p class="whitespace-pre-wrap leading-relaxed">{{ item.description }}</p>
      </UCard>
    </div>

    <UAlert
      v-else
      icon="i-lucide-alert-circle"
      color="error"
      title="No encontrado"
      description="El reporte que buscás no existe o no podés verlo."
    />

    <UModal v-model:open="openConfirm" title="Eliminar reporte">
      <template #content>
        <div class="p-4 space-y-4">
          <p>¿Seguro que querés eliminar este reporte? No se puede deshacer.</p>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="deleting"
              @click="openConfirm = false"
            >
              Cancelar
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Eliminar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
