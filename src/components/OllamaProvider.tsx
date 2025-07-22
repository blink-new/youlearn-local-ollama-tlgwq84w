import React, { useState, ReactNode } from 'react'
import { OllamaContext } from '../contexts/OllamaContext'

interface OllamaModel {
  name: string
  size: string
  modified_at: string
}

export const OllamaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('llama2')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  
  // Detect if we're running in a deployed environment
  const isDeployed = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')

  const checkConnection = async (): Promise<boolean> => {
    // Skip connection check if deployed - we know it won't work
    if (isDeployed) {
      setIsConnected(false)
      return false
    }
    
    try {
      // Add timeout and proper error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        signal: controller.signal,
        mode: 'cors'
      })
      
      clearTimeout(timeoutId)
      const connected = response.ok
      setIsConnected(connected)
      return connected
    } catch (error) {
      // Silently handle expected CORS/network errors when deployed
      setIsConnected(false)
      return false
    }
  }

  const loadModels = async () => {
    // Skip model loading if deployed - we know it won't work
    if (isDeployed) {
      setIsLoading(false)
      setIsConnected(false)
      setModels([])
      return
    }
    
    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        signal: controller.signal,
        mode: 'cors'
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
        setIsConnected(true)
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].name)
        }
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      // Silently handle expected CORS/network errors
      setIsConnected(false)
      setModels([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateText = async (prompt: string, context?: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Ollama is not connected. Please ensure Ollama is running locally.')
    }

    const fullPrompt = context ? `Context: ${context}\n\nQuestion: ${prompt}` : prompt

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for generation
      
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: fullPrompt,
          stream: false
        }),
        signal: controller.signal,
        mode: 'cors'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to generate text: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.response || ''
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Text generation timed out. Please try again.')
        }
        console.error('Text generation failed:', error.message)
        throw new Error(`Text generation failed: ${error.message}`)
      }
      throw error
    }
  }

  return (
    <OllamaContext.Provider value={{
      models,
      selectedModel,
      isConnected,
      isLoading,
      ollamaUrl,
      setSelectedModel,
      setOllamaUrl,
      checkConnection,
      loadModels,
      generateText
    }}>
      {children}
    </OllamaContext.Provider>
  )
}