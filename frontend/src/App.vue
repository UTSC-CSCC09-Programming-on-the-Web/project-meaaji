<script setup lang="ts">
import { onMounted } from "vue";
import { useAuth } from "./composables/useAuth";

const { initializeAuth } = useAuth();

onMounted(() => {
  initializeAuth();
});
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>
