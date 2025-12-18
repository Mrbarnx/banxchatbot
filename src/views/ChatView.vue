<template>
  <div class="flex h-screen w-full bg-[#0d1710] text-white">
    <SidebarShell
      ref="sidebarRef"
      :mobile-open="mobileDrawerOpen"
      @new-chat="handleSidebarNewChat"
      @select-chat="handleSidebarSelectChat"
      @clear-active="handleSidebarClearActive"
      @close-mobile="closeMobileDrawer"
    />

    <main class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="z-10 flex items-center justify-between border-b border-[#1b281b] bg-[#111d13]/95 px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur"
      >
        <div class="flex items-center gap-4 text-white">
          <div
            class="flex size-10 items-center justify-center rounded-full border border-[#2f4a2f] bg-[#111d13] bg-cover bg-center shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
            :style="banxLogoStyle"
          ></div>
          <SidebarToggle
            class="md:hidden"
            :collapsed="sidebarCollapsed"
            variant="icon"
            @toggle="toggleSidebar"
          />
          <div class="hidden flex-col sm:flex">
            <span class="text-sm font-semibold tracking-[-0.02em] text-white/90">Banx v1.0</span>
            <span class="text-xs font-medium text-[#85a286]">{{ activeChatTitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-9 items-center justify-center gap-2 rounded-full border border-[#264127] bg-[#172516] px-3 text-sm font-semibold text-white transition hover:border-primary/60 hover:bg-[#23341f]"
            @click="handleShareRequest"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="errorMessage"
          class="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/50 bg-gradient-to-r from-[#2a1515] to-[#311719] px-5 py-4 text-sm text-rose-100 shadow-[0_18px_38px_rgba(0,0,0,0.45)] md:mx-6"
        >
          <span class="material-symbols-outlined text-[20px] text-rose-300">error</span>
          <div class="flex-1 space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Something went wrong</p>
            <p class="leading-relaxed">{{ errorMessage }}</p>
          </div>
          <button
            type="button"
            class="-mr-1 flex size-7 items-center justify-center rounded-full border border-transparent text-rose-200 transition hover:border-rose-400/60 hover:text-rose-100"
            @click="dismissError"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </Transition>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="shareNotice.visible"
          :class="[
            'mx-4 mt-3 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm shadow-[0_12px_28px_rgba(0,0,0,0.45)] md:mx-6 transition',
            shareNotice.tone === 'error'
              ? 'border-rose-500/60 bg-[#2a1414]/95 text-rose-200'
              : 'border-[#2f4a2f]/70 bg-[#142215]/95 text-[#8adf9f]'
          ]"
        >
          <svg class="h-4 w-4" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M7.5 11.25 5.25 9m2.25 2.25L12.75 6.5M9 1.75C4.995 1.75 1.75 4.995 1.75 9s3.245 7.25 7.25 7.25 7.25-3.245 7.25-7.25S13.005 1.75 9 1.75Z"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="flex-1 text-sm">{{ shareNotice.message }}</p>
          <button
            type="button"
            class="rounded-full border border-[#2f4a2f]/60 px-2 py-1 text-xs uppercase tracking-[0.18em] text-[#6f8f74] transition hover:border-primary/60 hover:text-primary"
            @click="dismissShareNotice"
          >
            Close
          </button>
        </div>
      </Transition>

      <div class="relative flex-1 overflow-hidden">
        <div
          ref="scrollContainer"
          class="h-[calc(100vh-13rem)] overflow-y-auto px-4 py-6 pb-20 scroll-smooth"
          @scroll="handleScroll"
        >
          <div class="mx-auto flex max-w-3xl flex-col gap-10">
            <section class="flex flex-col items-center gap-6 pt-8 text-center">
              <div class="size-16 rounded-full bg-cover bg-center shadow-banx-glow" :style="{ backgroundImage: heroImage }"></div>
              <div class="flex flex-col items-center gap-1">
                <p class="text-2xl font-bold tracking-tight">Hello, I'm Banx.</p>
                <p class="text-sm font-medium text-[#6f8f74]">I'm ready to help you with your tasks.</p>
              </div>
              <span class="h-px w-full max-w-xl bg-gradient-to-r from-transparent via-[#20311f] to-transparent"></span>
            </section>

            <section v-if="hasMessages">
              <MessageList class="px-0" />
            </section>

            <section v-else class="flex flex-col gap-8">
              <div class="flex items-end justify-end gap-3 pl-10">
                <div class="flex max-w-[85%] flex-col items-end gap-2">
                  <p class="text-[11px] font-medium text-text-muted">You</p>
                  <div class="rounded-3xl rounded-tr-sm bg-primary px-5 py-3.5 text-base font-medium text-background-dark shadow-lg">
                    Show me some examples of what you can do.
                  </div>
                </div>
                <div
                  class="size-8 shrink-0 rounded-full border border-surface-border bg-cover bg-center"
                  :style="{ backgroundImage: sampleUserAvatar }"
                  aria-hidden="true"
                ></div>
              </div>

              <div class="flex items-start gap-3 pr-10">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#3f6534] bg-[#122417] bg-cover bg-center shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
                  :style="banxLogoStyle"
                ></div>
                <div class="flex max-w-[90%] flex-col gap-3 text-left">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-text-muted">Banx</p>
                  <div class="text-base leading-relaxed text-gray-100">
                    <p class="mb-4">Here are a few diverse tasks I can assist you with, from coding to creative writing:</p>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <button
                        v-for="prompt in suggestedPrompts"
                        :key="prompt.title"
                        type="button"
                        @click="handlePromptSelect(prompt.template)"
                        class="group flex flex-col gap-3 rounded-[22px] border border-[#243723] bg-gradient-to-b from-[#192818] to-[#121f14] px-6 py-5 text-left transition hover:border-primary/60 hover:from-[#1e331d] hover:to-[#162611]"
                      >
                        <span
                          class="material-symbols-outlined flex size-9 items-center justify-center rounded-full bg-[#1e2f1d] text-[22px] text-primary transition group-hover:scale-110"
                        >
                          {{ prompt.icon }}
                        </span>
                        <div class="flex flex-col gap-1">
                          <h3 class="text-sm font-semibold text-white">{{ prompt.title }}</h3>
                          <p class="text-xs text-[#6f8f74]">{{ prompt.subtitle }}</p>
                        </div>
                      </button>
                    </div>
                    <p class="mt-4">Would you like to try one of these, or do you have something else in mind?</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="absolute inset-x-0 bottom-0 z-50 bg-[#0d1710] px-4 pb-6 pt-4">
          <div class="mx-auto w-full max-w-3xl space-y-3">
            <StatusBar class="flex items-center justify-between rounded-full border border-[#1a2a1a] bg-[#0f1a12] px-4 py-2 text-[12px] text-[#6f8f74]" />
            <ChatInput ref="chatInputRef" @submit="onSend" @share="handleShareRequest" />
            <p class="text-center text-[11px] font-medium text-[#6f8f74]">
              Banx may display inaccurate info, including about people, so double-check its responses.
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ChatInput from '@/components/ChatInput.vue'
import MessageList from '@/components/MessageList.vue'
import SidebarShell from '@/components/SidebarShell.vue'
import SidebarToggle from '@/components/SidebarToggle.vue'
import StatusBar from '@/components/StatusBar.vue'
import { BANX_LOGO_BACKGROUND } from '@/constants/branding'
import { useChatStore } from '@/store'
import type { PreparedAttachment } from '@/types/chat'
import { useChat } from '@/composables/useChat'

const chatStore = useChatStore()

const hasMessages = computed(() => chatStore.getters.hasMessages)
const errorMessage = computed(() => chatStore.state.errorMessage)

interface SidebarShellExpose {
  toggleSidebar: () => void
  isCollapsed: boolean
}

const scrollContainer = ref<HTMLDivElement | null>(null)
const shouldStickToBottom = ref(true)
const sidebarRef = ref<SidebarShellExpose | null>(null)
const sidebarCollapsed = computed(() => sidebarRef.value?.isCollapsed ?? false)

const banxLogoStyle = { backgroundImage: BANX_LOGO_BACKGROUND }
const heroImage = BANX_LOGO_BACKGROUND

const mobileDrawerOpen = ref(false)
const isMobile = ref(false)
let mediaQuery: MediaQueryList | null = null

const { activeChatTitle, initialize: initializeChats, sendMessage } = useChat()

const sampleUserAvatar = 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDEIT8PvItthaG9NGApMmONR66kwH4UKTPd1mM7BjWqcx9mAv_cmLG5ry66YR1v-BazYLz415M2A-q0vhEtdbTNyn4BYIw1wdeUIRZtZWScDPfWdfT0kmLyj1LhpXWsGkJrxXM6qscUM1vmCDemNpyuhTFFUXCC4niEY5x17HaX6ng06hP1Fjrq7Wrp6pxQvejISGDP5Yjp0YPu2cUcIStCvzADvOqXmeCb2Ke-MzMZQEU2e3q-8O87L5ki_QYxYLMH3xiT-cZUfuVP")'

const suggestedPrompts = [
  { 
    icon: 'terminal', 
    title: 'Draft Prompt', 
    subtitle: 'High value prompt template',
    template: `I need a high-value, detailed prompt for [describe your topic/goal here] that will help me [describe your specific need]. 

Please include:
1. Clear instructions for the AI
2. Desired output format
3. Any specific tone or style requirements
4. Key points to cover

Make the prompt structured and specific to get the best results.`
  },
  { 
    icon: 'code', 
    title: 'Debug Code', 
    subtitle: 'Get help with code issues',
    template: `I'm having an issue with my code. Here's the relevant part:

[Paste your code here]

The error I'm getting is: [describe the error or unexpected behavior]

I've tried: [list what you've tried so far]

Environment details:
- Language/Version: [e.g., Python 3.9]
- OS: [e.g., Windows 10]
- Any relevant libraries/frameworks: [list them]`
  },
  { 
    icon: 'mail', 
    title: 'Draft Email', 
    subtitle: 'Professional communication',
    template: `Please help me draft a professional email with the following details:

Recipient: [Name/Title]
Subject: [Brief subject line]
Purpose: [Main goal of the email]
Key points to include:
1. 
2. 
3. 

Tone: [Professional/Friendly/Formal/Other]
Additional context: [Any other relevant information]`
  },
]

interface InputPayload {
  content: string
  attachment?: PreparedAttachment
}

const shareNotice = ref({ visible: false, message: '', tone: 'success' as 'success' | 'error' })

// Reference to the chat input component
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null)

// Handle prompt selection
function handlePromptSelect(template: string) {
  if (chatInputRef.value) {
    // Access the textarea and set its value
    const textarea = chatInputRef.value.$el?.querySelector('textarea')
    if (textarea) {
      textarea.value = template
      textarea.focus()
      // Trigger input event to update any bound values
      const event = new Event('input', { bubbles: true })
      textarea.dispatchEvent(event)
    }
  }
}
let shareTimeout: number | undefined

function handleScroll() {
  const el = scrollContainer.value
  if (!el) return
  const threshold = 120
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  shouldStickToBottom.value = distanceToBottom <= threshold
}

async function scrollToLatest(force = false) {
  if (!scrollContainer.value) return
  await nextTick()
  const el = scrollContainer.value
  if (!el) return
  if (!force && !shouldStickToBottom.value) return
  el.scrollTo({ top: el.scrollHeight, behavior: force ? 'auto' : 'smooth' })
}

onMounted(() => {
  initializeChats()
  scrollToLatest(true)

  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia('(max-width: 767px)')
    isMobile.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleMediaChange)
  }
})

watch(
  () => chatStore.state.messages,
  () => {
    scrollToLatest()
  },
  { deep: true }
)

watch(
  () => chatStore.state.status,
  (newStatus, oldStatus) => {
    if (newStatus === 'idle' && oldStatus === 'loading') {
      scrollToLatest()
    }
  }
)

watch(
  () => chatStore.state.messages.length,
  (length, previousLength) => {
    if (length === 0 && previousLength !== 0) {
      shouldStickToBottom.value = true
      scrollToLatest(true)
    }
  }
)

async function onSend(payload: InputPayload) {
  chatStore.dispatch('sendUserMessage', {
    content: payload.content,
    attachment: payload.attachment,
  })
  shouldStickToBottom.value = true

  try {
    await sendMessage(payload)
  } catch (error) {
    const message =
      error instanceof Error ? `❌ OpenRouter error: ${error.message}` : '❌ OpenRouter error.'
    chatStore.dispatch('appendAssistantChunk', message)
    chatStore.dispatch('failAssistantMessage', message)
  }
}

function dismissError() {
  chatStore.dispatch('clearError')
}

function toggleSidebar() {
  if (isMobile.value) {
    mobileDrawerOpen.value = !mobileDrawerOpen.value
    return
  }

  sidebarRef.value?.toggleSidebar()
}

function handleSidebarNewChat() {
  shouldStickToBottom.value = true
  scrollToLatest(true)
}

function handleSidebarSelectChat() {
  shouldStickToBottom.value = true
  scrollToLatest(true)
}

function handleSidebarClearActive() {
  shouldStickToBottom.value = true
  scrollToLatest(true)
}

function showShareNotice(message: string, tone: 'success' | 'error') {
  window.clearTimeout(shareTimeout)
  shareNotice.value = { visible: true, message, tone }
  shareTimeout = window.setTimeout(() => {
    shareNotice.value.visible = false
  }, 2600)
}

async function handleShareRequest() {
  const transcript = buildTranscript()
  if (!transcript) {
    showShareNotice('Nothing to share yet.', 'error')
    return
  }

  try {
    await navigator.clipboard.writeText(transcript)
    showShareNotice('Chat copied to clipboard!', 'success')
  } catch (error) {
    console.error('Clipboard copy failed', error)
    showShareNotice('Clipboard unavailable. Please copy manually.', 'error')
  }
}

function dismissShareNotice() {
  shareNotice.value.visible = false
  window.clearTimeout(shareTimeout)
}

function closeMobileDrawer() {
  mobileDrawerOpen.value = false
}

function handleMediaChange(event: MediaQueryListEvent) {
  isMobile.value = event.matches
  if (!event.matches) {
    mobileDrawerOpen.value = false
  }
}

function buildTranscript(): string | null {
  if (chatStore.state.messages.length === 0) {
    return null
  }

  return chatStore.state.messages
    .map((message) => {
      const time = new Date(message.createdAt).toLocaleString()
      const speaker = message.role === 'user' ? 'You' : 'Banx'
      const segments: string[] = [`[${time}] ${speaker}`]
      if (message.content.trim().length > 0) {
        segments.push(message.content)
      }
      if (message.attachment?.type === 'image') {
        segments.push(`![${message.attachment.name}](${message.attachment.dataUrl})`)
      } else if (message.attachment?.type === 'document') {
        segments.push(
          `Document: ${message.attachment.name}\nSnippet: ${message.attachment.snippet}`
        )
      }
      return segments.join('\n')
    })
    .join('\n\n')
}

onBeforeUnmount(() => {
  window.clearTimeout(shareTimeout)
  mediaQuery?.removeEventListener('change', handleMediaChange)
})
</script>
