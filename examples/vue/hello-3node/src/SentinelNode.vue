<script setup lang="ts">
import { useFabric, useFabricEffect } from '@naylence/vue';

const emit = defineEmits<{ (e: 'ready'): void }>();
const { fabric, error } = useFabric();

useFabricEffect(() => {
  emit('ready');
});
</script>

<template>
  <div class="card">
    <div class="sentinel-icon-container">
      <img src="/images/sentinel.svg" alt="Sentinel" class="sentinel-icon" />
    </div>
    <h2>Sentinel</h2>
    <p v-if="error" class="status-error">Error: {{ String(error) }}</p>
    <template v-if="fabric">
      <p class="status-active">✅ Active</p>
      <p class="node-info">Routing messages between nodes</p>
    </template>
  </div>
</template>
