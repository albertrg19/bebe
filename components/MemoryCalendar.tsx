'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { CalendarPhoto } from '@/lib/types'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const DAY_HEADERS_FULL: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_HEADERS_SHORT: string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function formatDatePretty(dateStr: string): string {
  const parts = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIdx = parseInt(parts[1], 10) - 1
  return `${months[monthIdx]} ${parseInt(parts[2], 10)}, ${parts[0]}`
}

const MONTH_NAMES: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function MemoryCalendar() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = new Date()
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth())
  const [photos, setPhotos] = useState<CalendarPhoto[]>([])
  const [isMobile, setIsMobile] = useState<boolean>(false)

  // Gallery modal state
  const [galleryDate, setGalleryDate] = useState<string | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<CalendarPhoto[]>([])
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 481)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadPhotos = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('calendar_photos')
        .select('*')
        .order('created_at', { ascending: true })

      if (data) {
        setPhotos(data as CalendarPhoto[])
      }
    } catch (err) {
      console.error('Error loading photos:', err)
    }
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

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

    if (calendarRef.current) {
      gsap.from(calendarRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: calendarRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }
  }, { scope: sectionRef })

  const animateCells = useCallback(() => {
    const cells = cellRefs.current.filter(Boolean)
    if (cells.length > 0) {
      gsap.from(cells, {
        scale: 0.8,
        opacity: 0,
        stagger: 0.01,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }, [])

  useEffect(() => {
    animateCells()
  }, [currentMonth, currentYear, animateCells])

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((prev) => prev - 1)
    } else {
      setCurrentMonth((prev) => prev - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((prev) => prev + 1)
    } else {
      setCurrentMonth((prev) => prev + 1)
    }
  }

  const getDatePhotos = (dateStr: string): CalendarPhoto[] => {
    return photos.filter((p) => p.date === dateStr)
  }

  const handleCellClick = (dateStr: string) => {
    const datePhotos = getDatePhotos(dateStr)
    setGalleryDate(dateStr)
    setGalleryPhotos(datePhotos)
  }

  const handleUploadForDate = (dateStr: string) => {
    setGalleryDate(dateStr)
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !galleryDate) return

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const fileName = `${galleryDate}-${Date.now()}.${ext}`
      const filePath = `calendar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const { error: dbError } = await supabase
        .from('calendar_photos')
        .insert({ date: galleryDate, photo_url: publicUrl })

      if (dbError) {
        console.error('DB error:', dbError)
        alert(`Save failed: ${dbError.message}`)
        return
      }

      await loadPhotos()

      // Refresh the gallery modal photos
      const { data: refreshed } = await supabase
        .from('calendar_photos')
        .select('*')
        .eq('date', galleryDate)
        .order('created_at', { ascending: true })

      if (refreshed) {
        setGalleryPhotos(refreshed as CalendarPhoto[])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Upload error:', err)
      alert(`Upload failed: ${message}`)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await supabase
        .from('calendar_photos')
        .delete()
        .eq('id', photoId)

      await loadPhotos()

      setGalleryPhotos((prev) => prev.filter((p) => p.id !== photoId))

      if (viewerIndex !== null) {
        setViewerIndex(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day)
  }

  const dayHeaders = isMobile ? DAY_HEADERS_SHORT : DAY_HEADERS_FULL
  let cellIndex = 0

  return (
    <section
      ref={sectionRef}
      id="memories"
      className="relative py-10 sm:py-14 lg:py-20 px-4 sm:px-8 lg:px-16 z-10"
    >
      <div className="max-w-full sm:max-w-2xl lg:max-w-3xl mx-auto">
        <h2
          ref={titleRef}
          className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-pink-deep text-center mb-8 sm:mb-10 lg:mb-12"
        >
          Memory Calendar 📸
        </h2>

        <div
          ref={calendarRef}
          className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 border border-pink-soft/40 shadow-lg shadow-pink-soft/20"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={goToPrevMonth}
              className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-pink-soft/50 text-pink-deep font-bold hover:bg-pink-soft active:bg-pink-rose/30 transition-colors touch-active text-lg"
            >
              ‹
            </button>
            <h3 className="font-heading text-lg sm:text-xl lg:text-2xl font-semibold text-pink-deep">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={goToNextMonth}
              className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-pink-soft/50 text-pink-deep font-bold hover:bg-pink-soft active:bg-pink-rose/30 transition-colors touch-active text-lg"
            >
              ›
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-2 mb-1 sm:mb-2">
            {dayHeaders.map((day, idx) => (
              <div
                key={`${day}-${idx}`}
                className="text-center font-body text-[10px] sm:text-xs lg:text-sm font-semibold text-pink-hot/60 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 lg:gap-2">
            {calendarCells.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square min-h-[44px] sm:min-h-0" />
              }

              const dateStr = formatDate(currentYear, currentMonth, day)
              const datePhotos = getDatePhotos(dateStr)
              const hasPhotos = datePhotos.length > 0
              const firstPhoto = datePhotos[0]
              const isToday = dateStr === todayStr
              const currentCellIndex = cellIndex++

              return (
                <div
                  key={dateStr}
                  ref={(el) => {
                    cellRefs.current[currentCellIndex] = el
                  }}
                  onClick={() => handleCellClick(dateStr)}
                  className={`
                    group aspect-square min-h-[44px] sm:min-h-0 rounded-md sm:rounded-lg overflow-hidden cursor-pointer relative
                    flex items-center justify-center
                    transition-all duration-200 active:scale-95 touch-active
                    ${isToday
                      ? 'border-2 border-pink-hot shadow-md shadow-pink-hot/30'
                      : 'border border-pink-soft/30'
                    }
                    ${hasPhotos ? '' : 'bg-pink-blush/50 hover:bg-pink-soft/30'}
                  `}
                >
                  {hasPhotos && firstPhoto ? (
                    <Image
                      src={firstPhoto.photo_url}
                      alt={`Memory ${dateStr}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 480px) 44px, (max-width: 768px) 60px, 80px"
                    />
                  ) : (
                    <span className="font-body text-[10px] sm:text-xs lg:text-sm text-pink-hot/50 select-none">
                      {day}
                    </span>
                  )}

                  {hasPhotos && (
                    <>
                      {/* Permanent Date Badge */}
                      <div className="absolute top-0.5 left-1 sm:top-1 sm:left-1.5 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        <span className="text-white text-[11px] sm:text-xs font-body font-bold">
                          {day}
                        </span>
                      </div>
                      
                      {/* "+N more" Badge */}
                      {datePhotos.length > 1 && (
                        <div className="absolute bottom-0.5 right-1 sm:bottom-1 sm:right-1.5 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          <span className="text-white/95 text-[8px] sm:text-[9px] font-body font-bold">
                            +{datePhotos.length - 1}
                          </span>
                        </div>
                      )}

                      {/* Gentle hover overlay to indicate it's clickable */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Date Gallery Modal — Horizontal Slideshow Design */}
      <AnimatePresence>
        {galleryDate !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
            onClick={() => { setGalleryDate(null); setViewerIndex(null) }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative w-full sm:w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[85vh] bg-gradient-to-b from-white to-pink-50 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-pink-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-pink-rose to-pink-hot flex items-center justify-center text-white font-heading font-bold text-sm sm:text-lg shadow-md">
                    {galleryDate.split('-')[2]}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-pink-deep">
                      {formatDatePretty(galleryDate)}
                    </h3>
                    <p className="font-body text-[10px] sm:text-xs text-pink-hot/60">
                      {galleryPhotos.length} {galleryPhotos.length === 1 ? 'memory' : 'memories'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUploadForDate(galleryDate)}
                    className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-pink-rose/20 text-pink-deep hover:bg-pink-rose/40 active:scale-95 transition-all touch-active text-lg"
                    aria-label="Add photo"
                  >
                    +
                  </button>
                  <button
                    onClick={() => { setGalleryDate(null); setViewerIndex(null) }}
                    className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-pink-soft/30 text-pink-deep font-bold hover:bg-pink-soft active:bg-pink-rose/30 transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Photo Grid — Masonry-like staggered layout */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                {galleryPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="text-6xl mb-4 opacity-40"
                    >
                      📷
                    </motion.div>
                    <p className="font-body text-pink-hot/50 text-sm sm:text-base mb-4">No memories yet for this day</p>
                    <button
                      onClick={() => handleUploadForDate(galleryDate)}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-rose to-pink-hot text-white font-body font-semibold text-sm shadow-lg shadow-pink-rose/30 hover:shadow-xl active:scale-95 transition-all touch-active"
                    >
                      📸 Add First Memory
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {galleryPhotos.map((photo, idx) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.06, duration: 0.35 }}
                        className="relative aspect-square group"
                      >
                        <div
                          className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-pink-soft/20 cursor-pointer hover:shadow-lg hover:shadow-pink-soft/40 transition-all hover:scale-[1.02]"
                          onClick={() => setViewerIndex(idx)}
                        >
                          <Image
                            src={photo.photo_url}
                            alt={`Memory ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 45vw, 30vw"
                          />

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                            <span className="text-white/90 font-body text-xs font-medium">View</span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePhoto(photo.id)
                          }}
                          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all font-bold opacity-0 group-hover:opacity-100 text-xs sm:text-sm z-10"
                          aria-label="Delete photo"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}

                    {/* Add more card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: galleryPhotos.length * 0.06 }}
                      className="aspect-square"
                    >
                      <div
                        onClick={() => handleUploadForDate(galleryDate)}
                        className="w-full h-full rounded-xl sm:rounded-2xl border-2 border-dashed border-pink-rose/40 bg-pink-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-100/50 hover:border-pink-rose transition-colors"
                      >
                        <span className="text-3xl text-pink-rose mb-1">+</span>
                        <span className="font-heading text-xs sm:text-sm font-semibold text-pink-rose">Add Photo</span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Photo Viewer — Carousel with swipe animations */}
      <AnimatePresence>
        {viewerIndex !== null && galleryPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => setViewerIndex(null)}
          >
            {/* Navigation Arrows */}
            {viewerIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setViewerIndex((prev) => (prev !== null ? prev - 1 : null))
                }}
                className="absolute left-2 sm:left-6 z-10 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all touch-active text-xl sm:text-2xl"
              >
                ‹
              </button>
            )}

            {viewerIndex < galleryPhotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setViewerIndex((prev) => (prev !== null ? prev + 1 : null))
                }}
                className="absolute right-2 sm:right-6 z-10 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all touch-active text-xl sm:text-2xl"
              >
                ›
              </button>
            )}

            {/* Close */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setViewerIndex(null)
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 transition-all text-lg"
            >
              ✕
            </button>

            {/* Photo Counter */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="font-body text-white/80 text-xs sm:text-sm">
                {viewerIndex + 1} / {galleryPhotos.length}
              </span>
            </div>

            {/* Image */}
            <motion.div
              key={viewerIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative w-[90vw] h-[75vh] sm:w-[80vw] sm:h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryPhotos[viewerIndex].photo_url}
                alt={`Photo ${viewerIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
