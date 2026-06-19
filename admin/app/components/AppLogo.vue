<script setup>
defineProps({
  collapsed: { type: Boolean, default: false },
});
</script>

<template>
  <div class="flex items-center gap-2">
    <UIcon name="i-lucide-paw-print" class="w-6 h-6 text-primary shrink-0" />
    <span v-if="!collapsed" class="font-bold tracking-tight">Pets</span>
  </div>
</template>
