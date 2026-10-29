<script setup>
import { monthRange } from '../dates.js';

// v-model is [from, to] as YYYY-MM-DD strings, or null for no filter.
const range = defineModel({ type: Array, default: null });

const shortcuts = [
  { text: 'This month', value: () => monthRange(0) },
  { text: 'Last month', value: () => monthRange(-1) },
  {
    text: 'Last 12 months',
    value: () => [monthRange(-11)[0], monthRange(0)[1]],
  },
];
</script>

<template>
  <el-date-picker
    v-model="range"
    type="daterange"
    value-format="YYYY-MM-DD"
    range-separator="to"
    start-placeholder="From date"
    end-placeholder="To date"
    :shortcuts="shortcuts"
    clearable
  />
</template>
