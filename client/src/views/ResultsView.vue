<script setup>
import { ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { validateMatch } from '@shared/scores.js';
import DateRangeFilter from '../components/DateRangeFilter.vue';
import MatchForm from '../components/MatchForm.vue';
import ScoreBadge from '../components/ScoreBadge.vue';
import { deleteMatch, fetchMatches, updateMatch } from '../api.js';
import { formFromMatch, matchFromForm } from '../matchForm.js';

const range = ref(null);
const matches = ref([]);
const loading = ref(false);

// Edit dialog state; editing holds the match number being edited, or null when closed.
const editing = ref(null);
const editForm = ref(null);
const editErrors = ref({});
const saving = ref(false);

async function load() {
  loading.value = true;
  try {
    matches.value = await fetchMatches(range.value);
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    loading.value = false;
  }
}

function onEdit(row) {
  editForm.value = formFromMatch(row);
  editErrors.value = {};
  editing.value = row.matchNumber;
}

async function onSaveEdit() {
  const result = validateMatch(matchFromForm(editForm.value));
  editErrors.value = result.errors;
  if (Object.keys(result.errors).length) return;

  saving.value = true;
  try {
    await updateMatch(editing.value, result.value);
    ElMessage.success(`Match #${editing.value} updated`);
    editing.value = null;
    await load();
  } catch (err) {
    editErrors.value = err.details ?? {};
    ElMessage.error(err.message);
  } finally {
    saving.value = false;
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `Delete match #${row.matchNumber}, ${row.whiteName} vs ${row.blueName}? This cannot be undone.`,
      'Delete match',
      { type: 'warning', confirmButtonText: 'Delete', confirmButtonClass: 'el-button--danger', cancelButtonText: 'Cancel' },
    );
  } catch {
    return; // cancelled
  }
  try {
    await deleteMatch(row.matchNumber);
    ElMessage.success(`Match #${row.matchNumber} deleted`);
  } catch (err) {
    ElMessage.error(err.message);
  }
  await load();
}

watch(range, load, { immediate: true });
</script>

<template>
  <div class="page">
    <h1>Match results</h1>
    <div class="toolbar">
      <DateRangeFilter v-model="range" />
      <el-button @click="load" :loading="loading">Refresh</el-button>
      <span class="summary">{{ matches.length }} match{{ matches.length === 1 ? '' : 'es' }}</span>
    </div>
    <el-table :data="matches" v-loading="loading" stripe border empty-text="No matches recorded for this period">
      <el-table-column prop="matchNumber" label="#" width="70" align="right" />
      <el-table-column prop="matchDate" label="Date" width="120" />
      <el-table-column prop="matNumber" label="Mat" width="70" align="right" />
      <el-table-column label="White" min-width="150">
        <template #default="{ row }"><span class="side-tag white" />{{ row.whiteName }}</template>
      </el-table-column>
      <el-table-column label="Blue" min-width="150">
        <template #default="{ row }"><span class="side-tag blue" />{{ row.blueName }}</template>
      </el-table-column>
      <el-table-column label="Winner" min-width="150">
        <template #default="{ row }">{{ row.winner ?? '' }}</template>
      </el-table-column>
      <el-table-column label="Score" width="130">
        <template #default="{ row }">
          <ScoreBadge :score="row.winningScore" />
        </template>
      </el-table-column>
      <el-table-column prop="points" label="Points" width="90" align="right" />
      <el-table-column label="" width="140" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="onEdit(row)">Edit</el-button>
          <el-button link type="danger" @click="onDelete(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :model-value="editing !== null"
      :title="`Edit match #${editing}`"
      width="min(560px, calc(100vw - 32px))"
      @close="editing = null"
    >
      <MatchForm v-if="editForm" v-model="editForm" :errors="editErrors" @submit="onSaveEdit" />
      <template #footer>
        <el-button @click="editing = null">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="onSaveEdit">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>
