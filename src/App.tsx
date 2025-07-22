import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import HomePage from './pages/HomePage'
import StudyDashboard from './pages/StudyDashboard'
import ChatTutor from './pages/ChatTutor'
import QuizMode from './pages/QuizMode'
import Flashcards from './pages/Flashcards'
import Settings from './pages/Settings'
import { ContentProvider } from './components/ContentProvider'
import { OllamaProvider } from './components/OllamaProvider'

function App() {
  return (
    <OllamaProvider>
      <ContentProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<StudyDashboard />} />
              <Route path="/chat" element={<ChatTutor />} />
              <Route path="/quiz" element={<QuizMode />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </ContentProvider>
    </OllamaProvider>
  )
}

export default App