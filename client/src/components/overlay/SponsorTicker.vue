<template>
  <div
    v-if="show"
    class="w-[780px] h-7 mx-auto -mt-1 bg-black/85 border-x border-b border-amber-500/40 rounded-b-lg overflow-hidden flex items-center shadow-lg px-3 text-xs tracking-wider"
  >
    <div class="flex items-center gap-1.5 text-amber-400 font-bold uppercase shrink-0 mr-3 border-r border-amber-500/30 pr-3">
      <span class="w-2 h-2 rounded-full bg-amber-400"></span>
      <span>INFO</span>
    </div>

    <div class="overflow-hidden whitespace-nowrap flex-1">
      <div class="animate-marquee font-semibold text-slate-200 uppercase">
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  text: string;
}>();
</script>

