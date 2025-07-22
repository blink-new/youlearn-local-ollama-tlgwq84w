import { useContext } from 'react'
import { OllamaContext } from '../contexts/OllamaContext'

export const useOllama = () => {
  const context = useContext(OllamaContext)
  if (!context) {
    throw new Error('useOllama must be used within an OllamaProvider')
  }
  return context
}