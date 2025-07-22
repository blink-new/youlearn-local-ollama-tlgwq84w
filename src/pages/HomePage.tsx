import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useContent } from '../hooks/useContent'
import { useOllama } from '../hooks/useOllama'
import { OllamaConfigModal } from '../components/OllamaConfigModal'
import { Upload, FileText, Youtube, Type, Brain, Zap, AlertCircle, RefreshCw, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { 
  processPDFFile, 
  isPDFProcessingAvailable, 
  validatePDFFile, 
  getErrorMessage, 
  PDFProcessingError 
} from '../utils/pdfProcessor'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { addContent } = useContent()
  const { isConnected, isLoading, checkConnection, loadModels } = useOllama()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [pdfAvailable, setPdfAvailable] = useState(false)
  
  // Detect if we're running in a deployed environment
  const isDeployed = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')

  useEffect(() => {
    // Only check connection on mount, don't automatically load models
    checkConnection()
    // Check PDF processing availability
    setPdfAvailable(isPDFProcessingAvailable())
  }, [checkConnection])

  // Load models only when connection is established
  useEffect(() => {
    if (isConnected) {
      loadModels()
    }
  }, [isConnected, loadModels])

  const handleRetryConnection = async () => {
    const connected = await checkConnection()
    if (connected) {
      toast.success('Connected to Ollama!')
      loadModels()
    } else {
      toast.error('Failed to connect to Ollama. Make sure it\'s running on localhost:11434')
    }
  }

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const processFile = useCallback(async (file: File) => {
    // Validate file first
    const validation = validatePDFFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid PDF file')
      return
    }

    if (!pdfAvailable) {
      toast.error('PDF processing is currently unavailable')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await processPDFFile(file, {
        onProgress: setProgress,
        maxPages: 100,
        timeout: 60000
      })

      addContent({
        title: result.title || file.name.replace('.pdf', ''),
        type: 'pdf',
        content: result.text
      })

      toast.success(`PDF processed successfully! (${result.pageCount} pages)`)
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (error) {
      console.error('Error processing PDF:', error)
      
      if (error instanceof PDFProcessingError) {
        toast.error(getErrorMessage(error))
      } else {
        toast.error('Failed to process PDF')
      }
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [addContent, navigate, pdfAvailable])

  const processYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    setIsProcessing(true)
    setProgress(20)

    try {
      // Extract video ID from URL
      const videoId = extractVideoId(youtubeUrl)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      setProgress(50)

      // For demo purposes, we'll create placeholder content
      // In a real implementation, you'd use YouTube API or transcript services
      const mockTranscript = `This is a placeholder transcript for YouTube video: ${videoId}. 
      In a real implementation, this would contain the actual video transcript 
      extracted using YouTube's API or third-party transcript services.`

      addContent({
        title: `YouTube Video: ${videoId}`,
        type: 'youtube',
        content: mockTranscript
      })

      setProgress(100)
      toast.success('YouTube video processed!')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (error) {
      console.error('Error processing YouTube:', error)
      toast.error('Failed to process YouTube video')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setYoutubeUrl('')
    }
  }

  const processText = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some text content')
      return
    }

    setIsProcessing(true)
    setProgress(50)

    try {
      addContent({
        title: `Text Content - ${new Date().toLocaleDateString()}`,
        type: 'text',
        content: textContent
      })

      setProgress(100)
      toast.success('Text content added!')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)

    } catch (error) {
      console.error('Error processing text:', error)
      toast.error('Failed to process text')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setTextContent('')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    await processFile(file)
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">YouLearn.ai</h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            AI-Powered Learning with Local Ollama Integration
          </p>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center px-4 py-2 rounded-full ${
              isDeployed
                ? 'bg-blue-100 text-blue-800'
                : isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isDeployed 
                  ? 'bg-blue-500'
                  : isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isDeployed 
                ? 'Demo Mode (Deployed)'
                : isLoading 
                  ? 'Checking...' 
                  : isConnected 
                    ? 'Ollama Connected' 
                    : 'Ollama Disconnected'
              }
            </div>
            
            {/* PDF Status Badge */}
            <Badge variant={pdfAvailable ? 'default' : 'secondary'}>
              PDF: {pdfAvailable ? 'Available' : 'Unavailable'}
            </Badge>
            
            {!isConnected && !isDeployed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryConnection}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
            )}
            
            {!isDeployed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigModal(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            )}
          </div>

          {isDeployed ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-medium text-blue-800 mb-1">Demo Mode Active</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    You're viewing the deployed demo. AI features will show sample responses.
                  </p>
                  <p className="text-sm text-blue-700">
                    For full functionality with real AI generation, run this app locally with Ollama installed.
                  </p>
                </div>
              </div>
            </div>
          ) : !isConnected && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-medium text-amber-800 mb-1">Ollama Not Connected</h3>
                  <p className="text-sm text-amber-700 mb-2">
                    To use AI features, please ensure Ollama is running locally:
                  </p>
                  <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                    <li>Install Ollama from <a href="https://ollama.ai" className="underline" target="_blank" rel="noopener noreferrer">ollama.ai</a></li>
                    <li>Run: <code className="bg-amber-100 px-1 rounded">ollama serve</code></li>
                    <li>Pull a model: <code className="bg-amber-100 px-1 rounded">ollama pull llama2</code></li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <Card className="mb-8 max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <Zap className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                <p className="font-medium">Processing content...</p>
              </div>
              <Progress value={progress} className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* Content Upload Tabs */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="pdf" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                PDF Upload
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center">
                <Youtube className="h-4 w-4 mr-2" />
                YouTube
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center">
                <Type className="h-4 w-4 mr-2" />
                Text Input
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Upload PDF Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      !pdfAvailable
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : isDragActive
                          ? 'border-primary bg-primary/5 cursor-pointer'
                          : 'border-gray-300 hover:border-primary hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <input {...getInputProps()} disabled={!pdfAvailable} />
                    <Upload className={`h-12 w-12 mx-auto mb-4 ${
                      pdfAvailable ? 'text-gray-400' : 'text-gray-300'
                    }`} />
                    {!pdfAvailable ? (
                      <div>
                        <p className="text-lg text-gray-500 mb-2">
                          PDF Processing Unavailable
                        </p>
                        <p className="text-sm text-gray-400">
                          PDF.js worker could not be loaded. Please refresh the page or try again later.
                        </p>
                      </div>
                    ) : isDragActive ? (
                      <p className="text-lg text-primary">Drop the PDF here...</p>
                    ) : (
                      <div>
                        <p className="text-lg text-gray-600 mb-2">
                          Drag & drop a PDF file here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports PDF files up to 50MB
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="youtube">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Youtube className="h-5 w-5 mr-2" />
                    YouTube Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    onClick={processYouTube}
                    disabled={isProcessing || !youtubeUrl.trim()}
                    className="w-full"
                  >
                    Process YouTube Video
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    Note: This is a demo implementation. Real transcript extraction would require YouTube API integration.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Type className="h-5 w-5 mr-2" />
                    Text Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="Paste your text content here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-[200px] w-full"
                    />
                  </div>
                  <Button 
                    onClick={processText}
                    disabled={isProcessing || !textContent.trim()}
                    className="w-full"
                  >
                    Process Text Content
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">AI Summaries</h3>
              <p className="text-sm text-gray-600">
                Generate concise summaries using local Ollama models
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Smart Flashcards</h3>
              <p className="text-sm text-gray-600">
                Auto-generate flashcards from your content
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Interactive Quizzes</h3>
              <p className="text-sm text-gray-600">
                Test your knowledge with AI-generated questions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Ollama Configuration Modal */}
      <OllamaConfigModal 
        open={showConfigModal} 
        onOpenChange={setShowConfigModal} 
      />
    </div>
  )
}

export default HomePage