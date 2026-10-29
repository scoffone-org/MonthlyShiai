<script setup>
import { watch } from 'vue';
import { SCORES, TIE, normalizeName } from '@shared/scores.js';

// v-model is the form state from matchForm.js; errors maps field names to messages.
const form = defineModel({ type: Object, required: true });
defineProps({ errors: { type: Object, default: () => ({}) } });
const emit = defineEmits(['submit']);

// Keep winner and score consistent: a tie has no winner, and a winner rules out a tie.
watch(() => form.value.winningScore, (score) => {
  if (score === TIE) form.value.winnerSide = '';
});
watch(() => form.value.winnerSide, (side) => {
  if (side && form.value.winningScore === TIE) form.value.winningScore = '';
});
</script>

<template>
  <el-form label-position="top" @submit.prevent="emit('submit')">
    <el-row :gutter="16">
      <el-col :span="14">
        <el-form-item label="Match date" :error="errors.matchDate">
          <el-date-picker v-model="form.matchDate" type="date" value-format="YYYY-MM-DD" :clearable="false" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="10">
        <el-form-item label="Mat number" :error="errors.matNumber">
          <el-input-number v-model="form.matNumber" :min="1" :step="1" step-strictly style="width: 100%" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item :error="errors.whiteName">
      <template #label><span class="side-tag white" />White</template>
      <el-input v-model="form.whiteName" placeholder="White competitor's name" maxlength="100" />
    </el-form-item>

    <el-form-item :error="errors.blueName">
      <template #label><span class="side-tag blue" />Blue</template>
      <el-input v-model="form.blueName" placeholder="Blue competitor's name" maxlength="100" />
    </el-form-item>

    <el-row :gutter="16">
      <el-col :span="14">
        <el-form-item label="Winner" :error="errors.winner">
          <el-select v-model="form.winnerSide" placeholder="No winner (tie)" clearable style="width: 100%">
            <el-option value="white" :label="normalizeName(form.whiteName) || 'White'" :disabled="!normalizeName(form.whiteName)">
              <span class="side-tag white" />{{ normalizeName(form.whiteName) || 'White' }}
            </el-option>
            <el-option value="blue" :label="normalizeName(form.blueName) || 'Blue'" :disabled="!normalizeName(form.blueName)">
              <span class="side-tag blue" />{{ normalizeName(form.blueName) || 'Blue' }}
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="10">
        <el-form-item label="Winning score" :error="errors.winningScore">
          <el-select v-model="form.winningScore" placeholder="Select" style="width: 100%">
            <el-option v-for="s in SCORES" :key="s.name" :value="s.name" :label="s.name">
              {{ s.name }} <span class="pts">{{ s.points }} pt{{ s.points === 1 ? '' : 's' }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <slot />
    <!-- Lets Enter submit the form even when the action buttons live outside it (e.g. a dialog footer). -->
    <button type="submit" hidden />
  </el-form>
</template>

<style scoped>
.pts {
  float: right;
  color: var(--el-text-color-secondary);
  font-size: 0.85em;
}
</style>
