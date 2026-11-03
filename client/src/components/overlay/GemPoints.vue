<template>
  <div class="flex items-center gap-2.5" :class="side === 'right' ? 'flex-row' : 'flex-row-reverse'">
    <div
      v-for="index in totalGems"
      :key="index"
      class="rounded-sm transform rotate-45 transition-all duration-500 shadow-md"
      :class="[
        size === 'lg' ? 'w-5.5 h-5.5' : 'w-5 h-5',
        index <= score
          ? 'gem-active border-2 border-white'
          : 'gem-inactive border-2 border-slate-600'
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    format: "BO1" | "BO3" | "BO5" | "BO7";
    score: number;
    side: "left" | "right";
    size?: "md" | "lg";
  }>(),
  {
    size: "md",
  }
);

const totalGems = computed(() => {
  switch (props.format) {
    case "BO1":
      return 1;
    case "BO3":
      return 2;
    case "BO5":
      return 3;
    case "BO7":
      return 4;
    default:
      return 2;
  }
});
</script>
