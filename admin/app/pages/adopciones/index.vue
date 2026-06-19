<script setup>
import { h, resolveComponent } from "vue";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UAvatar = resolveComponent("UAvatar");

const { loadAdoptions, deleteAdoption } = useAdoptions();
const toast = useToast();
const router = useRouter();

const loading = ref(false);
const rows = ref([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const deletingId = ref(null);
const openConfirm = ref(false);
const target = ref(null);

async function refresh() {
  loading.value = true;
  try {
    const res = await loadAdoptions({
      page: page.value,
      pageSize: pageSize.value,
    });
    rows.value = res.data;
    total.value = res.count;
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    loading.value = false;
  }
}

function onView(row) {
  router.push(`/adopciones/${row.id}`);
}

function onEdit(row) {
  router.push(`/adopciones/${row.id}/editar`);
}

function askDelete(row) {
  target.value = row;
  openConfirm.value = true;
}

async function confirmDelete() {
  if (!target.value) return;
  deletingId.value = target.value.id;
  try {
    await deleteAdoption(target.value.id);
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
        alt: a.name,
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
      const age = a.age_years
        ? `${a.age_years} ${a.age_years === 1 ? "año" : "años"}`
        : "Edad no informada";
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium" }, a.name),
        h("span", { class: "text-xs text-muted" }, age),
      ]);
    },
  },
  {
    accessorKey: "breed",
    header: "Raza",
    cell: ({ row }) =>
      row.original.breed?.name ||
      h("span", { class: "text-muted" }, "Sin especificar"),
  },
  {
    accessorKey: "tags",
    header: "Características",
    cell: ({ row }) => {
      const a = row.original;
      const items = [a.size?.name, a.color?.name, a.coat_type?.name].filter(Boolean);
      if (!items.length) return h("span", { class: "text-muted" }, "—");
      return h(
        "div",
        { class: "flex flex-wrap gap-1" },
        items.map((t) =>
          h(UBadge, { variant: "subtle", color: "neutral", size: "sm" }, () => t),
        ),
      );
    },
  },
  {
    accessorKey: "organization",
    header: "Refugio",
    cell: ({ row }) =>
      row.original.organization?.name ||
      h("span", { class: "text-muted" }, "Particular"),
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

watch([page, pageSize], refresh, { immediate: true });
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-default">
      <h2 class="font-semibold">Mascotas en adopción</h2>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        to="/adopciones/nuevo"
      >
        Publicar mascota
      </UButton>
    </div>

    <div class="flex-1 p-4">
      <UTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        class="w-full"
      />

      <div v-if="total > pageSize" class="flex justify-center mt-4">
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
        />
      </div>
    </div>

    <UModal v-model:open="openConfirm" :title="`Eliminar ${target?.name || 'mascota'}`">
      <template #content>
        <div class="p-4 space-y-4">
          <p>¿Seguro que querés eliminar esta publicación? No se puede deshacer.</p>
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
