<script setup lang="ts">
import { ref, watch } from 'vue';
import { FabricProvider } from '@naylence/vue';
import MathSentinel from './MathSentinel.vue';
import MathClient from './MathClient.vue';
import { clientConfig, sentinelConfig } from './config';
import './App.css';

const sentinelReady = ref(false);
const clientReady = ref(false);

const handleSentinelReady = () => {
  sentinelReady.value = true;
};

watch(
  sentinelReady,
  (ready, _prev, onCleanup) => {
    if (!ready) return;
    const timer = setTimeout(() => {
      clientReady.value = true;
    }, 100);
    onCleanup(() => clearTimeout(timer));
  },
  { immediate: false }
);
</script>

<template>
  <div class="App">
    <img src="/images/naylence.svg" alt="Naylence" class="app-logo" />
    <h1>Naylence Vue RPC Example</h1>
    <p class="app-description">Math agent with add, multiply, and fibonacci stream</p>

    <div class="nodes-container">
      <FabricProvider v-if="clientReady" :opts="clientConfig">
        <MathClient />
      </FabricProvider>

      <div class="arrows-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
          class="communication-arrows"
        >
          <line x1="12" y1="22" x2="52" y2="22" />
          <path d="M46 16 L52 22 L46 28" />
          <line x1="52" y1="42" x2="12" y2="42" />
          <path d="M18 36 L12 42 L18 48" />
        </svg>
      </div>

      <FabricProvider :opts="sentinelConfig">
        <MathSentinel @ready="handleSentinelReady" />
      </FabricProvider>
    </div>
  </div>
</template>
