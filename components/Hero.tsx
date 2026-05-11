'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Image from 'next/image'
import Timer from '@/components/Timer'
import { useEditMode } from '@/context/EditModeContext'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const name1Ref = useRef<HTMLDivElement>(null)
  const name2Ref = useRef<HTMLDivElement>(null)
  const timerBoxRef = useRef<HTMLDivElement>(null)
  const hoursRef = useRef<HTMLSpanElement>(null)
  const profile1Ref = useRef<HTMLDivElement>(null)
  const profile2Ref = useRef<HTMLDivElement>(null)

  const [name1, setName1] = useState<string>('Albert')
  const [name2, setName2] = useState<string>('Babe')
  const [tagline, setTagline] = useState<string>('Two hearts, one story 💕')
  const [photo1, setPhoto1] = useState<string>('')
  const [photo2, setPhoto2] = useState<string>('')
  const [startDate] = useState<string>('2025-05-23')

  const { isEditMode } = useEditMode()

  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)

  const loadContent = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')

      if (data) {
        data.forEach((row: { key: string; value: string }) => {
          switch (row.key) {
            case 'name1':
              setName1(row.value)
              break
            case 'name2':
              setName2(row.value)
              break
            case 'tagline':
              setTagline(row.value)
              break
            case 'photo1':
              setPhoto1(row.value)
              break
            case 'photo2':
              setPhoto2(row.value)
              break
          }
        })
      }
    } catch (err) {
      console.error('Error loading content:', err)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  useGSAP(() => {
    if (name1Ref.current) {
      const letters1 = name1Ref.current.querySelectorAll('.letter')
      gsap.from(letters1, {
        y: 60,
        opacity: 0,
        stagger: 0.04,
        ease: 'power3.out',
        duration: 0.8,
        delay: 0.3,
      })
    }

    if (name2Ref.current) {
      const letters2 = name2Ref.current.querySelectorAll('.letter')
      gsap.from(letters2, {
        y: 60,
        opacity: 0,
        stagger: 0.04,
        ease: 'power3.out',
        duration: 0.8,
        delay: 0.5,
      })
    }

    if (timerBoxRef.current) {
      gsap.from(timerBoxRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: 'elastic.out(1, 0.5)',
        delay: 0.8,
      })
    }

    if (profile1Ref.current) {
      gsap.from(profile1Ref.current, {
        scale: 0,
        rotation: -15,
        duration: 0.8,
        ease: 'back.out(1.7)',
        delay: 0.2,
      })
    }

    if (profile2Ref.current) {
      gsap.from(profile2Ref.current, {
        scale: 0,
        rotation: -15,
        duration: 0.8,
        ease: 'back.out(1.7)',
        delay: 0.4,
      })
    }

    if (hoursRef.current) {
      const now = new Date()
      const start = new Date(startDate)
      const diffMs = Math.max(now.getTime() - start.getTime(), 0)
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60))

      const counter = { val: 0 }
      gsap.to(counter, {
        val: totalHours,
        duration: 2.5,
        ease: 'power2.out',
        delay: 1,
        onUpdate: () => {
          if (hoursRef.current) {
            hoursRef.current.textContent = Math.floor(counter.val).toLocaleString()
          }
        },
      })
    }
  }, { scope: sectionRef, dependencies: [name1, name2] })

  const handlePhotoUpload = async (
    file: File,
    photoKey: 'photo1' | 'photo2',
    setPhoto: React.Dispatch<React.SetStateAction<string>>
  ) => {
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const fileName = `${photoKey}-${Date.now()}.${ext}`
      const filePath = `profiles/${fileName}`

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

      await supabase
        .from('site_content')
        .upsert({ key: photoKey, value: publicUrl }, { onConflict: 'key' })

      setPhoto(publicUrl)
    } catch (err) {
      console.error('Photo upload error:', err)
    }
  }

  const renderName = (name: string, ref: React.RefObject<HTMLDivElement>) => {
    return (
      <div ref={ref as React.LegacyRef<HTMLDivElement>} className="inline-flex overflow-hidden">
        {name.split('').map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="letter inline-block font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-pink-deep"
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </div>
    )
  }

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 lg:px-16 pt-20 sm:pt-24 pb-10 sm:pb-16 z-10"
    >
      {/* Profile Photos */}
      <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-6 sm:mb-8">
        {/* Profile 1 */}
        <div
          ref={profile1Ref}
          className="relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] lg:w-[120px] lg:h-[120px] rounded-full border-4 border-pink-rose overflow-hidden cursor-pointer shadow-lg shadow-pink-soft/50 bg-pink-soft/30 flex items-center justify-center touch-active"
          onClick={() => fileInput1Ref.current?.click()}
        >
          {photo1 ? (
            <Image
              src={photo1}
              alt="Profile 1"
              fill
              className="object-cover"
              sizes="(max-width: 480px) 80px, (max-width: 1024px) 100px, 120px"
            />
          ) : (
            <span className="text-2xl sm:text-3xl">📷</span>
          )}
          <input
            ref={fileInput1Ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handlePhotoUpload(file, 'photo1', setPhoto1)
            }}
          />
        </div>

        {/* Heart connector */}
        <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl animate-pulse flex-shrink-0">💕</span>

        {/* Profile 2 */}
        <div
          ref={profile2Ref}
          className="relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] lg:w-[120px] lg:h-[120px] rounded-full border-4 border-pink-rose overflow-hidden cursor-pointer shadow-lg shadow-pink-soft/50 bg-pink-soft/30 flex items-center justify-center touch-active"
          onClick={() => fileInput2Ref.current?.click()}
        >
          {photo2 ? (
            <Image
              src={photo2}
              alt="Profile 2"
              fill
              className="object-cover"
              sizes="(max-width: 480px) 80px, (max-width: 1024px) 100px, 120px"
            />
          ) : (
            <span className="text-2xl sm:text-3xl">📷</span>
          )}
          <input
            ref={fileInput2Ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handlePhotoUpload(file, 'photo2', setPhoto2)
            }}
          />
        </div>
      </div>

      {/* Names */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        {isEditMode ? (
          <span
            data-edit-key="name1"
            contentEditable
            suppressContentEditableWarning
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-pink-deep"
          >
            {name1}
          </span>
        ) : (
          renderName(name1, name1Ref)
        )}

        <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl animate-pulse">💕</span>

        {isEditMode ? (
          <span
            data-edit-key="name2"
            contentEditable
            suppressContentEditableWarning
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-pink-deep"
          >
            {name2}
          </span>
        ) : (
          renderName(name2, name2Ref)
        )}
      </div>

      {/* Tagline */}
      <p
        data-edit-key={isEditMode ? 'tagline' : undefined}
        contentEditable={isEditMode}
        suppressContentEditableWarning
        className="font-body text-sm sm:text-base md:text-lg lg:text-xl text-pink-hot/80 mb-6 sm:mb-8 md:mb-10 text-center max-w-xs sm:max-w-sm md:max-w-md"
      >
        {tagline}
      </p>

      {/* Timer */}
      <div ref={timerBoxRef}>
        <Timer startDate={startDate} />
      </div>

      {/* Total Hours */}
      <div className="mt-4 sm:mt-6 text-center">
        <p className="font-body text-xs sm:text-sm text-pink-hot/60 mb-1">Total Hours Together</p>
        <span
          ref={hoursRef}
          className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-pink-deep"
        >
          0
        </span>
      </div>
    </section>
  )
}
