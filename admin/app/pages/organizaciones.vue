<script setup>
import { h, resolveComponent } from "vue";
import * as z from "zod";

definePageMeta({ middleware: ["admin"] });

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");

const {
  loadOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  loading,
} = useOrganizations();
const toast = useToast();

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const qInput = ref("");
const q = ref("");

let qTimer;
watch(qInput, (v) => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    q.value = v;
    page.value = 1;
  }, 300);
});

const openForm = ref(false);
const openConfirm = ref(false);
const editing = ref(null);
const saving = ref(false);
const deleting = ref(false);
const target = ref(null);

const blank = () => ({
  name: "",
  slug: "",
  email: "",
  phone: "",
  verified: false,
});

const state = reactive(blank());

const schema = z.object({
  name: z.string().min(1, "Requerido").max(120),
  slug: z.string().max(120).optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  verified: z.boolean().default(false),
});

function openCreate() {
  editing.value = null;
  Object.assign(state, blank());
  openForm.value = true;
}

function openEdit(row) {
  editing.value = row;
  Object.assign(state, {
    name: row.name ?? "",
    slug: row.slug ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    verified: !!row.verified,
  });
  openForm.value = true;
}

function askDelete(row) {
  target.value = row;
  openConfirm.value = true;
}

async function refresh() {
  try {
    const res = await loadOrganizations({
      page: page.value,
      pageSize: pageSize.value,
      q: q.value,
    });
    rows.value = res.data;
    total.value = res.count;
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
}

async function onSubmit({ data }) {
  saving.value = true;
  try {
    const payload = { ...data };
    for (const k of ["slug", "email", "phone"]) {
      if (payload[k] === "") payload[k] = null;
    }
    if (editing.value) {
      await updateOrganization(editing.value.id, payload);
      toast.add({ title: "Actualizada", color: "success" });
    } else {
      await createOrganization(payload);
      toast.add({ title: "Creada", color: "success" });
    }
    openForm.value = false;
    await refresh();
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!target.value) return;
  deleting.value = true;
  try {
    await deleteOrganization(target.value.id);
    toast.add({ title: "Eliminada", color: "success" });
    openConfirm.value = false;
    target.value = null;
    await refresh();
  } catch (e) {
    toast.add({
      title: "Error",
      description:
        e.message?.includes("violates")
          ? "No se puede eliminar: hay publicaciones asociadas."
          : e.message,
      color: "error",
    });
  } finally {
    deleting.value = false;
  }
}

const columns = computed(() => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const o = row.original;
      return h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "font-medium" }, o.name),
        o.verified
          ? h(UIcon, {
              name: "i-lucide-badge-check",
              class: "w-4 h-4 text-primary",
            })
          : null,
      ]);
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) =>
      row.original.slug
        ? h("code", { class: "text-xs text-muted" }, row.original.slug)
        : h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) =>
      row.original.email || h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) =>
      row.original.phone || h("span", { class: "text-muted" }, "—"),
  },
  {
    accessorKey: "verified",
    header: "Verificada",
    cell: ({ row }) => {
      const v = row.original.verified;
      return h(
        UBadge,
        {
          variant: "subtle",
          color: v ? "primary" : "neutral",
          size: "sm",
        },
        () => (v ? "Sí" : "No"),
      );
    },
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => {
      const o = row.original;
      return h("div", { class: "flex items-center justify-end gap-1" }, [
        h(UButton, {
          icon: "i-lucide-pencil",
          size: "sm",
          variant: "ghost",
          onClick: () => openEdit(o),
        }),
        h(UButton, {
          icon: "i-lucide-trash",
          size: "sm",
          variant: "ghost",
          color: "error",
          onClick: () => askDelete(o),
        }),
      ]);
    },
  },
]);

watch([page, pageSize, q], refresh, { immediate: true });
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-default">
      <div>
        <h2 class="font-semibold">Organizaciones</h2>
        <p class="text-xs text-muted">
          {{ total }} {{ total === 1 ? "registrada" : "registradas" }}
        </p>
      </div>
      <UButton icon="i-lucide-plus" color="primary" @click="openCreate">
        Nueva organización
      </UButton>
    </div>

    <div
      class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-default bg-elevated/25"
    >
      <UInput
        v-model="qInput"
        icon="i-lucide-search"
        placeholder="Buscar por nombre o email…"
        class="flex-1 min-w-[200px] max-w-md"
      />
    </div>

    <div class="flex-1 p-4">
      <UTable :data="rows" :columns="columns" :loading="loading" class="w-full">
        <template #empty>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-lucide-building-2" class="w-12 h-12 text-muted" />
            <div class="text-center">
              <p class="font-medium">
                {{ q ? "Sin resultados" : "Todavía no hay organizaciones" }}
              </p>
              <p class="text-sm text-muted mt-1">
                {{
                  q
                    ? "Probá otro término."
                    : "Cargá refugios para que aparezcan en el form de adopciones."
                }}
              </p>
            </div>
            <UButton
              v-if="!q"
              icon="i-lucide-plus"
              color="primary"
              @click="openCreate"
            >
              Nueva organización
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
      v-model:open="openForm"
      :title="editing ? `Editar: ${editing.name}` : 'Nueva organización'"
    >
      <template #content>
        <div class="p-4">
          <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
            <UFormField label="Nombre" name="name" required>
              <UInput v-model="state.name" class="w-full" placeholder="Refugio Patitas" />
            </UFormField>

            <UFormField
              label="Slug"
              name="slug"
              hint="Si lo dejás vacío se genera del nombre"
            >
              <UInput v-model="state.slug" class="w-full" placeholder="refugio-patitas" />
            </UFormField>

            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Email" name="email">
                <UInput
                  v-model="state.email"
                  type="email"
                  class="w-full"
                  placeholder="contacto@…"
                />
              </UFormField>
              <UFormField label="Teléfono" name="phone">
                <UInput
                  v-model="state.phone"
                  class="w-full"
                  placeholder="+54 9 11 ..."
                />
              </UFormField>
            </div>

            <UFormField name="verified">
              <USwitch v-model="state.verified" label="Verificada" />
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                variant="ghost"
                color="neutral"
                :disabled="saving"
                @click="openForm = false"
              >
                Cancelar
              </UButton>
              <UButton type="submit" color="primary" :loading="saving">
                {{ editing ? "Guardar" : "Crear" }}
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="openConfirm"
      :title="`Eliminar ${target?.name || 'organización'}`"
    >
      <template #content>
        <div class="p-4 space-y-4">
          <p>
            ¿Seguro que querés eliminar esta organización? Si tiene publicaciones
            de adopciones asociadas, no se va a poder borrar.
          </p>
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
