<script setup>
// A winning score shown on its color from score-colors.css.
defineProps({ score: { type: String, required: true } });
</script>

<template>
  <span class="score-badge" :class="`score-${score.toLowerCase()}`">{{ score }}</span>
</template>
