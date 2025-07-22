import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useContent } from '../hooks/useContent'
import { useOllama } from '../hooks/useOllama'
import { 
  Brain, 
  FileText, 
  Youtube, 
  Type, 
  MessageSquare, 
  HelpCircle, 
  Zap,
  ArrowLeft,
  Sparkles,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

const StudyDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { contents, currentContent, setCurrentContent, updateContent } = useContent()
  const { generateText, isConnected } = useOllama()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  
  // Detect if we're running in a deployed environment
  const isDeployed = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')

  useEffect(() => {
    if (contents.length === 0) {
      navigate('/')
    }
  }, [contents, navigate])

  const generateSummary = async () => {
    if (!currentContent) {
      toast.error('No content selected')
      return
    }

    // Allow demo mode to work even without connection
    if (!isConnected && !isDeployed) {
      toast.error('Ollama is not connected. Please ensure Ollama is running locally.')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(20)

    try {
      const prompt = `Please provide a concise summary of the following content. Focus on the key points and main ideas:\n\n${currentContent.content}`
      
      setGenerationProgress(50)
      
      // Use demo response if deployed, otherwise use real AI
      const summary = isDeployed 
        ? `Demo Summary (Ollama not connected): This is a sample AI-generated summary of your content. In the local version with Ollama running, this would contain an actual AI-powered summary of your uploaded content with key insights and main points extracted automatically.`
        : await generateText(prompt)
        
      setGenerationProgress(80)

      // Update content with summary
      updateContent(currentContent.id, { summary })
      
      setGenerationProgress(100)
      toast.success('Summary generated successfully!')

    } catch (error) {
      console.error('Failed to generate summary:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const generateFlashcards = async () => {
    if (!currentContent) {
      toast.error('No content selected')
      return
    }

    // Allow demo mode to work even without connection
    if (!isConnected && !isDeployed) {
      toast.error('Ollama is not connected. Please ensure Ollama is running locally.')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(20)

    try {
      const prompt = `Create 10 flashcards from the following content. Format each flashcard as "Q: [question] | A: [answer]" on separate lines:\n\n${currentContent.content}`
      
      setGenerationProgress(50)
      
      // Use demo response if deployed, otherwise use real AI
      const flashcardsText = isDeployed 
        ? `Q: What is this demo showing? | A: This is a sample flashcard generated in demo mode
Q: How do I get real AI flashcards? | A: Run this app locally with Ollama installed
Q: What would real flashcards contain? | A: AI-generated questions and answers based on your actual content
Q: Is this functionality working? | A: Yes, but with demo data instead of real AI generation`
        : await generateText(prompt)
        
      setGenerationProgress(80)

      // Parse flashcards
      const flashcards = flashcardsText
        .split('\n')
        .filter(line => line.includes('Q:') && line.includes('A:'))
        .map((line, index) => {
          const [front, back] = line.split(' | A: ')
          return {
            id: `${currentContent.id}-flashcard-${index}`,
            front: front.replace('Q: ', '').trim(),
            back: back?.trim() || '',
            difficulty: 'medium' as const
          }
        })
        .filter(card => card.front && card.back)

      // Update content with flashcards
      updateContent(currentContent.id, { flashcards })
      
      setGenerationProgress(100)
      toast.success(`Generated ${flashcards.length} flashcards!`)

    } catch (error) {
      console.error('Failed to generate flashcards:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const generateQuiz = async () => {
    if (!currentContent) {
      toast.error('No content selected')
      return
    }

    // Allow demo mode to work even without connection
    if (!isConnected && !isDeployed) {
      toast.error('Ollama is not connected. Please ensure Ollama is running locally.')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(20)

    try {
      const prompt = `Create 5 multiple choice questions from the following content. Format each question as:
Q: [question]
A) [option 1]
B) [option 2]
C) [option 3]
D) [option 4]
Correct: [A/B/C/D]
Explanation: [brief explanation]

Content: ${currentContent.content}`
      
      setGenerationProgress(50)
      
      // Use demo response if deployed, otherwise use real AI
      const quizText = isDeployed 
        ? `Q: What type of app is this?
A) A real AI-powered learning platform
B) A demo version of YouLearn.ai
C) A simple text editor
D) A file storage system
Correct: B
Explanation: This is a demo version that shows the interface and functionality, but uses sample responses instead of real AI generation.

Q: How can you get real AI features?
A) Pay for a premium subscription
B) Wait for the next update
C) Run the app locally with Ollama installed
D) Contact customer support
Correct: C
Explanation: The real AI features work when you run this app locally with Ollama installed and running.`
        : await generateText(prompt)
        
      setGenerationProgress(80)

      // Parse quiz questions (simplified parsing)
      const questions = []
      const questionBlocks = quizText.split('Q:').filter(block => block.trim())
      
      for (let i = 0; i < questionBlocks.length && i < 5; i++) {
        const block = questionBlocks[i]
        const lines = block.split('\n').filter(line => line.trim())
        
        if (lines.length >= 6) {
          const question = lines[0].trim()
          const options = lines.slice(1, 5).map(line => line.replace(/^[A-D]\)\s*/, '').trim())
          const correctLine = lines.find(line => line.toLowerCase().includes('correct:'))
          const correctLetter = correctLine?.match(/[A-D]/)?.[0]
          const correctAnswer = correctLetter ? ['A', 'B', 'C', 'D'].indexOf(correctLetter) : 0
          
          questions.push({
            id: `${currentContent.id}-quiz-${i}`,
            question,
            options,
            correctAnswer,
            explanation: lines.find(line => line.toLowerCase().includes('explanation:'))?.replace(/explanation:\s*/i, '') || ''
          })
        }
      }

      // Update content with quiz
      updateContent(currentContent.id, { quiz: questions })
      
      setGenerationProgress(100)
      toast.success(`Generated ${questions.length} quiz questions!`)

    } catch (error) {
      console.error('Failed to generate quiz:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-5 w-5" />
      case 'youtube': return <Youtube className="h-5 w-5" />
      case 'text': return <Type className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  if (!currentContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Content Selected</h2>
            <p className="text-gray-600 mb-6">Please upload some content first to start learning.</p>
            <Button onClick={() => navigate('/')}>
              Upload Content
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              onClick={() => navigate('/')} 
              variant="ghost" 
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Dashboard</h1>
              <p className="text-gray-600">AI-powered learning tools for your content</p>
            </div>
          </div>
          
          {isDeployed ? (
            <Badge variant="secondary">
              Demo Mode
            </Badge>
          ) : !isConnected && (
            <Badge variant="destructive">
              Ollama Disconnected
            </Badge>
          )}
        </div>

        {/* Current Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              {getContentIcon(currentContent.type)}
              <span className="ml-2">{currentContent.title}</span>
              <Badge variant="secondary" className="ml-2">
                {currentContent.type.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4 mr-1" />
              Added {currentContent.createdAt.toLocaleDateString()}
            </div>
            
            {currentContent.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">AI Summary</h4>
                <p className="text-blue-800 text-sm">{currentContent.summary}</p>
              </div>
            )}
            
            <div className="text-sm text-gray-600 line-clamp-3">
              {currentContent.content.substring(0, 300)}...
            </div>
          </CardContent>
        </Card>

        {/* Generation Progress */}
        {isGenerating && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                <p className="font-medium">Generating AI content...</p>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </CardContent>
          </Card>
        )}

        {/* AI Tools */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Generate Summary</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a concise summary of your content
                </p>
                <Button 
                  onClick={generateSummary}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {currentContent.summary ? 'Regenerate' : 'Generate'} Summary
                  {isDeployed && <span className="ml-1 text-xs">(Demo)</span>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Create Flashcards</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Auto-generate flashcards for studying
                </p>
                <Button 
                  onClick={generateFlashcards}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {currentContent.flashcards?.length ? 'Regenerate' : 'Generate'} Flashcards
                  {isDeployed && <span className="ml-1 text-xs">(Demo)</span>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Generate Quiz</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test your knowledge with AI questions
                </p>
                <Button 
                  onClick={generateQuiz}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {currentContent.quiz?.length ? 'Regenerate' : 'Generate'} Quiz
                  {isDeployed && <span className="ml-1 text-xs">(Demo)</span>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Study Tools */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">AI Tutor Chat</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ask questions about your content
                </p>
                <Button 
                  onClick={() => navigate('/chat')}
                  className="w-full"
                >
                  Start Chat
                  {isDeployed && <span className="ml-1 text-xs">(Demo)</span>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Study Flashcards</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review with spaced repetition
                </p>
                <Button 
                  onClick={() => navigate('/flashcards')}
                  disabled={!currentContent.flashcards?.length}
                  className="w-full"
                >
                  {currentContent.flashcards?.length ? `Study ${currentContent.flashcards.length} Cards` : 'Generate First'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Take Quiz</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test your understanding
                </p>
                <Button 
                  onClick={() => navigate('/quiz')}
                  disabled={!currentContent.quiz?.length}
                  className="w-full"
                >
                  {currentContent.quiz?.length ? `Take ${currentContent.quiz.length} Questions` : 'Generate First'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StudyDashboard