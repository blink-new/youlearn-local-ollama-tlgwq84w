import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft, HelpCircle } from 'lucide-react'

const QuizMode: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={() => navigate('/dashboard')} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="text-center">
          <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Mode</h2>
          <p className="text-gray-600 mb-6">Coming soon! Take AI-generated quizzes.</p>
        </div>
      </div>
    </div>
  )
}

export default QuizMode