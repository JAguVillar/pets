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
  listAdoptionStatus,
  listOrganizations,
} = useCatalogs();

const species = ref([]);
const breeds = ref([]);
const colors = ref([]);
const coatTypes = ref([]);
const sexes = ref([]);
const sizes = ref([]);
const statuses = ref([]);
const organizations = ref([]);

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
  organization_id: props.initial?.organization_id ?? null,
  images: props.initial?.images ?? [],
});

const schema = z.object({
  name: z.string().min(1, "Requerido").max(80),
  description: z.string().max(2000).optional().nullable(),
  age_years: z.number().min(0).max(40).nullable().optional(),
  species_id: z.number().nullable().optional(),
  breed_id: z.number().nullable().optional(),
  sex_id: z.number().nullable().optional(),
  size_id: z.number().nullable().optional(),
  color_id: z.number().nullable().optional(),
  coat_type_id: z.number().nullable().optional(),
  status_id: z.number({ message: "Elegí un estado" }),
  organization_id: z.number().nullable().optional(),
  images: z.array(z.string()).default([]),
});

async function loadCatalogs() {
  const [sp, co, ct, sx, sz, st, orgs] = await Promise.all([
    listSpecies(),
    listColors(),
    listCoatTypes(),
    listSexes(),
    listSizes(),
    listAdoptionStatus(),
    listOrganizations(),
  ]);
  species.value = sp;
  colors.value = co;
  coatTypes.value = ct;
  sexes.value = sx;
  sizes.value = sz;
  statuses.value = st;
  organizations.value = orgs;

  // Default a "Disponible" si es creación
  if (!state.status_id) {
    const available = st.find((s) => s.slug === "available");
    if (available) state.status_id = available.id;
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
    // si la raza actual no pertenece a la nueva especie, la limpiamos
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
  // Limpiamos campos null/undefined que no aportan al insert
  const payload = { ...data };
  delete payload.species_id; // no es una columna de la tabla
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
        <UFormField label="Nombre" name="name" required>
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
            placeholder="Carácter, historia, necesidades especiales…"
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
        <h3 class="font-semibold">Publicación</h3>
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

        <UFormField label="Refugio" name="organization_id">
          <USelectMenu
            v-model="state.organization_id"
            :items="organizations"
            value-key="id"
            label-key="name"
            placeholder="Opcional"
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
