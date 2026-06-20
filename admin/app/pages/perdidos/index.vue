<script setup>
import { h, resolveComponent } from "vue";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UAvatar = resolveComponent("UAvatar");

const { loadLostPets, deleteLostPet } = useLostPets();
const { listSpecies, listSexes, listPetStatus } = useCatalogs();
const toast = useToast();
const router = useRouter();

const loading = ref(false);
const rows = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const qInput = ref("");
const q = ref("");
const speciesId = ref(null);
const statusId = ref(null);
const sexId = ref(null);
const sort = ref("recent");

const species = ref([]);
const statuses = ref([]);
const sexes = ref([]);

const deletingId = ref(null);
const openConfirm = ref(false);
const target = ref(null);

const sortOptions = [
  { id: "recent", name: "Más recientes" },
  { id: "oldest", name: "Más antiguas" },
  { id: "last_seen_recent", name: "Vista más reciente" },
  { id: "name_asc", name: "Nombre A → Z" },
];

const hasFilters = computed(
  () =>
    !!q.value ||
    speciesId.value !== null ||
    statusId.value !== null ||
    sexId.value !== null,
);

function clearFilters() {
  qInput.value = "";
  q.value = "";
  speciesId.value = null;
  statusId.value = null;
  sexId.value = null;
}

let qTimer;
watch(qInput, (v) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    q.value = v;
    page.value = 1;
  }, 300);
});

watch([speciesId, statusId, sexId, sort], () => {
  page.value = 1;
});

function formatDate(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(iso));
}

async function refresh() {
  loading.value = true;
  try {
    const res = await loadLostPets({
      page: page.value,
      pageSize: pageSize.value,
      q: q.value,
      statusId: statusId.value,
      sexId: sexId.value,
      speciesId: speciesId.value,
      sort: sort.value,
    });
    rows.value = res.data;
    total.value = res.count;
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    loading.value = false;
  }
}

async function loadFilters() {
  try {
    const [sp, st, sx] = await Promise.all([
      listSpecies(),
      listPetStatus(),
      listSexes(),
    ]);
    species.value = sp;
    statuses.value = st;
    sexes.value = sx;
  } catch (e) {
    toast.add({ title: "Error cargando filtros", description: e.message, color: "error" });
  }
}

function onView(row) {
  router.push(`/perdidos/${row.id}`);
}

function onEdit(row) {
  router.push(`/perdidos/${row.id}/editar`);
}

function askDelete(row) {
  target.value = row;
  openConfirm.value = true;
}

async function confirmDelete() {
  if (!target.value) return;
  deletingId.value = target.value.id;
  try {
    await deleteLostPet(target.value.id);
    toast.add({ title: "Eliminada", color: "success" });
    openConfirm.value = false;
    target.value = null;
    await refresh();
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    deletingId.value = null;
  }
}

const columns = computed(() => [
  {
    accessorKey: "image",
    header: "",
    cell: ({ row }) => {
      const a = row.original;
      const url = a.images?.[0];
      return h(UAvatar, {
        src: url,
        alt: a.name || "Sin nombre",
        size: "md",
        icon: url ? undefined : a.breed?.species?.icon || "i-lucide-paw-print",
      });
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const a = row.original;
      const name = a.name || h("span", { class: "italic text-muted" }, "Sin nombre");
      const species = a.breed?.species?.name;
      const breed = a.breed?.name;
      const sub = [species, breed].filter(Boolean).join(" · ") || "Sin raza";
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium" }, name),
        h("span", { class: "text-xs text-muted" }, sub),
      ]);
    },
  },
  {
    accessorKey: "last_seen",
    header: "Última vez vista",
    cell: ({ row }) => {
      const a = row.original;
      const date = formatDate(a.last_seen_date);
      const place = a.last_seen_location;
      if (!date && !place) return h("span", { class: "text-muted" }, "—");
      return h("div", { class: "flex flex-col text-sm" }, [
        date ? h("span", { class: "font-medium" }, date) : null,
        place ? h("span", { class: "text-xs text-muted" }, place) : null,
      ]);
    },
  },
  {
    accessorKey: "reward",
    header: "Recompensa",
    cell: ({ row }) => {
      const v = row.original.reward;
      if (v == null) return h("span", { class: "text-muted" }, "—");
      return h(
        "span",
        { class: "font-medium tabular-nums" },
        `$ ${new Intl.NumberFormat("es-AR").format(v)}`,
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const s = row.original.status;
      if (!s) return h("span", { class: "text-muted" }, "—");
      return h(
        UBadge,
        { variant: "subtle", style: { backgroundColor: `${s.color}20`, color: s.color } },
        () => s.name,
      );
    },
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const a = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-eye",
          size: "sm",
          variant: "ghost",
          onClick: () => onView(a),
        }),
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "sm",
          variant: "ghost",
          onClick: () => onEdit(a),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "sm",
          variant: "ghost",
          color: "error",
          loading: deletingId.value === a.id,
          onClick: () => askDelete(a),
        }),
      ]);
    },
  },
]);

onMounted(loadFilters);
watch([page, pageSize, q, speciesId, statusId, sexId, sort], refresh, {
  immediate: true,
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-default">
      <div>
        <h2 class="font-semibold">Mascotas perdidas</h2>
        <p class="text-xs text-muted">
          {{ total }} {{ total === 1 ? "publicación" : "publicaciones" }}
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" to="/perdidos/nuevo">
        Reportar pérdida
      </UButton>
    </div>

    <div
      class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-default bg-elevated/25"
    >
      <UInput
        v-model="qInput"
        icon="i-lucide-search"
        placeholder="Buscar por nombre o lugar…"
        class="flex-1 min-w-[200px] max-w-md"
      />

      <USelectMenu
        v-model="speciesId"
        :items="species"
        value-key="id"
        label-key="name"
        placeholder="Especie"
        :search-input="false"
        class="w-36"
      >
        <template #default="{ modelValue }">
          <span v-if="modelValue == null" class="text-muted">Especie</span>
          <span v-else>{{ species.find((s) => s.id === modelValue)?.name }}</span>
        </template>
      </USelectMenu>

      <USelectMenu
        v-model="statusId"
        :items="statuses"
        value-key="id"
        label-key="name"
        placeholder="Estado"
        :search-input="false"
        class="w-36"
      >
        <template #default="{ modelValue }">
          <span v-if="modelValue == null" class="text-muted">Estado</span>
          <span v-else>{{ statuses.find((s) => s.id === modelValue)?.name }}</span>
        </template>
      </USelectMenu>

      <USelectMenu
        v-model="sexId"
        :items="sexes"
        value-key="id"
        label-key="name"
        placeholder="Sexo"
        :search-input="false"
        class="w-32"
      >
        <template #default="{ modelValue }">
          <span v-if="modelValue == null" class="text-muted">Sexo</span>
          <span v-else>{{ sexes.find((s) => s.id === modelValue)?.name }}</span>
        </template>
      </USelectMenu>

      <USelectMenu
        v-model="sort"
        :items="sortOptions"
        value-key="id"
        label-key="name"
        :search-input="false"
        class="w-52"
      />

      <UButton
        v-if="hasFilters"
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="clearFilters"
      >
        Limpiar
      </UButton>
    </div>

    <div class="flex-1 p-4">
      <UTable :data="rows" :columns="columns" :loading="loading" class="w-full">
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-lucide-search-x" class="w-12 h-12 text-muted" />
            <div class="text-center">
              <p class="font-medium">
                {{ hasFilters ? "Sin resultados" : "Todavía no hay reportes" }}
              </p>
              <p class="text-sm text-muted mt-1">
                {{
                  hasFilters
                    ? "Probá ajustar los filtros o buscar otro término."
                    : "Si perdiste una mascota o encontraste una, reportala acá."
                }}
              </p>
            </div>
            <UButton
              v-if="!hasFilters"
              icon="i-lucide-plus"
              color="primary"
              to="/perdidos/nuevo"
            >
              Reportar pérdida
            </UButton>
            <UButton
              v-else
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              @click="clearFilters"
            >
              Limpiar filtros
            </UButton>
          </div>
        </template>
      </UTable>

      <div v-if="total > pageSize" class="flex justify-center mt-4">
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
        />
      </div>
    </div>

    <UModal
      v-model:open="openConfirm"
      :title="`Eliminar reporte`"
    >
      <template #content>
        <div class="p-4 space-y-4">
          <p>¿Seguro que querés eliminar este reporte? No se puede deshacer.</p>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="!!deletingId"
              @click="openConfirm = false"
            >
              Cancelar
            </UButton>
            <UButton color="error" :loading="!!deletingId" @click="confirmDelete">
              Eliminar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
