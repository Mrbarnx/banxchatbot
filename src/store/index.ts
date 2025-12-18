import { createStore, useStore as baseUseStore } from 'vuex'
import type {
  Store,
  GetterTree,
  MutationTree,
  ActionTree,
  MutationPayload,
} from 'vuex'
import type { PreparedAttachment } from '@/types/chat'

export type ChatStatus = 'idle' | 'loading' | 'error'

export interface ChatMode {
  id: string
  label: string
  description: string
  systemPrompt: string
}

export type ChatAttachment = PreparedAttachment

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  attachment?: ChatAttachment
}

export interface ChatState {
  messages: ChatMessage[]
  selectedModeId: string
  status: ChatStatus
  errorMessage: string | null
}

const STORAGE_KEY = 'banxchatbot:chat-state'

export const chatModes: ChatMode[] = [
  {
    id: 'web-dev',
    label: 'Web Development',
    description: 'Front-end and full-stack implementation guidance.',
    systemPrompt:
      'You are a senior web developer specializing in modern JavaScript frameworks. Provide concise, production-ready advice.',
  },
  {
    id: 'code-gen',
    label: 'Code Generation',
    description: 'Generate code snippets and explain design choices.',
    systemPrompt:
      'You are an expert software engineer crafting high-quality code with clear explanations and edge-case awareness.',
  },
  {
    id: 'video-script',
    label: 'Video Script Writing',
    description: 'Structure scripts for engaging video content.',
    systemPrompt:
      'You are a seasoned video script writer creating compelling narratives with clear call-to-actions.',
  },
]

const fallbackMode: ChatMode =
  chatModes[0] ?? {
    id: 'general',
    label: 'General Purpose',
    description: 'Default assistant mode for versatile help.',
    systemPrompt:
      'You are a helpful AI assistant offering clear, well-structured answers with necessary caveats.',
  }

const defaultState = (): ChatState => ({
  messages: [],
  selectedModeId: chatModes[0]?.id ?? 'web-dev',
  status: 'idle',
  errorMessage: null,
})

const loadPersistedState = (): ChatState | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<ChatState>
    return {
      ...defaultState(),
      ...parsed,
      messages: parsed.messages ?? [],
      selectedModeId: parsed.selectedModeId ?? defaultState().selectedModeId,
    }
  } catch (error) {
    console.warn('Failed to restore chat state from storage', error)
    return undefined
  }
}

const persistState = (state: ChatState) => {
  if (typeof window === 'undefined') {
    return
  }
  const snapshot: Pick<ChatState, 'messages' | 'selectedModeId'> = {
    messages: state.messages,
    selectedModeId: state.selectedModeId,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

const buildMessageId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const getters: GetterTree<ChatState, ChatState> = {
  selectedMode(state): ChatMode {
    return chatModes.find((mode) => mode.id === state.selectedModeId) ?? fallbackMode
  },
  hasMessages(state): boolean {
    return state.messages.length > 0
  },
}

const mutations: MutationTree<ChatState> = {
  addMessage(state, message: ChatMessage) {
    state.messages.push(message)
  },
  updateLastMessageContent(state, content: string) {
    const lastMessage = state.messages.at(-1)
    if (lastMessage && lastMessage.role === 'assistant') {
      lastMessage.content = content
    }
  },
  setMessages(state, messages: ChatMessage[]) {
    state.messages = messages.map((message) => ({
      ...message,
      attachment: message.attachment ? { ...message.attachment } : undefined,
    }))
  },
  setStatus(state, status: ChatStatus) {
    state.status = status
  },
  setError(state, message: string | null) {
    state.errorMessage = message
    state.status = message ? 'error' : state.status
  },
  setSelectedMode(state, modeId: string) {
    state.selectedModeId = modeId
  },
  resetState(state) {
    Object.assign(state, defaultState())
  },
}

const actions: ActionTree<ChatState, ChatState> = {
  changeMode({ commit }, modeId: string) {
    commit('setSelectedMode', modeId)
    commit('setError', null)
  },
  sendUserMessage({ commit }, payload: string | { content: string; attachment?: ChatAttachment }) {
    commit('setError', null)
    const base = typeof payload === 'string' ? { content: payload } : payload
    const trimmedContent = base.content.trim()
    commit('addMessage', {
      id: buildMessageId(),
      role: 'user',
      content: trimmedContent,
      createdAt: Date.now(),
      ...(base.attachment ? { attachment: base.attachment } : {}),
    })
  },
  pushAssistantMessage(
    { commit },
    payload: string | { content: string; attachment?: ChatAttachment }
  ) {
    const base = typeof payload === 'string' ? { content: payload } : payload
    commit('addMessage', {
      id: buildMessageId(),
      role: 'assistant',
      content: base.content,
      createdAt: Date.now(),
      ...(base.attachment ? { attachment: base.attachment } : {}),
    })
  },
  startAssistantMessage({ commit }) {
    commit('setStatus', 'loading')
    commit('addMessage', {
      id: buildMessageId(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    })
  },
  appendAssistantChunk({ state, commit }, chunk: string) {
    const lastMessage = state.messages.at(-1)
    if (!lastMessage || lastMessage.role !== 'assistant') {
      return
    }
    commit('updateLastMessageContent', `${lastMessage.content}${chunk}`)
  },
  finishAssistantMessage({ commit }) {
    commit('setStatus', 'idle')
  },
  failAssistantMessage({ commit }, error: string) {
    commit('setStatus', 'error')
    commit('setError', error)
  },
  clearError({ commit }) {
    commit('setError', null)
    commit('setStatus', 'idle')
  },
  resetConversation({ commit }) {
    commit('resetState')
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  },
}

export const store = createStore<ChatState>({
  state: () => loadPersistedState() ?? defaultState(),
  getters,
  mutations,
  actions,
})

store.subscribe((_mutation: MutationPayload, state: ChatState) => {
  persistState(state)
})

export function useChatStore(): Store<ChatState> {
  return baseUseStore<ChatState>()
}
