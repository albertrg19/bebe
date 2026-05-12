'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useEditMode } from '@/context/EditModeContext'

interface BucketListItem {
  id: string
  title: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export default function BucketList() {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [newItemTitle, setNewItemTitle] = useState('')
  const { isEditMode } = useEditMode()

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('bucket_list')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching bucket list:', error)
    } else {
      setItems(data || [])
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim()) return

    const { error } = await supabase
      .from('bucket_list')
      .insert([{ title: newItemTitle.trim() }])

    if (error) {
      console.error('Error adding item:', error)
    } else {
      setNewItemTitle('')
      fetchItems()
    }
  }

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('bucket_list')
      .update({ 
        is_completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating item:', error)
    } else {
      fetchItems()
    }
  }

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('bucket_list').delete().eq('id', id)
    if (error) {
      console.error('Error deleting item:', error)
    } else {
      fetchItems()
    }
  }

  return (
    <section id="bucket-list" className="py-20 px-4 sm:px-8 lg:px-16 bg-white relative">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-pink-deep mb-4">
            Our Bucket List ✈️
          </h2>
          <p className="font-body text-pink-hot/70">
            Dreams, goals, and adventures we want to experience together.
          </p>
        </div>

        <div className="bg-pink-50/50 rounded-3xl p-6 sm:p-10 border border-pink-100 shadow-sm">
          {/* Add Item Form */}
          <form onSubmit={handleAddItem} className="flex gap-2 mb-10">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Add a new dream..."
              className="flex-1 px-5 py-3 rounded-2xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all font-body bg-white shadow-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-pink-500 text-white rounded-2xl font-body font-bold hover:bg-pink-600 transition-all shadow-md shadow-pink-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add</span>
            </button>
          </form>

          {/* List */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    item.is_completed 
                      ? 'bg-white/40 border-transparent' 
                      : 'bg-white border-pink-50 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => toggleComplete(item.id, item.is_completed)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-pink-200 hover:border-pink-400'
                    }`}
                  >
                    {item.is_completed && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <span className={`flex-1 font-body text-base sm:text-lg transition-all ${
                    item.is_completed 
                      ? 'text-pink-300 line-through' 
                      : 'text-pink-800'
                  }`}>
                    {item.title}
                  </span>

                  {isEditMode && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-pink-300 hover:text-red-400 transition-colors"
                      title="Delete item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length === 0 && (
              <div className="text-center py-10">
                <p className="font-body text-pink-300 italic">No dreams added yet. Let's plan something!</p>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          {items.length > 0 && (
            <div className="mt-10">
              <div className="flex justify-between items-end mb-2">
                <span className="font-body text-sm font-bold text-pink-800">Adventure Progress</span>
                <span className="font-body text-sm text-pink-500">
                  {Math.round((items.filter(i => i.is_completed).length / items.length) * 100)}%
                </span>
              </div>
              <div className="h-3 w-full bg-pink-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(items.filter(i => i.is_completed).length / items.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-pink-400 to-green-400 rounded-full shadow-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
