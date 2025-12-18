<template>
  <div :class="['flex flex-col gap-8', props.class]">
    <template v-if="messages.length">
      <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
    </template>
    <div
      v-else
      class="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[#1f2d1f] bg-[#0f1a12]/80 px-6 py-8 text-center text-sm text-[#6f8f74] shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
    >
      <span class="material-symbols-outlined text-[28px] text-primary/90">auto_fix</span>
      <p class="max-w-md leading-relaxed">
        Your workspace is ready. Ask Banx anything—from debugging code to planning content—and your conversation will populate here.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChatMessage from '@/components/ChatMessage.vue'
import { useChatStore } from '@/store'

const props = defineProps<{
  class?: string
}>()

const chatStore = useChatStore()

const messages = computed(() => chatStore.state.messages)
</script>
