import React, { useState, ReactNode } from 'react'
import { ContentContext } from '../contexts/ContentContext'
import { StudyContent } from '../types/content'

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contents, setContents] = useState<StudyContent[]>([])
  const [currentContent, setCurrentContent] = useState<StudyContent | null>(null)

  const addContent = (content: Omit<StudyContent, 'id' | 'createdAt'>) => {
    const newContent: StudyContent = {
      ...content,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    setContents(prev => [...prev, newContent])
    setCurrentContent(newContent)
  }

  const updateContent = (id: string, updates: Partial<StudyContent>) => {
    setContents(prev => prev.map(content => 
      content.id === id ? { ...content, ...updates } : content
    ))
    if (currentContent?.id === id) {
      setCurrentContent(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteContent = (id: string) => {
    setContents(prev => prev.filter(content => content.id !== id))
    if (currentContent?.id === id) {
      setCurrentContent(null)
    }
  }

  return (
    <ContentContext.Provider value={{
      contents,
      currentContent,
      addContent,
      setCurrentContent,
      updateContent,
      deleteContent
    }}>
      {children}
    </ContentContext.Provider>
  )
}