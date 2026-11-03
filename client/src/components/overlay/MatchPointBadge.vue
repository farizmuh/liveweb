<template>
  <div
    v-if="active"
    class="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider text-amber-200 border-2 border-amber-400 bg-red-900/95 shadow-red-glow match-point-pulse flex items-center gap-1.5 shrink-0"
  >
    <span class="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
    <span>MATCH POINT</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  active: boolean;
}>();
</script>
