<template>
  <form class="space-y-3" @submit.prevent="handleSubmit">
    <div
      class="flex items-start gap-3 rounded-3xl border border-[#2c4724]/80 bg-gradient-to-r from-[#152315]/95 via-[#182c18]/95 to-[#1f3820]/95 px-5 py-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition focus-within:border-primary/80 focus-within:shadow-[0_40px_80px_rgba(57,224,121,0.22)]"
    >
      <div class="relative shrink-0">
        <button
          ref="menuButtonRef"
          type="button"
          class="flex size-11 items-center justify-center rounded-full border border-[#2f4a2f]/80 bg-[#132313] text-[#8adf9f] transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="isBusy || isPreparingAttachment"
          @click="toggleMenu"
        >
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="sr-only">Attach file</span>
        </button>

        <transition name="fade-scale">
          <div
            v-if="menuOpen"
            ref="menuRef"
            class="absolute bottom-[calc(100%+0.75rem)] left-0 z-30 w-56 rounded-2xl border border-[#2f4a2f]/70 bg-[#0f1a12]/95 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            <div class="absolute -bottom-2 left-6 h-3 w-3 rotate-45 border-b border-r border-[#2f4a2f]/70 bg-[#0f1a12]/95"></div>
            <p class="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5d7a5f]">Attach</p>
            <div class="flex flex-col gap-1">
              <button
                type="button"
                class="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-white/90 transition hover:bg-[#1a2b1a]"
                @click="triggerImagePicker"
              >
                <span class="flex size-8 items-center justify-center rounded-xl bg-[#17311c] text-[#8adf9f]">
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <rect x="3" y="4" width="14" height="12" rx="2" />
                    <path d="m6.5 11.5 2.5-2.5 4.5 4.5M12 9.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                  </svg>
                </span>
                <span>
                  <span class="block">Upload Image</span>
                  <span class="block text-xs font-normal text-[#6f8f74]">PNG, JPG, WebP</span>
                </span>
              </button>

              <button
                type="button"
                class="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-white/90 transition hover:bg-[#1a2b1a]"
                @click="triggerDocumentPicker"
              >
                <span class="flex size-8 items-center justify-center rounded-xl bg-[#17311c] text-[#8adf9f]">
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M12.5 3.5H7.75c-1.24 0-2.25 1-2.25 2.25v8.5c0 1.24 1 2.25 2.25 2.25h4.5c1.24 0 2.25-1 2.25-2.25V7.5L12.5 3.5Z" />
                    <path d="M12.25 3.5v3.75H15" />
                    <path d="M7.75 10.25h4.5" />
                    <path d="M7.75 13.25h4.5" />
                  </svg>
                </span>
                <span>
                  <span class="block">Upload Document</span>
                  <span class="block text-xs font-normal text-[#6f8f74]">PDF, DOCX, TXT</span>
                </span>
              </button>
            </div>
          </div>
        </transition>

        <input
          ref="imageInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="hidden"
          @change="onImageInputChange"
        />
        <input
          ref="documentInputRef"
          type="file"
          accept=".pdf,.docx,.txt"
          class="hidden"
          @change="onDocumentInputChange"
        />
      </div>

      <textarea
        ref="textareaRef"
        v-model="draft"
        rows="1"
        class="min-h-[3rem] flex-1 resize-none overflow-hidden bg-transparent text-base leading-relaxed text-white placeholder:text-[#6d8f71] focus:outline-none"
        placeholder="Message Banx..."
        :disabled="isBusy || isPreparingAttachment"
        @input="autoResize"
        @keydown.enter.exact.prevent="handleEnter"
      ></textarea>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-full border border-[#315232] bg-[#1b2e1a] text-[#8adf9f] transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="chatIsEmpty"
          @click="handleShare"
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
          <span class="sr-only">Share conversation</span>
        </button>

        <button
          type="submit"
          class="flex size-12 items-center justify-center rounded-full bg-primary text-background-dark transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isBusy || isPreparingAttachment || cannotSubmit"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="m16.92 9.62-11-6a1 1 0 0 0-1.48.88l.08 3.31a1 1 0 0 0 .62.9l4.27 1.7-4.25 1.69a1 1 0 0 0-.63.92l.09 3.35a1 1 0 0 0 1.48.87l10.98-6a1 1 0 0 0 .02-1.76Z"
              fill="currentColor"
            />
          </svg>
          <span class="sr-only">Send message</span>
        </button>
      </div>
    </div>

    <transition name="fade-scale">
      <div
        v-if="imageAttachment"
        class="flex items-center gap-4 rounded-2xl border border-[#2c4724]/70 bg-[#112015] p-3 text-sm text-[#8adf9f]"
      >
        <img
          :src="imageAttachment.dataUrl"
          :alt="`Preview of ${imageAttachment.name}`"
          class="h-16 w-16 rounded-xl border border-[#2c4724]/60 object-cover"
        />
        <div class="flex-1 truncate">
          <p class="truncate font-semibold">{{ imageAttachment.name }}</p>
          <p class="text-xs text-[#6f8f74]">Image ready to send.</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-[#2c4724]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8f74] transition hover:border-primary/60 hover:text-primary"
          @click="clearAttachment"
        >
          Remove
        </button>
      </div>
      <div
        v-else-if="documentAttachment"
        class="flex items-center gap-4 rounded-2xl border border-[#2c4724]/70 bg-[#112015] p-3 text-sm text-[#8adf9f]"
      >
        <div class="flex size-14 items-center justify-center rounded-2xl border border-[#2f4a2f]/70 bg-[#1a2d1a] text-[20px]">
          📄
        </div>
        <div class="flex-1 truncate">
          <p class="truncate font-semibold">{{ documentAttachment.name }}</p>
          <p class="max-h-10 overflow-hidden text-xs text-[#6f8f74]">{{ documentAttachment.snippet }}</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-[#2c4724]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8f74] transition hover:border-primary/60 hover:text-primary"
          @click="clearAttachment"
        >
          Remove
        </button>
      </div>
    </transition>

    <div class="flex items-center justify-between text-[11px] font-medium text-[#6f8f74]">
      <p>Press Enter to send · Shift + Enter for a new line</p>
      <div class="flex items-center gap-2 text-primary">
        <template v-if="isPreparingAttachment">
          <span class="h-1.5 w-1.5 animate-ping rounded-full bg-primary"></span>
          Processing attachment…
        </template>
        <template v-else-if="isBusy">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
          Sending…
        </template>
      </div>
    </div>

    <transition name="fade-scale">
      <div v-if="toast.visible" :class="toastClasses">
        {{ toast.message }}
      </div>
    </transition>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useChatStore } from '@/store'
import type { PreparedAttachment, DocumentAttachmentPayload, ImageAttachmentPayload } from '@/types/chat'
import {
  AttachmentError,
  prepareDocumentAttachment,
  prepareImageAttachment,
} from '@/utils/attachment'

const emit = defineEmits<{
  (event: 'submit', payload: { content: string; attachment?: PreparedAttachment }): void
  (event: 'share'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const documentInputRef = ref<HTMLInputElement | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)
const menuButtonRef = ref<HTMLButtonElement | null>(null)

const draft = ref('')
const menuOpen = ref(false)
const selectedAttachment = ref<PreparedAttachment | null>(null)
const isPreparingAttachment = ref(false)
const toast = ref<{ visible: boolean; message: string; tone: 'success' | 'error' }>(
  {
    visible: false,
    message: '',
    tone: 'success',
  },
)
let toastTimeout: number | undefined

const chatStore = useChatStore()
const isBusy = computed(() => chatStore.state.status === 'loading')
const messages = computed(() => chatStore.state.messages)

const chatIsEmpty = computed(() => messages.value.length === 0)
const cannotSubmit = computed(
  () => draft.value.trim().length === 0 && !selectedAttachment.value,
)

const imageAttachment = computed<ImageAttachmentPayload | null>(() =>
  selectedAttachment.value?.type === 'image' ? selectedAttachment.value : null,
)

const documentAttachment = computed<DocumentAttachmentPayload | null>(() =>
  selectedAttachment.value?.type === 'document' ? selectedAttachment.value : null,
)

function autoResize() {
  const textarea = textareaRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

function showToast(message: string, tone: 'success' | 'error' = 'success') {
  window.clearTimeout(toastTimeout)
  toast.value = { visible: true, message, tone }
  toastTimeout = window.setTimeout(() => {
    toast.value.visible = false
  }, 2600)
}

function pushAssistantError(message: string) {
  chatStore.dispatch('pushAssistantMessage', { content: message })
}

function toggleMenu() {
  if (isBusy.value || isPreparingAttachment.value) return
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function triggerImagePicker() {
  closeMenu()
  imageInputRef.value?.click()
}

function triggerDocumentPicker() {
  closeMenu()
  documentInputRef.value?.click()
}

function handleAttachmentError(error: unknown) {
  let message = '❌ Unable to process the file. Please try again.'
  if (error instanceof AttachmentError) {
    if (error.code === 'size-limit') {
      message = '❌ File too large (max 10MB).'
    } else if (error.code === 'unsupported-type') {
      message = '❌ Unsupported file type. Try .pdf, .docx, .txt, .png, .jpg, or .webp.'
    } else if (error.code === 'processing-error') {
      message = '❌ Could not read file. Try a simpler document.'
    } else if (error.code === 'empty-text') {
      message = '❌ No readable text found in that file.'
    }
  }
  showToast(message, 'error')
  pushAssistantError(message)
}

async function onImageInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.item(0)
  input.value = ''
  if (!file) return

  isPreparingAttachment.value = true
  try {
    const prepared = await prepareImageAttachment(file)
    selectedAttachment.value = prepared
    showToast('Image attached.', 'success')
  } catch (error) {
    selectedAttachment.value = null
    handleAttachmentError(error)
  } finally {
    isPreparingAttachment.value = false
  }
}

async function onDocumentInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.item(0)
  input.value = ''
  if (!file) return

  isPreparingAttachment.value = true
  try {
    const prepared = await prepareDocumentAttachment(file)
    selectedAttachment.value = prepared
    showToast('Document ready to send.', 'success')
  } catch (error) {
    selectedAttachment.value = null
    handleAttachmentError(error)
  } finally {
    isPreparingAttachment.value = false
  }
}

function clearAttachment() {
  selectedAttachment.value = null
}

function handleShare() {
  if (chatIsEmpty.value) {
    showToast('Nothing to share yet.', 'error')
    return
  }

  emit('share')
}

function handleEnter() {
  if (cannotSubmit.value || isBusy.value || isPreparingAttachment.value) return
  handleSubmit()
}

function handleSubmit() {
  if (cannotSubmit.value || isBusy.value || isPreparingAttachment.value) return

  const trimmed = draft.value.trim()
  const payload = {
    content: trimmed,
    attachment: selectedAttachment.value ?? undefined,
  }

  emit('submit', payload)
  draft.value = ''
  selectedAttachment.value = null

  nextTick(() => {
    const textarea = textareaRef.value
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.focus()
    }
  })
}

function handleGlobalClick(event: MouseEvent) {
  if (!menuOpen.value) return
  const target = event.target as Node
  if (menuRef.value?.contains(target) || menuButtonRef.value?.contains(target)) {
    return
  }
  closeMenu()
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick, true)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.clearTimeout(toastTimeout)
  document.removeEventListener('click', handleGlobalClick, true)
  document.removeEventListener('keydown', handleEscape)
})

const toastClasses = computed(() => [
  'ml-auto w-max rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]',
  toast.value.tone === 'success'
    ? 'border-[#2f4a2f] bg-[#102013] text-[#8adf9f]'
    : 'border-rose-600/60 bg-[#2b1616] text-rose-200',
])
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
