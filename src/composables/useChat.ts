import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { OpenRouter } from '@openrouter/sdk'
import { useChatStore, type ChatMessage } from '@/store'
import type { PreparedAttachment } from '@/types/chat'

interface StoredChat {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

interface StoredPayload {
  activeChatId?: string
  chats?: StoredChat[]
}

interface UseChatReturn {
  chats: ComputedRef<StoredChat[]>
  activeChatId: Ref<string>
  activeChatTitle: ComputedRef<string>
  initialize: () => void
  startNewChat: () => string
  selectChat: (chatId: string) => void
  clearActiveChat: () => void
  sendMessage: (payload: { content: string; attachment?: PreparedAttachment }) => Promise<void>
}

const STORAGE_KEY = 'banx_chats'
const DEFAULT_TITLE = 'New Chat'
const MAX_TITLE_LENGTH = 30
const MAX_TITLE_WORDS = 5

const chats = ref<StoredChat[]>([])
const activeChatId = ref<string>('')

let initialized = false

function cloneMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    attachment: message.attachment ? { ...message.attachment } : undefined,
  }))
}

function sortChats() {
  chats.value.sort((a, b) => {
    if (b.updatedAt === a.updatedAt) {
      return b.createdAt - a.createdAt
    }
    return b.updatedAt - a.updatedAt
  })
}

function persist() {
  if (typeof window === 'undefined') {
    return
  }
  const payload: StoredPayload = {
    activeChatId: activeChatId.value,
    chats: chats.value.map((chat) => ({
      ...chat,
      messages: cloneMessages(chat.messages),
    })),
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('Failed to persist chats', error)
  }
}

function loadFromStorage() {
  if (typeof window === 'undefined') {
    return
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw) as StoredPayload
    if (!parsed || !Array.isArray(parsed.chats)) {
      return
    }
    chats.value = parsed.chats.map((chat) => ({
      ...chat,
      title: chat.title?.trim().length ? chat.title : DEFAULT_TITLE,
      messages: cloneMessages(chat.messages ?? []),
      updatedAt: chat.updatedAt ?? chat.createdAt ?? Date.now(),
      createdAt: chat.createdAt ?? Date.now(),
    }))
    activeChatId.value = parsed.activeChatId ?? chats.value[0]?.id ?? ''
    sortChats()
  } catch (error) {
    console.warn('Failed to restore chats from storage', error)
  }
}

function getActiveChat(): StoredChat | undefined {
  return chats.value.find((chat) => chat.id === activeChatId.value)
}

function generateAutoTitle(messages: ChatMessage[]): string | null {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.content.trim().length > 0)
  if (!firstUserMessage) {
    return null
  }

  const normalized = firstUserMessage.content.trim().replace(/\s+/g, ' ')
  if (!normalized.length) {
    return null
  }

  const words = normalized.split(' ')
  let snippet = words.slice(0, MAX_TITLE_WORDS).join(' ')
  if (words.length > MAX_TITLE_WORDS) {
    snippet = `${snippet}…`
  }

  if (snippet.length > MAX_TITLE_LENGTH) {
    snippet = snippet.slice(0, MAX_TITLE_LENGTH).trim()
    if (!snippet.endsWith('…')) {
      snippet = `${snippet.replace(/[.,;:!?]$/, '').trim()}…`
    }
  }

  return snippet || DEFAULT_TITLE
}

function ensureTitle(chat: StoredChat) {
  if (chat.messages.length === 0) {
    chat.title = DEFAULT_TITLE
    return
  }
  if (chat.title && chat.title !== DEFAULT_TITLE) {
    return
  }
  const auto = generateAutoTitle(chat.messages)
  if (auto) {
    chat.title = auto
  }
}

function touchChat(chat: StoredChat) {
  chat.updatedAt = Date.now()
}

function updateActiveChatMessages(messages: ChatMessage[]) {
  const active = getActiveChat()
  if (!active) {
    return
  }
  active.messages = cloneMessages(messages)
  ensureTitle(active)
  touchChat(active)
  sortChats()
  persist()
}

function buildChatId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createChat(initialMessages: ChatMessage[] = []): StoredChat {
  const timestamp = Date.now()
  const chat: StoredChat = {
    id: buildChatId(),
    title: DEFAULT_TITLE,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: cloneMessages(initialMessages),
  }
  ensureTitle(chat)
  chats.value.unshift(chat)
  return chat
}

function removeEmptyTrailingChats() {
  if (chats.value.length <= 1) {
    return
  }
  chats.value = chats.value.filter((chat, index) => {
    if (index === 0) {
      return true
    }
    return chat.messages.length > 0
  })
}

function useChatInternal(): UseChatReturn {
  const chatStore = useChatStore()

  function initialize() {
    if (initialized) {
      return
    }
    loadFromStorage()

    if (chats.value.length === 0) {
      const chat = createChat()
      activeChatId.value = chat.id
    }

    if (!activeChatId.value && chats.value.length > 0) {
      activeChatId.value = chats.value[0]?.id ?? ''
    }

    const active = getActiveChat()
    chatStore.commit('setMessages', cloneMessages(active?.messages ?? []))
    chatStore.commit('setError', null)
    chatStore.commit('setStatus', 'idle')

    watch(
      () => chatStore.state.messages,
      (messages) => {
        updateActiveChatMessages(messages)
      },
      { deep: true }
    )

    initialized = true
    persist()
  }

  // ⚠️ WARNING: API KEY EXPOSED IN FRONTEND — USE ONLY FOR LOCAL TESTING
  // ⚠️ MUST include 'HTTP-Referer' and 'X-Title' headers with every OpenRouter request
  function getOpenRouterClient(): OpenRouter | null {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) {
      return null
    }
    return new OpenRouter({ apiKey })
  }

  type ChatSendParams = Parameters<OpenRouter['chat']['send']>[0]
  type MessageContent = ChatSendParams['messages'][number]['content']
  type StructuredContent = Extract<MessageContent, Array<unknown>>
  type StructuredContentItem = StructuredContent extends Array<infer Item> ? Item : never

  function normalizeOpenRouterError(error: unknown): Error {
    if (error && typeof error === 'object') {
      const status =
        typeof (error as { status?: number }).status === 'number'
          ? (error as { status?: number }).status
          : typeof (error as { response?: { status?: number } }).response?.status === 'number'
            ? (error as { response?: { status?: number } }).response?.status
            : undefined

      if (status === 429) {
        return new Error('rate limit')
      }
      if (status === 401 || status === 403) {
        return new Error('invalid key')
      }
      if (status === 503) {
        return new Error('model overloaded')
      }

      if (typeof (error as { message?: string }).message === 'string') {
        return new Error((error as { message?: string }).message)
      }
    }

    return new Error('unexpected response')
  }

  async function streamResponse(request: ChatSendParams): Promise<string> {
    const client = getOpenRouterClient()
    if (!client) {
      const lastContent = request.messages.at(-1)?.content
      const text = typeof lastContent === 'string' ? lastContent : ''
      const mock = `Mock response: configure VITE_OPENROUTER_API_KEY.\n\nYou asked: ${text}`
      chatStore.dispatch('appendAssistantChunk', mock)
      return mock
    }

    try {
      const stream = await client.chat.send(
        {
          ...request,
          stream: true,
        },
        {
          headers: {
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Banx Chat',
          },
        }
      )

      let full = ''
      let appended = false
      for await (const chunk of stream) {
        const piece = chunk.choices?.[0]?.delta?.content ?? ''
        if (piece) {
          full += piece
          chatStore.dispatch('appendAssistantChunk', piece)
          appended = true
        }
      }

      if (!full) {
        throw new Error('empty response')
      }

      if (!appended) {
        chatStore.dispatch('appendAssistantChunk', full)
      }

      return full
    } catch (error) {
      throw normalizeOpenRouterError(error)
    }
  }

  async function runTextModel(prompt: string) {
    const model = import.meta.env.VITE_OPENROUTER_MODEL ?? 'mistralai/devstral-2512:free'
    const request: ChatSendParams = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }

    return streamResponse(request)
  }

  async function runImageModel(base64: string, prompt: string) {
    const imageUrl = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
    const imageModel =
      import.meta.env.VITE_OPENROUTER_MODEL_IMAGE ?? 'nvidia/nemotron-nano-12b-v2-vl:free'
    const items: StructuredContentItem[] = []
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length > 0) {
      items.push({ type: 'text', text: trimmedPrompt } as StructuredContentItem)
    }
    items.push({ type: 'image_url', imageUrl: { url: imageUrl } } as StructuredContentItem)
    const content = items as StructuredContent

    const request: ChatSendParams = {
      model: imageModel,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      streamOptions: { includeUsage: true },
    }

    return streamResponse(request)
  }

  async function runFileModel(extractedText: string, prompt: string) {
    const combinedPrompt = [prompt.trim(), extractedText.trim()].filter(Boolean).join('\n\n---\n\n')
    const fileModel = import.meta.env.VITE_OPENROUTER_MODEL_FILE ?? 'amazon/nova-2-lite-v1:free'
    const request: ChatSendParams = {
      model: fileModel,
      messages: [
        {
          role: 'user',
          content: combinedPrompt,
        },
      ],
      streamOptions: { includeUsage: true },
    }

    return streamResponse(request)
  }

  async function sendMessage(payload: { content: string; attachment?: PreparedAttachment }) {
    const trimmed = payload.content.trim()
    const hasContent = trimmed.length > 0
    const attachment = payload.attachment

    if (!hasContent && !attachment) {
      return
    }

    chatStore.dispatch('startAssistantMessage')

    try {
      if (attachment?.type === 'image') {
        await runImageModel(attachment.dataUrl, trimmed)
      } else if (attachment?.type === 'document') {
        await runFileModel(attachment.extractedText, trimmed)
      } else {
        await runTextModel(trimmed)
      }

      chatStore.dispatch('finishAssistantMessage')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.'
      chatStore.dispatch('failAssistantMessage', message)
      throw error
    }
  }

  function syncActiveChat() {
    const active = getActiveChat()
    if (!active) {
      return
    }
    updateActiveChatMessages(chatStore.state.messages)
  }

  function startNewChat(): string {
    initialize()
    syncActiveChat()

    const current = getActiveChat()
    if (current && current.messages.length === 0) {
      chatStore.commit('setMessages', [])
      chatStore.commit('setError', null)
      chatStore.commit('setStatus', 'idle')
      touchChat(current)
      sortChats()
      persist()
      return current.id
    }

    const chat = createChat()
    activeChatId.value = chat.id
    chatStore.commit('setMessages', [])
    chatStore.commit('setError', null)
    chatStore.commit('setStatus', 'idle')

    removeEmptyTrailingChats()
    sortChats()
    persist()
    return chat.id
  }

  function selectChat(chatId: string) {
    initialize()
    if (chatId === activeChatId.value) {
      chatStore.commit('setMessages', cloneMessages(getActiveChat()?.messages ?? []))
      chatStore.commit('setError', null)
      chatStore.commit('setStatus', 'idle')
      return
    }

    syncActiveChat()

    const target = chats.value.find((chat) => chat.id === chatId)
    if (!target) {
      return
    }

    activeChatId.value = chatId
    chatStore.commit('setMessages', cloneMessages(target.messages))
    chatStore.commit('setError', null)
    chatStore.commit('setStatus', 'idle')
    touchChat(target)
    sortChats()
    persist()
  }

  function clearActiveChat() {
    initialize()
    const active = getActiveChat()
    if (!active) {
      return
    }
    active.messages = []
    active.title = DEFAULT_TITLE
    touchChat(active)
    chatStore.commit('setMessages', [])
    chatStore.commit('setError', null)
    chatStore.commit('setStatus', 'idle')
    sortChats()
    persist()
  }

  const chatsComputed = computed(() => chats.value.map((chat) => ({ ...chat })))
  const activeTitle = computed(() => getActiveChat()?.title ?? DEFAULT_TITLE)

  return {
    chats: chatsComputed,
    activeChatId,
    activeChatTitle: activeTitle,
    initialize,
    startNewChat,
    selectChat,
    clearActiveChat,
    sendMessage,
  }
}

let instance: UseChatReturn | null = null

export function useChat(): UseChatReturn {
  if (!instance) {
    instance = useChatInternal()
  }
  return instance
}
