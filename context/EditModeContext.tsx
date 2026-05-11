'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface EditModeContextType {
  isEditMode: boolean
  toggleEditMode: () => void
  saveAll: () => Promise<void>
  isSaving: boolean
  saveSuccess: boolean
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
  saveAll: async () => {},
  isSaving: false,
  saveSuccess: false,
})

export function useEditMode(): EditModeContextType {
  const context = useContext(EditModeContext)
  return context
}

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev)
    setSaveSuccess(false)
  }, [])

  const saveAll = useCallback(async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const editableElements = document.querySelectorAll('[data-edit-key]')
      const updates: { key: string; value: string }[] = []

      editableElements.forEach((el) => {
        const key = el.getAttribute('data-edit-key')
        const value = (el as HTMLElement).innerText.trim()
        if (key) {
          updates.push({ key, value })
        }
      })

      const gamesElements = document.querySelectorAll('[data-game-item]')
      const games: string[] = []
      gamesElements.forEach((el) => {
        const text = (el as HTMLElement).innerText.trim()
        if (text) {
          games.push(text)
        }
      })

      if (games.length > 0) {
        updates.push({ key: 'games', value: JSON.stringify(games) })
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('site_content')
          .upsert({ key: update.key, value: update.value }, { onConflict: 'key' })

        if (error) {
          console.error('Error saving:', update.key, error)
        }
      }

      setSaveSuccess(true)
      setIsEditMode(false)

      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [])

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        toggleEditMode,
        saveAll,
        isSaving,
        saveSuccess,
      }}
    >
      {children}
    </EditModeContext.Provider>
  )
}
