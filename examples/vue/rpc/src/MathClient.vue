<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFabric, useRemoteAgent } from '@naylence/vue';

const { fabric, error } = useFabric();
const x = ref(3);
const y = ref(4);
const n = ref(10);
const result = ref<string | null>(null);
const loading = ref(false);

const mathAgent = useRemoteAgent<any>('math@fame.fabric');
const hasAgent = computed(() => !!mathAgent.value);

const handleAdd = async () => {
  if (!mathAgent.value) return;
  loading.value = true;
  try {
    const sum = await mathAgent.value.add({ x: x.value, y: y.value });
    result.value = `${x.value} + ${y.value} = ${sum}`;
  } catch (err) {
    console.error('Add operation failed:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    loading.value = false;
  }
};

const handleMultiply = async () => {
  if (!mathAgent.value) return;
  loading.value = true;
  try {
    const product = await mathAgent.value.multiply({ x: x.value, y: y.value });
    result.value = `${x.value} × ${y.value} = ${product}`;
  } catch (err) {
    console.error('Multiply operation failed:', err);
    alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    loading.value = false;
  }
};

const handleFibStream = async () => {
  if (!mathAgent.value) return;
  loading.value = true;
  try {
    const fibStream = await mathAgent.value.fib_stream({ _stream: true, n: n.value });
    const results: number[] = [];
    for await (const value of fibStream) {
      results.push(value);
    }
    result.value = `Fibonacci(${n.value}): ${results.join(', ')}`;
  } catch (err) {
    console.error('Fibonacci stream failed:', err);
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
        <div class="input-row">
          <label>x:</label>
          <input v-model.number="x" type="number" class="client-input" />
        </div>

        <div class="input-row">
          <label>y:</label>
          <input v-model.number="y" type="number" class="client-input" />
        </div>

        <div class="button-group">
          <button :disabled="!hasAgent" @click="handleAdd">Add</button>
          <button :disabled="!hasAgent" @click="handleMultiply">Multiply</button>
        </div>

        <div class="input-row">
          <label>n:</label>
          <input v-model.number="n" type="number" class="client-input" />
        </div>

        <button :disabled="!hasAgent" class="fib-button" @click="handleFibStream">
          Fibonacci Stream
        </button>
      </div>

      <div class="client-response" :class="{ empty: !result }">
        {{ result || '\u00A0' }}
      </div>
    </template>
  </div>
</template>
