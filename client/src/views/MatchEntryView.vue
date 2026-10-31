<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { pointsFor, validateMatch } from '@shared/scores.js';
import MatchForm from '../components/MatchForm.vue';
import ScoreBadge from '../components/ScoreBadge.vue';
import { saveMatch } from '../api.js';
import { emptyForm, matchFromForm } from '../matchForm.js';

const form = ref(emptyForm());
const errors = ref({});
const saving = ref(false);
const recent = ref([]);

async function onSave() {
  const result = validateMatch(matchFromForm(form.value));
  errors.value = result.errors;
  if (Object.keys(result.errors).length) return;

  saving.value = true;
  try {
    const saved = await saveMatch(result.value);
    recent.value = [saved, ...recent.value].slice(0, 5);
    ElMessage.success(`Match #${saved.matchNumber} saved`);

    // Keep the date and mat; the winner stays on for the next match.
    const f = form.value;
    if (f.winnerSide === 'blue') f.whiteName = '';
    else if (f.winnerSide === 'white') f.blueName = '';
    else {
      f.whiteName = '';
      f.blueName = '';
    }
    f.winnerSide = '';
    f.winningScore = '';
  } catch (err) {
    errors.value = err.details ?? {};
    ElMessage.error(err.message);
  } finally {
    saving.value = false;
  }
}

function onClear() {
  Object.assign(form.value, { whiteName: '', blueName: '', winnerSide: '', winningScore: '' });
  errors.value = {};
}
</script>

<template>
  <div class="page">
    <h1>Enter match results</h1>
    <el-row :gutter="24">
      <el-col :xs="24" :md="14">
        <el-card>
          <MatchForm v-model="form" :errors="errors" @submit="onSave">
            <div class="actions">
              <el-button type="primary" native-type="submit" :loading="saving">Save</el-button>
              <el-button @click="onClear">Clear</el-button>
            </div>
          </MatchForm>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <el-card class="recent">
          <template #header>Saved this session</template>
          <el-empty v-if="!recent.length" description="No matches saved yet" :image-size="60" />
          <ul v-else>
            <li v-for="m in recent" :key="m.matchNumber">
              <strong>#{{ m.matchNumber }}</strong>
              <span class="muted">Mat {{ m.matNumber }}</span>
              {{ m.whiteName }} vs {{ m.blueName }} —
              <template v-if="m.winner">{{ m.winner }} by <ScoreBadge :score="m.winningScore" /> ({{ pointsFor(m.winningScore) }})</template>
              <ScoreBadge v-else :score="m.winningScore" />
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 8px;
}

.recent ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recent li {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.recent li:last-child {
  border-bottom: none;
}

.muted {
  color: var(--el-text-color-secondary);
  margin: 0 6px;
}

@media (max-width: 991px) {
  .recent {
    margin-top: 16px;
  }
}
</style>
