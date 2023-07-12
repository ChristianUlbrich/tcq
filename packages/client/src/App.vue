<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
    <RouterLink to="/new">New</RouterLink>
  </nav>
</template>
