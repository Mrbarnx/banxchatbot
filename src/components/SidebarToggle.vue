<template>
  <button
    type="button"
    :aria-expanded="!collapsed"
    :aria-label="label"
    :class="buttonClasses"
    @click="emit('toggle')"
  >
    <span class="flex items-center gap-3" :class="isPill ? '' : 'justify-center'">
      <svg :class="splitIconClasses" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2.2" y="3" width="3.4" height="14" rx="1.5" fill="currentColor" />
        <rect x="7.6" y="5" width="10.2" height="10" rx="2" stroke="currentColor" stroke-width="1.6" />
      </svg>
      <span v-if="isPill">{{ collapsed ? 'Expand' : 'Collapse' }}</span>
      <span v-else class="sr-only">{{ label }}</span>
    </span>

    <svg
      v-if="isPill"
      class="h-3 w-3 text-current transition-transform duration-200 group-hover:translate-x-0.5"
      :class="collapsed ? '' : 'rotate-180'"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 2.5 8 6l-5 3.5"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  collapsed: boolean
  variant?: 'pill' | 'icon'
}>()

const emit = defineEmits<{
  (event: 'toggle'): void
}>()

const variant = computed(() => props.variant ?? 'pill')
const isPill = computed(() => variant.value === 'pill')

const buttonClasses = computed(() =>
  isPill.value
    ? 'group flex w-full items-center justify-between rounded-full border border-[#2b422c] bg-[#142214] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8f74] transition hover:border-primary/60 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40'
    : 'flex size-12 items-center justify-center rounded-full border border-[#2b422c] bg-[#142214] text-primary transition hover:border-primary/60 hover:bg-[#1b2f1b] focus:outline-none focus:ring-2 focus:ring-primary/40'
)

const splitIconClasses = computed(() => (isPill.value ? 'h-5 w-5 text-current' : 'h-5 w-5 text-current'))

const label = computed(() => (props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'))
</script>
