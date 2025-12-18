<template>
  <div class="flex items-center justify-between text-xs text-[#6f8f74]">
    <span v-if="status === 'loading'" class="flex items-center gap-2 text-primary">
      <span class="h-2 w-2 animate-ping rounded-full bg-primary"></span>
      Banx AI is thinking…
    </span>
    <span v-else-if="status === 'error'" class="flex items-center gap-2 text-rose-300">
      <span class="h-2 w-2 rounded-full bg-rose-400"></span>
      {{ errorMessage ?? 'Something went wrong. Try again.' }}
    </span>
    <span v-else class="flex items-center gap-2 text-[#6f8f74]">
      <span class="h-2 w-2 rounded-full bg-primary/70"></span>
      Ready for your prompt
    </span>

    <span class="text-[#536755]">
      {{ modeLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/store'

const chatStore = useChatStore()

const status = computed(() => chatStore.state.status)
const errorMessage = computed(() => chatStore.state.errorMessage)
const modeLabel = computed(() => chatStore.getters.selectedMode.label)
</script>
