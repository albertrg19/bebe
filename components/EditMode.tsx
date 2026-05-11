'use client'

import React, { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useEditMode } from '@/context/EditModeContext'

gsap.registerPlugin(useGSAP)

export default function EditMode() {
  const btnRef = useRef<HTMLButtonElement>(null)
  const { isEditMode, toggleEditMode, saveAll, isSaving, saveSuccess } = useEditMode()

  useGSAP(() => {
    if (btnRef.current) {
      gsap.from(btnRef.current, {
        scale: 0,
        rotation: 180,
        duration: 0.6,
        ease: 'back.out(1.7)',
        delay: 1,
      })
    }
  }, { scope: btnRef })

  const handleClick = async () => {
    if (isEditMode) {
      await saveAll()
    } else {
      toggleEditMode()
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={isSaving}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-0 sm:gap-2 w-12 h-12 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full font-body font-semibold text-white shadow-xl transition-all duration-200 justify-center touch-active"
        style={{
          background: isEditMode
            ? 'linear-gradient(135deg, #4caf50, #2e7d32)'
            : 'linear-gradient(135deg, #f06292, #e91e8c)',
          boxShadow: isEditMode
            ? '0 8px 32px rgba(76, 175, 80, 0.4)'
            : '0 8px 32px rgba(233, 30, 140, 0.4)',
        }}
      >
        {isSaving ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span className="hidden sm:inline">Saving...</span>
          </>
        ) : isEditMode ? (
          <>
            <span>✅</span>
            <span className="hidden sm:inline">Save</span>
          </>
        ) : (
          <>
            <span>✏️</span>
            <span className="hidden sm:inline">Edit</span>
          </>
        )}
      </button>

      {saveSuccess && (
        <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-green-500 text-white font-body font-medium text-xs sm:text-base shadow-lg animate-bounce">
          ✅ Saved!
        </div>
      )}
    </>
  )
}
