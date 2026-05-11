'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useEditMode } from '@/context/EditModeContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import type { GameItem } from '@/lib/types'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function GamesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const imageInputsRef = useRef<(HTMLInputElement | null)[]>([])

  const [games, setGames] = useState<GameItem[]>([])
  const { isEditMode } = useEditMode()

  const loadContent = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('key', 'games')
        .single()

      if (data) {
        try {
          const parsed: unknown = JSON.parse(data.value)
          if (Array.isArray(parsed)) {
            // Convert old strings to GameItems
            const formattedGames: GameItem[] = parsed.map((item, i) => {
              if (typeof item === 'string') {
                return { id: `game-${Date.now()}-${i}`, name: item }
              }
              return item as GameItem
            })
            setGames(formattedGames)
          }
        } catch {
          console.error('Error parsing games')
        }
      }
    } catch (err) {
      console.error('Error loading games:', err)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const saveGamesToDB = async (newGames: GameItem[]) => {
    try {
      await supabase
        .from('site_content')
        .upsert({ key: 'games', value: JSON.stringify(newGames) }, { onConflict: 'key' })
    } catch (err) {
      console.error('Failed to save games:', err)
    }
  }

  useGSAP(() => {
    if (titleRef.current) {
      gsap.from(titleRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }

    const cards = cardRefs.current.filter(Boolean)
    if (cards.length > 0) {
      gsap.from(cards, {
        scale: 0.9,
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: galleryRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }
  }, { scope: sectionRef, dependencies: [games.length] })

  const addGame = () => {
    const newGames = [...games, { id: `game-${Date.now()}`, name: 'New Game' }]
    setGames(newGames)
    saveGamesToDB(newGames)
  }

  const removeGame = (index: number) => {
    const newGames = games.filter((_, i) => i !== index)
    setGames(newGames)
    saveGamesToDB(newGames)
  }

  const updateGameName = (index: number, newName: string) => {
    const newGames = [...games]
    newGames[index].name = newName
    setGames(newGames)
    // Actually save to DB here
    saveGamesToDB(newGames)
  }

  const handleImageUpload = async (file: File, index: number) => {
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `game-${Date.now()}-${index}.${ext}`
      const filePath = `games/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('memories').getPublicUrl(filePath)
      
      const newGames = [...games]
      newGames[index].imageUrl = urlData.publicUrl
      setGames(newGames)
      saveGamesToDB(newGames)
      
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload game image.')
    }
  }

  return (
    <section
      ref={sectionRef}
      id="games"
      className="relative py-10 sm:py-14 lg:py-20 px-4 sm:px-8 lg:px-16 z-10"
    >
      <div className="max-w-5xl mx-auto">
        <h2
          ref={titleRef}
          className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-pink-deep text-center mb-8 sm:mb-10 lg:mb-12"
        >
          What We Played 🎮
        </h2>

        <div
          ref={galleryRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
        >
          {games.map((game, index) => (
            <div
              key={game.id}
              ref={(el) => { cardRefs.current[index] = el }}
              className="group relative flex flex-col items-center bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-pink-soft/40 shadow-md shadow-pink-soft/20 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-soft/30 touch-active"
            >
              {/* Image Container */}
              <div 
                className="relative w-full aspect-square rounded-xl overflow-hidden bg-pink-50 flex items-center justify-center mb-3 cursor-pointer shadow-inner"
                onClick={() => isEditMode && imageInputsRef.current[index]?.click()}
              >
                {game.imageUrl ? (
                  <Image src={game.imageUrl} alt={game.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                ) : (
                  <span className="text-4xl opacity-40">🎮</span>
                )}
                
                {isEditMode && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold px-2 text-center">Upload Cover</span>
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={el => { imageInputsRef.current[index] = el }} 
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, index)
                  }}
                />
              </div>

              {/* Game Name */}
              <div className="w-full text-center px-1">
                <p
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newName = e.currentTarget.textContent || 'Unknown'
                    if (newName !== game.name) {
                      updateGameName(index, newName)
                    }
                  }}
                  className="font-heading text-sm sm:text-base font-semibold text-pink-deep truncate outline-none focus:border-b-2 focus:border-pink-rose"
                >
                  {game.name}
                </p>
              </div>

              {/* Remove Button */}
              {isEditMode && (
                <button
                  onClick={() => removeGame(index)}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all z-10 font-bold"
                  aria-label="Remove game"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          {/* Add Game Card */}
          {isEditMode && (
            <div 
              onClick={addGame}
              className="flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl p-4 border-2 border-dashed border-pink-rose/50 cursor-pointer hover:bg-pink-50/50 hover:border-pink-rose transition-colors aspect-square min-h-[160px]"
            >
              <span className="text-3xl text-pink-rose mb-2">+</span>
              <span className="font-heading font-semibold text-pink-rose text-sm">Add Game</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
