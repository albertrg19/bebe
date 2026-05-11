'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const [name2, setName2] = useState<string>('Babe')

  const loadContent = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .eq('key', 'name2')
        .single()

      if (data) {
        setName2(data.value)
      }
    } catch (err) {
      console.error('Error loading footer name:', err)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  useGSAP(() => {
    if (footerRef.current) {
      gsap.from(footerRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 95%',
          toggleActions: 'play none none none',
        },
      })
    }
  }, { scope: footerRef })

  return (
    <footer
      ref={footerRef}
      className="relative z-10 py-6 sm:py-8 px-4 sm:px-8 lg:px-16"
      style={{ backgroundColor: '#c2185b' }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="font-body text-white/90 text-sm sm:text-base lg:text-lg">
          Made with ♡ for {name2}
        </p>
        <p className="font-body text-white/50 text-[10px] sm:text-xs mt-1 sm:mt-2">
          © 2025 Our Love Story
        </p>
      </div>
    </footer>
  )
}
