export interface StudyContent {
  id: string
  title: string
  type: 'pdf' | 'youtube' | 'text'
  content: string
  summary?: string
  flashcards?: Flashcard[]
  quiz?: QuizQuestion[]
  createdAt: Date
}

export interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  lastReviewed?: Date
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}