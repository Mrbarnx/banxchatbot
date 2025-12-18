<template>
  <article :class="containerClasses">
    <div :class="bubbleClasses">
      <template v-if="message.content?.length">
        <p class="whitespace-pre-wrap break-words leading-relaxed">
          {{ message.content }}
        </p>
      </template>

      <template v-if="message.attachment?.type === 'image'">
        <figure class="mt-3 overflow-hidden rounded-lg">
          <img
            :src="message.attachment.dataUrl"
            :alt="message.attachment.name"
            class="max-h-80 w-full rounded-lg object-cover"
          />
          <figcaption class="mt-2 text-xs text-white/70">
            {{ message.attachment.name }}
          </figcaption>
        </figure>
      </template>

      <template v-else-if="message.attachment?.type === 'document'">
        <div class="mt-3 rounded-lg bg-black/30 p-3 text-sm text-white/80">
          <p class="font-semibold text-white">{{ message.attachment.name }}</p>
          <p class="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/70">
            {{ message.attachment.snippet }}
          </p>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '@/store'

const props = defineProps<{
  message: ChatMessage
}>()

const isUser = computed(() => props.message.role === 'user')

const containerClasses = computed(() => [
  'flex w-full px-4',
  isUser.value ? 'justify-end' : 'justify-start',
])

const bubbleClasses = computed(() => [
  'flex w-full max-w-3xl flex-col gap-1 text-sm leading-relaxed',
  'whitespace-pre-wrap break-words',
  isUser.value 
    ? 'self-end bg-[#0B7D5D] text-white rounded-2xl px-4 py-3' 
    : 'self-start text-gray-200',
])
</script>
