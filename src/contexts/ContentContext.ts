import { createContext } from 'react'
import { StudyContent } from '../types/content'

interface ContentContextType {
  contents: StudyContent[]
  currentContent: StudyContent | null
  addContent: (content: Omit<StudyContent, 'id' | 'createdAt'>) => void
  setCurrentContent: (content: StudyContent | null) => void
  updateContent: (id: string, updates: Partial<StudyContent>) => void
  deleteContent: (id: string) => void
}

export const ContentContext = createContext<ContentContextType | undefined>(undefined)