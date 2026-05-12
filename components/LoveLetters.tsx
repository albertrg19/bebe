'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useEditMode } from '@/context/EditModeContext'
import Image from 'next/image'

interface LoveNote {
  id: string
  author: string
  content: string
  theme_color: string
  position_x: number
  position_y: number
  rotation: number
  photo_url?: string
  created_at: string
}

const COLORS = [
  { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800' },
  { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
  { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
  { name: 'green', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
  { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800' },
]

export default function LoveLetters() {
  const [notes, setNotes] = useState<LoveNote[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState({ author: '', content: '', color: 'pink' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { isEditMode } = useEditMode()
  const boardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('love_letters')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching notes:', error)
    } else {
      setNotes(data || [])
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.author || !newNote.content) return

    setUploading(true)
    let photo_url = null

    try {
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop()
        const fileName = `note-${Date.now()}.${ext}`
        const filePath = `love-notes/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(filePath, selectedFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('memories')
          .getPublicUrl(filePath)
        
        photo_url = urlData.publicUrl
      }

      const rotation = Math.random() * 10 - 5
      
      const { error } = await supabase
        .from('love_letters')
        .insert([
          {
            author: newNote.author,
            content: newNote.content,
            theme_color: newNote.color,
            rotation,
            photo_url
          },
        ])

      if (error) throw error

      setNewNote({ author: '', content: '', color: 'pink' })
      setSelectedFile(null)
      setIsAdding(false)
      fetchNotes()
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Failed to add note. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteNote = async (id: string, photoPath?: string) => {
    const { error } = await supabase.from('love_letters').delete().eq('id', id)
    if (error) {
      console.error('Error deleting note:', error)
    } else {
      // Note: We could also delete the image from storage here if we parsed the photoPath
      fetchNotes()
    }
  }

  return (
    <section id="love-letters" className="py-20 px-4 sm:px-8 lg:px-16 bg-[#fdf2f2] relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-pink-deep mb-4">
            Digital Love Notes 💌
          </h2>
          <p className="font-body text-pink-hot/70 max-w-2xl mx-auto">
            Leave a sweet message, a memory, or just a little "I love you" on our digital wall.
          </p>
        </div>

        <div 
          ref={boardRef}
          className="relative min-h-[500px] bg-[#f9ebeb] rounded-3xl p-6 sm:p-10 shadow-inner border-8 border-[#efe0e0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start"
        >
          <AnimatePresence mode="popLayout">
            {notes.map((note) => {
              const color = COLORS.find(c => c.name === note.theme_color) || COLORS[0]
              return (
                <motion.div
                  key={note.id}
                  initial={{ scale: 0, opacity: 0, rotate: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: note.rotation }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                  className={`${color.bg} ${color.border} border p-4 shadow-lg rounded-sm relative flex flex-col group transition-shadow hover:shadow-xl`}
                  style={{ transform: `rotate(${note.rotation}deg)`, minHeight: '200px' }}
                >
                  {/* Pin head decoration */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-pink-400/50 shadow-inner z-10" />
                  
                  {note.photo_url && (
                    <div className="relative w-full aspect-square mb-3 rounded-sm overflow-hidden shadow-sm">
                      <Image 
                        src={note.photo_url} 
                        alt="Memory" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className={`font-body text-sm sm:text-base ${color.text} whitespace-pre-wrap italic leading-relaxed`}>
                      "{note.content}"
                    </p>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-end">
                    <p className={`font-heading font-bold ${color.text} text-sm`}>
                      — {note.author}
                    </p>
                    
                    {isEditMode && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all shadow-sm"
                        title="Delete note"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Add Note Button/Card */}
          <motion.div
            layout
            className="border-2 border-dashed border-pink-200 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[200px] bg-white/40 hover:bg-white/60 transition-colors cursor-pointer group"
            onClick={() => setIsAdding(true)}
          >
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-body font-semibold text-pink-hot/60">Leave a note</span>
          </motion.div>
        </div>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-pink-900/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-pink-100 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-heading text-2xl font-bold text-pink-deep mb-6">Write a Note ✍️</h3>
              
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-semibold text-pink-hot/70 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={newNote.author}
                    onChange={(e) => setNewNote({ ...newNote, author: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all font-body"
                    placeholder="Who is this from?"
                  />
                </div>
                
                <div>
                  <label className="block font-body text-sm font-semibold text-pink-hot/70 mb-1">Message</label>
                  <textarea
                    required
                    rows={3}
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all font-body resize-none"
                    placeholder="What's on your mind?"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-pink-hot/70 mb-1">Add a Photo (Optional)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-pink-100 rounded-xl cursor-pointer hover:bg-pink-50 transition-all"
                  >
                    {selectedFile ? (
                      <span className="text-pink-600 font-body text-sm truncate max-w-full">
                        📄 {selectedFile.name}
                      </span>
                    ) : (
                      <span className="text-pink-300 font-body text-sm flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload an image
                      </span>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-pink-hot/70 mb-2">Sticky Note Color</label>
                  <div className="flex gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setNewNote({ ...newNote, color: color.name })}
                        className={`w-8 h-8 rounded-full ${color.bg} border-2 ${newNote.color === color.name ? 'border-pink-500 scale-110' : 'border-transparent'} transition-all`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      setIsAdding(false)
                      setSelectedFile(null)
                    }}
                    className="flex-1 px-6 py-3 rounded-xl font-body font-bold text-pink-hot/60 hover:bg-pink-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white font-body font-bold shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {uploading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Post Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
