<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  max: {
    type: Number,
    default: 8,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const { uploadPetImage, deletePetImage, uploading } = useStorage();
const toast = useToast();

const inputRef = ref(null);
const isDragging = ref(false);

// URLs subidas durante la vida de este componente que todavía no fueron
// "commiteadas" por el form padre (=guardadas en una fila). Si el componente
// se desmonta sin commit, las barremos del storage para no dejar huérfanos.
const sessionUploads = ref(new Set());

const urls = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const remainingSlots = computed(() =>
  Math.max(0, props.max - urls.value.length),
);

function commit() {
  sessionUploads.value.clear();
}

defineExpose({ commit });

onBeforeUnmount(async () => {
  if (!sessionUploads.value.size) return;
  const orphans = [...sessionUploads.value];
  sessionUploads.value.clear();
  // Best-effort, sin toasts: el componente ya está por desaparecer.
  await Promise.allSettled(orphans.map((url) => deletePetImage(url)));
});

function openPicker() {
  if (props.disabled) return;
  inputRef.value?.click();
}

async function handleFiles(fileList) {
  if (!fileList?.length || props.disabled) return;

  const files = Array.from(fileList).slice(0, remainingSlots.value);
  if (files.length === 0) {
    toast.add({
      title: `Máximo ${props.max} imágenes`,
      color: "warning",
    });
    return;
  }

  const uploaded = [];
  for (const file of files) {
    if (!file.type?.startsWith("image/")) {
      toast.add({
        title: "Solo imágenes",
        description: `${file.name} no es una imagen`,
        color: "warning",
      });
      continue;
    }
    try {
      const { publicUrl } = await uploadPetImage(file);
      uploaded.push(publicUrl);
      sessionUploads.value.add(publicUrl);
    } catch (e) {
      toast.add({
        title: "Error subiendo imagen",
        description: e.message,
        color: "error",
      });
    }
  }
  if (uploaded.length) urls.value = [...urls.value, ...uploaded];
}

async function removeAt(index) {
  const target = urls.value[index];
  urls.value = urls.value.filter((_, i) => i !== index);
  // Si era de esta sesión, ya no es candidata a orphan.
  sessionUploads.value.delete(target);

  try {
    await deletePetImage(target);
  } catch (e) {
    // Si falla el delete remoto, lo informamos pero no revertimos el form,
    // porque la imagen ya quedó "huérfana" (un cleanup pasa después).
    toast.add({
      title: "No se pudo borrar del storage",
      description: e.message,
      color: "warning",
    });
  }
}

function onInput(e) {
  handleFiles(e.target.files);
  e.target.value = "";
}

function onDrop(e) {
  e.preventDefault();
  isDragging.value = false;
  handleFiles(e.dataTransfer.files);
}

function onDragOver(e) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onInput"
    />

    <div
      class="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
      :class="[
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-default hover:bg-elevated/50',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
      @click="openPicker"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <UIcon name="i-lucide-image-plus" class="w-8 h-8 mx-auto text-muted" />
      <p class="mt-2 text-sm">
        Arrastrá imágenes acá o
        <span class="text-primary font-medium">elegí archivos</span>
      </p>
      <p class="text-xs text-muted mt-1">
        {{ urls.length }} / {{ max }}
        <span v-if="uploading"> · Subiendo…</span>
      </p>
    </div>

    <div
      v-if="urls.length"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
    >
      <div
        v-for="(url, idx) in urls"
        :key="url"
        class="relative aspect-square rounded-lg overflow-hidden border border-default group"
      >
        <img :src="url" :alt="`Imagen ${idx + 1}`" class="w-full h-full object-cover" />
        <button
          type="button"
          class="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          :disabled="disabled"
          @click.stop="removeAt(idx)"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
