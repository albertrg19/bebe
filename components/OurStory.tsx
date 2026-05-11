'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useEditMode } from '@/context/EditModeContext'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function OurStory() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const hisCardRef = useRef<HTMLDivElement>(null)
  const herCardRef = useRef<HTMLDivElement>(null)

  const [hisPov, setHisPov] = useState<string>(
    'From the moment I saw her, I knew my life was about to change forever. Her smile lit up the room and my heart has been racing ever since.'
  )
  const [herPov, setHerPov] = useState<string>(
    'He walked in and everything just clicked. Like the universe finally made sense. Every day with him feels like a beautiful dream I never want to wake up from.'
  )

  const { isEditMode } = useEditMode()

  const loadContent = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', ['hisPov', 'herPov'])

      if (data) {
        data.forEach((row: { key: string; value: string }) => {
          if (row.key === 'hisPov') setHisPov(row.value)
          if (row.key === 'herPov') setHerPov(row.value)
        })
      }
    } catch (err) {
      console.error('Error loading story:', err)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

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

    if (hisCardRef.current) {
      gsap.from(hisCardRef.current, {
        x: -60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: hisCardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }

    if (herCardRef.current) {
      gsap.from(herCardRef.current, {
        x: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: herCardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      id="our-story"
      className="relative py-10 sm:py-14 lg:py-20 px-4 sm:px-8 lg:px-16 z-10"
    >
      <div className="max-w-5xl mx-auto">
        <h2
          ref={titleRef}
          className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-pink-deep text-center mb-8 sm:mb-10 lg:mb-12"
        >
          How We Started 💫
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div
            ref={hisCardRef}
            className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border border-blue-200/50 shadow-lg shadow-blue-100/30"
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">💙</span>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-blue-600">
                His POV
              </h3>
            </div>
            <p
              data-edit-key={isEditMode ? 'hisPov' : undefined}
              contentEditable={isEditMode}
              suppressContentEditableWarning
              className="font-body text-sm sm:text-base text-gray-600 leading-relaxed"
            >
              {hisPov}
            </p>
          </div>

          <div
            ref={herCardRef}
            className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border border-pink-soft/50 shadow-lg shadow-pink-soft/30"
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">💗</span>
              <h3 className="font-heading text-lg sm:text-xl font-semibold text-pink-hot">
                Her POV
              </h3>
            </div>
            <p
              data-edit-key={isEditMode ? 'herPov' : undefined}
              contentEditable={isEditMode}
              suppressContentEditableWarning
              className="font-body text-sm sm:text-base text-gray-600 leading-relaxed"
            >
              {herPov}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
