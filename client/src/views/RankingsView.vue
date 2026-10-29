<script setup>
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import DateRangeFilter from '../components/DateRangeFilter.vue';
import { fetchRankings } from '../api.js';

const range = ref(null);
const rankings = ref([]);
const loading = ref(false);

// Competitors with equal points share a rank (1, 2, 2, 4, ...).
const ranked = computed(() =>
  rankings.value.map((r, i, all) => ({
    ...r,
    rank: all.findIndex((other) => other.totalPoints === r.totalPoints) + 1,
  })),
);

async function load() {
  loading.value = true;
  try {
    rankings.value = await fetchRankings(range.value);
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    loading.value = false;
  }
}

watch(range, load, { immediate: true });
</script>

<template>
  <div class="page">
    <h1>Scores and rankings</h1>
    <div class="toolbar">
      <DateRangeFilter v-model="range" />
      <el-button @click="load" :loading="loading">Refresh</el-button>
      <span class="summary">{{ rankings.length }} competitor{{ rankings.length === 1 ? '' : 's' }}</span>
    </div>
    <el-table :data="ranked" v-loading="loading" stripe border empty-text="No matches recorded for this period">
      <el-table-column prop="rank" label="Rank" width="80" align="right" />
      <el-table-column prop="name" label="Competitor" min-width="200" />
      <el-table-column prop="totalPoints" label="Total points" width="130" align="right" />
      <el-table-column prop="wins" label="Wins" width="90" align="right" />
      <el-table-column prop="ties" label="Ties" width="90" align="right" />
      <el-table-column prop="matches" label="Matches" width="100" align="right" />
    </el-table>
  </div>
</template>
