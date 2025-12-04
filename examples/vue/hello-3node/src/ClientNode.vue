<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFabric, useRemoteAgent } from '@naylence/vue';

const { fabric, error } = useFabric();
const message = ref('Hello, World!');
const response = ref<string | null>(null);
const loading = ref(false);

const helloAgent = useRemoteAgent<any>('hello@fame.fabric');
const hasAgent = computed(() => !!helloAgent.value);

const sayHello = async () => {
  if (!helloAgent.value) return;

  loading.value = true;
  try {
    const result = await helloAgent.value.runTask({ message: message.value });
    response.value = result;
  } catch (err) {
    console.error('Agent call failed:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="card">
    <img src="/images/browser-client.svg" alt="Browser Client" class="client-icon" />
    <h2>Client</h2>
    <p v-if="error" class="status-error">Error: {{ String(error) }}</p>
    <template v-if="fabric">
      <p class="status-active">✅ Connected</p>

      <div class="client-input-container">
        <input
          v-model="message"
          type="text"
          placeholder="Enter a message"
          class="client-input"
          @keydown.enter="sayHello"
        />
        <button :disabled="!hasAgent" @click="sayHello">Send</button>
      </div>

      <div v-if="response" class="client-response">
        {{ response }}
      </div>
    </template>
  </div>
</template>
