import { createContext } from 'react'

interface OllamaModel {
  name: string
  size: string
  modified_at: string
}

interface OllamaContextType {
  models: OllamaModel[]
  selectedModel: string
  isConnected: boolean
  isLoading: boolean
  ollamaUrl: string
  setSelectedModel: (model: string) => void
  setOllamaUrl: (url: string) => void
  checkConnection: () => Promise<boolean>
  loadModels: () => Promise<void>
  generateText: (prompt: string, context?: string) => Promise<string>
}

export const OllamaContext = createContext<OllamaContextType | undefined>(undefined)