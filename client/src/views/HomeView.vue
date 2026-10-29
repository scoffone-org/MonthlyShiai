<script setup>
import { pages } from '../router.js';
</script>

<template>
  <div class="page">
    <h1>Monthly Shiai</h1>
    <p class="intro">Record match results for the monthly judo tournament, review them, and see the rankings.</p>
    <el-row :gutter="16">
      <el-col v-for="(p, i) in pages" :key="p.name" :xs="24" :sm="8">
        <router-link :to="p.path" class="card-link">
          <el-card shadow="hover">
            <div class="step">{{ i + 1 }}</div>
            <h2>{{ p.title }}</h2>
            <p>{{ p.description }}</p>
          </el-card>
        </router-link>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.intro {
  color: var(--el-text-color-regular);
  margin-bottom: 24px;
}

.card-link {
  text-decoration: none;
  display: block;
  margin-bottom: 16px;
}

.step {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--shiai-blue);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
}

h2 {
  font-size: 1.1rem;
  margin: 12px 0 6px;
}

p {
  margin: 0;
  color: var(--el-text-color-secondary);
}
</style>
