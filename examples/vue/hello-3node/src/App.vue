<script setup lang="ts">
import { ref, watch } from 'vue';
import { enableLogging } from '@naylence/runtime';
import '@naylence/runtime';
import { FabricProvider } from '@naylence/vue';
import ClientNode from './ClientNode.vue';
import SentinelNode from './SentinelNode.vue';
import AgentNode from './AgentNode.vue';
import { agentConfig, clientConfig, sentinelConfig } from './config-3node-broadcast';
import './App.css';

enableLogging('debug');

const sentinelReady = ref(false);
const agentReady = ref(false);
const clientReady = ref(false);

const handleSentinelReady = () => {
  sentinelReady.value = true;
};

watch(
  sentinelReady,
  (ready, _prev, onCleanup) => {
    if (!ready) return;
    const timer = setTimeout(() => {
      agentReady.value = true;
    }, 100);
    onCleanup(() => clearTimeout(timer));
  },
  { immediate: false }
);

watch(
  agentReady,
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
    <h1>Naylence Vue - 3 Node Example</h1>
    <p class="app-description">Three fabric nodes: Client → Sentinel → Agent</p>

    <div class="nodes-container three-node">
      <FabricProvider v-if="clientReady" :opts="clientConfig">
        <ClientNode />
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
        <SentinelNode @ready="handleSentinelReady" />
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

      <FabricProvider v-if="agentReady" :opts="agentConfig">
        <AgentNode @ready="() => console.log('Agent ready')" />
      </FabricProvider>
    </div>
  </div>
</template>
