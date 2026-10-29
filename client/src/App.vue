<script setup>
import { pages } from './router.js';
</script>

<template>
  <el-container direction="vertical">
    <header class="app-header">
      <router-link to="/" class="brand">Monthly Shiai</router-link>
      <nav>
        <router-link v-for="p in pages" :key="p.name" :to="p.path">{{ p.title }}</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </el-container>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;
  padding: 12px 24px;
  background: var(--shiai-blue);
}

.app-header a {
  color: #dbeafe;
  text-decoration: none;
}

.app-header a.router-link-exact-active,
.app-header a:hover {
  color: #fff;
}

.brand {
  font-weight: 700;
  font-size: 1.15rem;
  color: #fff !important;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
</style>
