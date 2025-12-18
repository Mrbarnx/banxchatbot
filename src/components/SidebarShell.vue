<template>
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showMobileOverlay"
      class="fixed inset-0 z-40 bg-[#050a07]/70 backdrop-blur-sm md:hidden"
      @click="closeMobile"
    ></div>
  </Transition>

  <aside :class="containerClasses">
    <div v-if="showCollapsedLayout" class="flex h-full flex-col items-center justify-between">
      <div class="flex flex-col items-center gap-6">
        <div
          class="flex size-12 items-center justify-center rounded-full border border-[#2f4a2f] bg-[#101a12] bg-cover bg-center shadow-[0_12px_26px_rgba(0,0,0,0.45)]"
          :style="banxLogoStyle"
          title="Profile"
        ></div>

        <div class="flex flex-col items-center gap-4">
          <SidebarToggle :collapsed="isCollapsed" variant="icon" @toggle="toggleSidebar" />
          <button
            type="button"
            class="flex size-12 items-center justify-center rounded-full border border-[#2b422c] bg-[#142214] text-primary transition hover:border-primary/50 hover:bg-[#1b2f1b]"
            title="New chat"
            @click="handleNewChat"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

    </div>

    <div v-else class="flex h-full flex-col gap-8">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex size-9 items-center justify-center rounded-full border border-[#2f4a2f] bg-[#101a12] bg-cover bg-center shadow-[0_10px_22px_rgba(0,0,0,0.4)]"
            :style="banxLogoStyle"
          ></div>
          <div class="flex flex-col">
            <h1 class="text-[20px] font-extrabold tracking-tight">Banx AI</h1>
            <p class="text-xs font-medium text-[#6f8f74]">{{ chatCount }} chats</p>
          </div>
        </div>
        <div class="max-w-[220px]">
          <SidebarToggle :collapsed="isCollapsed" :variant="isMobile ? 'icon' : 'pill'" @toggle="toggleSidebar" />
        </div>
      </div>

      <button
        type="button"
        class="group flex w-full items-center justify-between rounded-full bg-primary/95 px-5 py-3 text-sm font-semibold text-background-dark shadow-[0_20px_45px_rgba(57,224,121,0.25)] transition hover:bg-primary"
        @click="handleNewChat"
      >
        <span class="flex items-center gap-3">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          New Chat
        </span>
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M8 5h6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <path d="m6 14 8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>

      <nav class="flex flex-1 flex-col gap-4 overflow-hidden text-sm">
        <header class="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8f74]">
          <span>Recent Chats</span>
          <span class="rounded-full bg-[#152616] px-2 py-0.5 text-[10px] text-[#6f8f74]">{{ chatCount }}</span>
        </header>
        <div class="-mx-2 flex-1 overflow-y-auto pr-2">
          <ul class="flex flex-col gap-2 px-2">
            <li v-for="chat in chats" :key="chat.id">
              <button
                type="button"
                class="group flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-left transition"
                :class="
                  chat.id === activeChatId
                    ? 'border-[#2d4a7a]/70 bg-[#132640] text-[#c3dcff] shadow-[0_16px_34px_rgba(18,38,64,0.45)]'
                    : 'bg-[#142515] hover:border-primary/40 hover:bg-[#1b311c]'
                "
                @click="handleSelectChat(chat.id)"
              >
                <span class="flex min-w-0 flex-col gap-1">
                  <span class="truncate font-semibold">{{ chat.title }}</span>
                  <span
                    class="text-xs"
                    :class="chat.id === activeChatId ? 'text-[#92b2f5]' : 'text-[#6f8f74]'"
                  >
                    {{ formatTimestamp(chat.updatedAt) }}
                  </span>
                </span>
                <svg
                  class="h-4 w-4 transition"
                  :class="chat.id === activeChatId ? 'text-[#92b2f5]' : 'text-[#6f8f74] group-hover:text-primary'"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </li>
            <li v-if="chatCount === 0" class="rounded-2xl border border-dashed border-[#223420] bg-[#111d13] px-4 py-6 text-center text-xs text-[#536755]">
              No conversations yet. Start a new chat!
            </li>
          </ul>
        </div>
      </nav>

      <footer class="flex flex-col gap-3 border-t border-[#1f2d1f] pt-6">
        <button
          type="button"
          class="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium transition hover:border-primary/40 hover:bg-[#152616]"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5.5h10M5 10h6M5 14.5h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          Settings
        </button>
        <button
          type="button"
          class="flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-background-dark shadow-[0_15px_40px_rgba(57,224,121,0.3)] transition hover:brightness-110"
          @click="handleClearActive"
        >
          Clear current chat
        </button>
      </footer>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SidebarToggle from '@/components/SidebarToggle.vue'
import { BANX_LOGO_BACKGROUND } from '@/constants/branding'
import { useChat } from '@/composables/useChat'

const STORAGE_NAMESPACE = 'banxchatbot:sidebar'
const COLLAPSED_KEY = `${STORAGE_NAMESPACE}:collapsed`

const props = defineProps<{
  mobileOpen?: boolean
}>()

const emit = defineEmits<{
  (event: 'new-chat', chatId: string): void
  (event: 'select-chat', chatId: string): void
  (event: 'clear-active'): void
  (event: 'close-mobile'): void
}>()

const isCollapsed = ref(false)

const mobileOpen = computed(() => props.mobileOpen ?? false)

const isClient = typeof window !== 'undefined'
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const { chats, activeChatId, startNewChat, selectChat, clearActiveChat, initialize } = useChat()

const chatCount = computed(() => chats.value.length)

const containerClasses = computed(() => {
  if (isMobile.value) {
    return [
      'flex shrink-0 flex-col border-r border-[#1f2d1f] bg-[#0f1a12] text-white md:hidden',
      'fixed inset-y-0 left-0 z-50 w-[285px] max-w-[90vw] px-6 py-8 shadow-[0_22px_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-in-out',
      mobileOpen.value ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none',
    ]
  }

  return [
    'hidden shrink-0 flex-col border-r border-[#1f2d1f] bg-[#0f1a12] text-white transition-all duration-300 ease-in-out md:flex',
    isCollapsed.value ? 'w-[92px] px-3 py-6' : 'w-[300px] px-6 py-8',
  ]
})

const showCollapsedLayout = computed(() => !isMobile.value && isCollapsed.value)
const showMobileOverlay = computed(() => isMobile.value && mobileOpen.value)

const banxLogoStyle = { backgroundImage: BANX_LOGO_BACKGROUND }

const timeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const formatTimestamp = (value: number) => {
  try {
    return timeFormatter.format(value)
  } catch (error) {
    return ''
  }
}

const onMediaChange = (event: MediaQueryListEvent) => {
  isMobile.value = event.matches
}

onMounted(() => {
  initialize()

  if (!isClient) return

  const storedCollapsed = window.localStorage.getItem(COLLAPSED_KEY)
  if (storedCollapsed !== null) {
    isCollapsed.value = storedCollapsed === 'true'
  }

  mediaQuery = window.matchMedia('(max-width: 767px)')
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})

watch(isCollapsed, (collapsed) => {
  if (!isClient) return
  window.localStorage.setItem(COLLAPSED_KEY, String(collapsed))
})

function toggleSidebar() {
  if (isMobile.value) {
    closeMobile()
    return
  }

  isCollapsed.value = !isCollapsed.value
}

function handleNewChat() {
  const chatId = startNewChat()
  emit('new-chat', chatId)
  if (isMobile.value) {
    closeMobile()
  }
}

function handleSelectChat(chatId: string) {
  selectChat(chatId)
  emit('select-chat', chatId)
  if (isMobile.value) {
    closeMobile()
  }
}

function handleClearActive() {
  clearActiveChat()
  emit('clear-active')
  if (isMobile.value) {
    closeMobile()
  }
}

function closeMobile() {
  emit('close-mobile')
}

defineExpose({
  toggleSidebar,
  isCollapsed,
})
</script>
