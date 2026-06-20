<script setup>
import * as z from "zod";

const props = defineProps({
  initial: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  submitLabel: { type: String, default: "Publicar" },
});

const emit = defineEmits(["submit"]);

const {
  listSpecies,
  listBreeds,
  listColors,
  listCoatTypes,
  listSexes,
  listSizes,
  listPetStatus,
} = useCatalogs();

const species = ref([]);
const breeds = ref([]);
const colors = ref([]);
const coatTypes = ref([]);
const sexes = ref([]);
const sizes = ref([]);
const statuses = ref([]);

const state = reactive({
  name: props.initial?.name ?? "",
  description: props.initial?.description ?? "",
  age_years: props.initial?.age_years ?? null,
  species_id: props.initial?.breed?.species?.id ?? null,
  breed_id: props.initial?.breed_id ?? null,
  sex_id: props.initial?.sex_id ?? null,
  size_id: props.initial?.size_id ?? null,
  color_id: props.initial?.color_id ?? null,
  coat_type_id: props.initial?.coat_type_id ?? null,
  status_id: props.initial?.status_id ?? null,
  last_seen_date: props.initial?.last_seen_date ?? null,
  last_seen_location: props.initial?.last_seen_location ?? "",
  last_seen_lat: props.initial?.last_seen_lat ?? null,
  last_seen_lng: props.initial?.last_seen_lng ?? null,
  reward: props.initial?.reward ?? null,
  reporter_name: props.initial?.reporter_name ?? "",
  reporter_phone: props.initial?.reporter_phone ?? "",
  reporter_email: props.initial?.reporter_email ?? "",
  images: props.initial?.images ?? [],
});

const locationModel = computed({
  get: () => ({
    location: state.last_seen_location || null,
    lat: state.last_seen_lat,
    lng: state.last_seen_lng,
  }),
  set: (v) => {
    state.last_seen_location = v.location ?? "";
    state.last_seen_lat = v.lat;
    state.last_seen_lng = v.lng;
  },
});

const schema = z
  .object({
    name: z.string().max(80).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    age_years: z.number().min(0).max(40).nullable().optional(),
    species_id: z.number().nullable().optional(),
    breed_id: z.number().nullable().optional(),
    sex_id: z.number().nullable().optional(),
    size_id: z.number().nullable().optional(),
    color_id: z.number().nullable().optional(),
    coat_type_id: z.number().nullable().optional(),
    status_id: z.number({ message: "Elegí un estado" }),
    last_seen_date: z.string().nullable().optional(),
    last_seen_location: z.string().max(200).optional().nullable(),
    last_seen_lat: z.number().min(-90).max(90).nullable().optional(),
    last_seen_lng: z.number().min(-180).max(180).nullable().optional(),
    reward: z.number().min(0).nullable().optional(),
    reporter_name: z.string().max(120).optional().nullable(),
    reporter_phone: z.string().max(40).optional().nullable(),
    reporter_email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
    images: z.array(z.string()).default([]),
  })
  .refine(
    (d) => (d.last_seen_lat == null) === (d.last_seen_lng == null),
    {
      message: "Latitud y longitud deben informarse juntas",
      path: ["last_seen_lng"],
    },
  );

async function loadCatalogs() {
  const [sp, co, ct, sx, sz, st] = await Promise.all([
    listSpecies(),
    listColors(),
    listCoatTypes(),
    listSexes(),
    listSizes(),
    listPetStatus(),
  ]);
  species.value = sp;
  colors.value = co;
  coatTypes.value = ct;
  sexes.value = sx;
  sizes.value = sz;
  statuses.value = st;

  if (!state.status_id) {
    const lost = st.find((s) => s.slug === "lost");
    if (lost) state.status_id = lost.id;
  }

  if (state.species_id) {
    breeds.value = await listBreeds({ speciesId: state.species_id });
  }
}

watch(
  () => state.species_id,
  async (id, prev) => {
    if (id === prev) return;
    if (!id) {
      breeds.value = [];
      state.breed_id = null;
      return;
    }
    breeds.value = await listBreeds({ speciesId: id });
    if (state.breed_id && !breeds.value.find((b) => b.id === state.breed_id)) {
      state.breed_id = null;
    }
  },
);

onMounted(loadCatalogs);

const uploaderRef = ref(null);

function commit() {
  uploaderRef.value?.commit();
}

defineExpose({ commit });

function onSubmit({ data }) {
  const payload = { ...data };
  delete payload.species_id;
  // Normalizamos strings vacíos a null para columnas opcionales
  for (const k of [
    "name",
    "description",
    "last_seen_location",
    "reporter_name",
    "reporter_phone",
    "reporter_email",
  ]) {
    if (payload[k] === "") payload[k] = null;
  }
  emit("submit", payload);
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-6 max-w-3xl"
    @submit="onSubmit"
  >
    <UCard>
      <template #header>
        <h3 class="font-semibold">Información básica</h3>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Nombre" name="name" hint="Opcional">
          <UInput v-model="state.name" placeholder="Firulais" class="w-full" />
        </UFormField>

        <UFormField label="Edad (años)" name="age_years">
          <UInputNumber
            v-model="state.age_years"
            :min="0"
            :max="40"
            :step="0.5"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Descripción" name="description" class="sm:col-span-2">
          <UTextarea
            v-model="state.description"
            placeholder="Características distintivas, comportamiento, collar, chip…"
            :rows="4"
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">Características</h3>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Especie" name="species_id">
          <USelectMenu
            v-model="state.species_id"
            :items="species"
            value-key="id"
            label-key="name"
            placeholder="Elegí especie"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Raza" name="breed_id">
          <USelectMenu
            v-model="state.breed_id"
            :items="breeds"
            value-key="id"
            label-key="name"
            :disabled="!state.species_id"
            placeholder="Elegí raza"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Sexo" name="sex_id">
          <USelectMenu
            v-model="state.sex_id"
            :items="sexes"
            value-key="id"
            label-key="name"
            placeholder="Elegí sexo"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Tamaño" name="size_id">
          <USelectMenu
            v-model="state.size_id"
            :items="sizes"
            value-key="id"
            label-key="name"
            placeholder="Elegí tamaño"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Color" name="color_id">
          <USelectMenu
            v-model="state.color_id"
            :items="colors"
            value-key="id"
            label-key="name"
            placeholder="Elegí color"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Tipo de pelo" name="coat_type_id">
          <USelectMenu
            v-model="state.coat_type_id"
            :items="coatTypes"
            value-key="id"
            label-key="name"
            placeholder="Elegí tipo de pelo"
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">Dónde y cuándo</h3>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Última vez vista" name="last_seen_date">
          <UInput v-model="state.last_seen_date" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Recompensa (ARS)" name="reward">
          <UInputNumber
            v-model="state.reward"
            :min="0"
            :step="1000"
            placeholder="Opcional"
            class="w-full"
          />
        </UFormField>

        <div class="sm:col-span-2">
          <p class="text-sm font-medium mb-2">Ubicación</p>
          <ClientOnly>
            <LocationPicker v-model="locationModel" />
            <template #fallback>
              <div
                class="h-72 w-full rounded-lg border border-default bg-elevated/30 flex items-center justify-center text-muted text-sm"
              >
                Cargando mapa…
              </div>
            </template>
          </ClientOnly>
        </div>

      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">Estado y contacto</h3>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Estado" name="status_id" required>
          <USelectMenu
            v-model="state.status_id"
            :items="statuses"
            value-key="id"
            label-key="name"
            class="w-full"
          />
        </UFormField>

        <div class="hidden sm:block" />

        <UFormField label="Nombre de contacto" name="reporter_name">
          <UInput v-model="state.reporter_name" placeholder="Tu nombre" class="w-full" />
        </UFormField>

        <UFormField label="Teléfono" name="reporter_phone">
          <UInput v-model="state.reporter_phone" placeholder="+54 9 11 ..." class="w-full" />
        </UFormField>

        <UFormField label="Email" name="reporter_email" class="sm:col-span-2">
          <UInput
            v-model="state.reporter_email"
            type="email"
            placeholder="opcional@mail.com"
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">Imágenes</h3>
      </template>
      <PetImageUploader ref="uploaderRef" v-model="state.images" :max="8" />
    </UCard>

    <div class="flex justify-end gap-2">
      <UButton
        variant="ghost"
        color="neutral"
        :disabled="submitting"
        @click="$router.back()"
      >
        Cancelar
      </UButton>
      <UButton type="submit" color="primary" :loading="submitting">
        {{ submitLabel }}
      </UButton>
    </div>
  </UForm>
</template>
