import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { useOllama } from '../hooks/useOllama'
import { Settings, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface OllamaConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const OllamaConfigModal: React.FC<OllamaConfigModalProps> = ({ open, onOpenChange }) => {
  const { 
    models, 
    selectedModel, 
    isConnected, 
    isLoading, 
    setSelectedModel, 
    checkConnection, 
    loadModels,
    ollamaUrl,
    setOllamaUrl
  } = useOllama()
  
  const [tempUrl, setTempUrl] = useState(ollamaUrl || 'http://localhost:11434')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (open) {
      setTempUrl(ollamaUrl || 'http://localhost:11434')
      setConnectionStatus('idle')
    }
  }, [open, ollamaUrl])

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('testing')
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${tempUrl}/api/tags`, {
        signal: controller.signal,
        mode: 'cors'
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        setConnectionStatus('success')
        toast.success('Connection successful!')
      } else {
        setConnectionStatus('error')
        toast.error('Connection failed - server responded with error')
      }
    } catch (error) {
      setConnectionStatus('error')
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Connection timeout - make sure Ollama is running')
      } else {
        toast.error('Connection failed - check URL and CORS settings')
      }
    } finally {
      setIsTestingConnection(false)
    }
  }

  const saveConfiguration = async () => {
    if (connectionStatus !== 'success') {
      toast.error('Please test the connection first')
      return
    }

    try {
      // Update the URL in the context
      setOllamaUrl(tempUrl)
      
      // Check connection with new URL and load models
      const connected = await checkConnection()
      if (connected) {
        await loadModels()
        toast.success('Configuration saved successfully!')
        onOpenChange(false)
      } else {
        toast.error('Failed to connect with the new configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    }
  }

  const resetToDefaults = () => {
    setTempUrl('http://localhost:11434')
    setConnectionStatus('idle')
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'Testing connection...'
      case 'success':
        return 'Connection successful'
      case 'error':
        return 'Connection failed'
      default:
        return 'Not tested'
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Ollama Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your Ollama connection settings and manage AI models.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ollama-url">Ollama Server URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="ollama-url"
                    value={tempUrl}
                    onChange={(e) => {
                      setTempUrl(e.target.value)
                      setConnectionStatus('idle')
                    }}
                    placeholder="http://localhost:11434"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={testConnection}
                    disabled={isTestingConnection || !tempUrl.trim()}
                  >
                    {isTestingConnection ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                <div className={`flex items-center text-sm ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="ml-2">{getStatusText()}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Install Ollama from <a href="https://ollama.ai" className="underline" target="_blank" rel="noopener noreferrer">ollama.ai</a></li>
                      <li>Run: <code className="bg-blue-100 px-1 rounded">ollama serve</code></li>
                      <li>Pull a model: <code className="bg-blue-100 px-1 rounded">ollama pull llama2</code></li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              {isConnected && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>Server: {ollamaUrl}</p>
                  <p>Available models: {models.length}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Selection */}
          {isConnected && models.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Available Models
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadModels}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Selected Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{model.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{model.size}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model Details</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {models.map((model) => (
                      <div
                        key={model.name}
                        className={`p-3 rounded-lg border ${
                          model.name === selectedModel
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{model.name}</p>
                            <p className="text-sm text-gray-500">
                              Size: {model.size} • Modified: {new Date(model.modified_at).toLocaleDateString()}
                            </p>
                          </div>
                          {model.name === selectedModel && (
                            <Badge>Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help & Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Help & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Ollama Documentation</span>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://ollama.ai/docs" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Model Library</span>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://ollama.ai/library" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Browse
                  </a>
                </Button>
              </div>
              <Separator />
              <div className="text-sm text-gray-600">
                <p>Common models to try:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><code>llama2</code> - General purpose (3.8GB)</li>
                  <li><code>mistral</code> - Fast and efficient (4.1GB)</li>
                  <li><code>codellama</code> - Code generation (3.8GB)</li>
                  <li><code>phi</code> - Lightweight (1.6GB)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveConfiguration}
              disabled={connectionStatus !== 'success'}
            >
              Save Configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}