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
  const [selectedPhoto, setSelectedPhoto] = useState<CalendarPhoto | null>(null)
  const [uploadDate, setUploadDate] = useState<string>('')
  const [isMobile, setIsMobile] = useState<boolean>(false)

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

  const handleCellClick = (dateStr: string) => {
    const existingPhoto = photos.find((p) => p.date === dateStr)
    if (existingPhoto) {
      setSelectedPhoto(existingPhoto)
    } else {
      setUploadDate(dateStr)
      fileInputRef.current?.click()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadDate) return

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const fileName = `${uploadDate}-${Date.now()}.${ext}`
      const filePath = `calendar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return
      }

      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const { error: dbError } = await supabase
        .from('calendar_photos')
        .upsert(
          { date: uploadDate, photo_url: publicUrl },
          { onConflict: 'date' }
        )

      if (dbError) {
        console.error('DB error:', dbError)
        return
      }

      await loadPhotos()
    } catch (err) {
      console.error('Upload error:', err)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setUploadDate('')
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
              const photo = photos.find((p) => p.date === dateStr)
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
                    aspect-square min-h-[44px] sm:min-h-0 rounded-md sm:rounded-lg overflow-hidden cursor-pointer relative
                    flex items-center justify-center
                    transition-all duration-200 active:scale-95 touch-active
                    ${isToday
                      ? 'border-2 border-pink-hot shadow-md shadow-pink-hot/30'
                      : 'border border-pink-soft/30'
                    }
                    ${photo ? '' : 'bg-pink-blush/50 hover:bg-pink-soft/30'}
                  `}
                >
                  {photo ? (
                    <Image
                      src={photo.photo_url}
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

                  {photo && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] sm:text-xs font-body font-medium">
                        {day}
                      </span>
                    </div>
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

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full h-full sm:w-auto sm:h-auto sm:max-w-sm md:max-w-xl lg:max-w-2xl bg-white rounded-none sm:rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[calc(100%-80px)] sm:h-[60vh] md:h-[70vh]">
                <Image
                  src={selectedPhoto.photo_url}
                  alt={`Memory ${selectedPhoto.date}`}
                  fill
                  className="object-contain bg-black"
                  sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, 800px"
                />
              </div>

              <div className="h-[80px] sm:h-auto p-3 sm:p-4 lg:p-6 flex items-center justify-between">
                <div>
                  <p className="font-heading text-base sm:text-lg font-semibold text-pink-deep">
                    {selectedPhoto.date}
                  </p>
                  {selectedPhoto.caption && (
                    <p className="font-body text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                      {selectedPhoto.caption}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-pink-soft/50 text-pink-deep font-bold hover:bg-pink-soft active:bg-pink-rose/30 transition-colors touch-active"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
