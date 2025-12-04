<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useFabric, useFabricEffect } from '@naylence/vue';
import { HelloAgent } from './HelloAgent';

interface ReceivedMessage {
  message: string;
  timestamp: number;
}

const emit = defineEmits<{ (e: 'ready'): void }>();

const { fabric, error } = useFabric();
const receivedMessages = ref<ReceivedMessage[]>([]);
const pulseActive = ref(false);
const messagesEndRef = ref<HTMLDivElement | null>(null);

let pulseTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  receivedMessages,
  async () => {
    await nextTick();
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  { flush: 'post' }
);

useFabricEffect((fabricInstance) => {
  const agent = new HelloAgent();

  agent.setMessageCallback((message: string) => {
    const timestamp = Date.now();
    receivedMessages.value = [...receivedMessages.value.slice(-4), { message, timestamp }];
    pulseActive.value = true;

    if (pulseTimeout) {
      clearTimeout(pulseTimeout);
    }
    pulseTimeout = setTimeout(() => {
      pulseActive.value = false;
    }, 600);
  });

  fabricInstance.serve(agent, 'hello@fame.fabric').then(() => {
    console.log('Hello agent served at: hello@fame.fabric');
    emit('ready');
  });
});

onBeforeUnmount(() => {
  if (pulseTimeout) {
    clearTimeout(pulseTimeout);
  }
});
</script>

<template>
  <div class="card">
    <div class="sentinel-icon-container">
      <img
        src="/images/agent.svg"
        alt="Agent Node"
        class="sentinel-icon"
        :class="{ 'pulse-active': pulseActive }"
      />
      <div v-if="pulseActive" class="pulse-overlay" />
    </div>
    <h2>Agent Node</h2>
    <p v-if="error" class="status-error">Error: {{ String(error) }}</p>
    <template v-if="fabric">
      <p class="status-active">✅ Active</p>

      <div class="messages-container">
        <p class="messages-title">
          {{ receivedMessages.length > 0 ? 'Received Messages:' : '\u00A0' }}
        </p>
        <div class="messages-list">
          <div
            v-for="(msg, idx) in receivedMessages"
            :key="msg.timestamp"
            class="message-item"
            :class="{ new: idx === receivedMessages.length - 1 }"
          >
            <div class="message-text">📨 {{ msg.message }}</div>
            <div class="message-timestamp">
              {{ new Date(msg.timestamp).toLocaleTimeString() }}
            </div>
          </div>
          <div ref="messagesEndRef" />
        </div>
      </div>
    </template>
  </div>
</template>
