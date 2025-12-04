<script setup lang="ts">
import { ref } from 'vue';
import { useFabric, useFabricEffect } from '@naylence/vue';
import { MathAgent } from './MathAgent';

interface OperationLog {
  operation: string;
  params: Record<string, unknown>;
  timestamp: number;
}

const emit = defineEmits<{ (e: 'ready'): void }>();

const { fabric, error } = useFabric();
const operationLogs = ref<OperationLog[]>([]);
const pulseActive = ref(false);
const messagesEndRef = ref<HTMLDivElement | null>(null);
const MAX_LOGS = 50;

useFabricEffect((fabricInstance) => {
  const agent = new MathAgent();
  const agentId = agent.debugId ?? 'math-agent-unknown';

  const originalAdd = agent.add.bind(agent);
  const originalMulti = agent.multi.bind(agent);
  const originalFib = agent.fib.bind(agent);

  const logOperation = (operation: string, params: Record<string, unknown>) => {
    const timestamp = Date.now();
    operationLogs.value = [...operationLogs.value.slice(-(MAX_LOGS - 1)), { operation, params, timestamp }];
    pulseActive.value = true;
    requestAnimationFrame(() => {
      messagesEndRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    setTimeout(() => {
      pulseActive.value = false;
    }, 600);
  };

  agent.add = async (params: { x: number; y: number }) => {
    logOperation('add', params);
    return originalAdd(params);
  };

  agent.multi = async (params: { x: number; y: number }) => {
    logOperation('multiply', params);
    return originalMulti(params);
  };

  agent.fib = async function* (params: { n: number }) {
    logOperation('fib_stream', params);
    yield* originalFib(params);
  };

  fabricInstance
    .serve(agent, 'math@fame.fabric')
    .then(() => {
      console.log('[MathSentinel]', agentId, 'served at math@fame.fabric');
      emit('ready');
    })
    .catch((serveError) => {
      console.error('[MathSentinel]', agentId, 'failed to serve', serveError);
    });
});
</script>

<template>
  <div class="card">
    <div class="sentinel-icon-container">
      <img
        src="/images/agent-on-sentinel.svg"
        alt="Math Agent on Sentinel"
        class="sentinel-icon"
        :class="{ 'pulse-active': pulseActive }"
      />
      <div v-if="pulseActive" class="pulse-overlay" />
    </div>
    <h2>Math Agent on Sentinel</h2>
    <p v-if="error" class="status-error">Error: {{ String(error) }}</p>
    <template v-if="fabric">
      <p class="status-active">✅ Active</p>

      <div class="messages-container">
        <p class="messages-title">
          {{ operationLogs.length > 0 ? 'Operation Log:' : '\u00A0' }}
        </p>
        <div class="messages-list">
          <div
            v-for="(log, idx) in operationLogs"
            :key="log.timestamp"
            class="message-item"
            :class="{ new: idx === operationLogs.length - 1 }"
          >
            <div class="message-text">🔧 {{ log.operation }}({{ JSON.stringify(log.params) }})</div>
            <div class="message-timestamp">
              {{ new Date(log.timestamp).toLocaleTimeString() }}
            </div>
          </div>
          <div ref="messagesEndRef" />
        </div>
      </div>
    </template>
  </div>
</template>
