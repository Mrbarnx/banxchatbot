<template>
  <div class="flex flex-col gap-4">
    <header class="flex items-center justify-between">
      <h2 class="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Modes</h2>
      <span class="text-[11px] text-text-muted/80">Choose expertise</span>
    </header>

    <ul class="flex flex-col gap-2">
      <li v-for="mode in modes" :key="mode.id">
        <label
          class="group flex cursor-pointer flex-col gap-1 rounded-xl border border-surface-border bg-surface-dark/80 px-4 py-3 transition hover:border-primary/40 hover:bg-[#20321a]"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full border border-surface-border bg-background-dark transition group-hover:border-primary/60"
                :class="mode.id === selectedModeId ? 'border-primary bg-primary/10' : ''"
              >
                <span
                  class="block h-2.5 w-2.5 rounded-full transition"
                  :class="mode.id === selectedModeId ? 'bg-primary' : 'bg-transparent'"
                ></span>
              </span>
              <span class="text-sm font-semibold text-white">{{ mode.label }}</span>
            </div>
            <span class="text-[11px] uppercase tracking-[0.24em] text-text-muted/70">{{ mode.id }}</span>
          </div>
          <p class="text-xs text-text-muted">{{ mode.description }}</p>
          <input
            class="sr-only"
            type="radio"
            name="mode"
            :checked="mode.id === selectedModeId"
            @change="() => onSelect(mode.id)"
          />
        </label>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { chatModes, useChatStore } from '@/store'

const chatStore = useChatStore()

const modes = chatModes

const selectedModeId = computed(() => chatStore.state.selectedModeId)

function onSelect(modeId: string) {
  chatStore.dispatch('changeMode', modeId)
}
</script>
