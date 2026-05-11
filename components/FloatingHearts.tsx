'use client'

import React, { useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import type { HeartParticle } from '@/lib/types'

gsap.registerPlugin(useGSAP)

export default function FloatingHearts() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hearts, setHearts] = useState<HeartParticle[]>([])

  useEffect(() => {
    const generated: HeartParticle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
    }))
    setHearts(generated)
  }, [])

  useGSAP(() => {
    if (!containerRef.current || hearts.length === 0) return

    const heartElements = containerRef.current.querySelectorAll('.floating-heart')

    heartElements.forEach((heart, index) => {
      const tl = gsap.timeline({
        repeat: -1,
        yoyo: true,
        delay: hearts[index].delay,
      })

      tl.to(heart, {
        y: `${(Math.random() - 0.5) * 120}`,
        x: `${(Math.random() - 0.5) * 60}`,
        opacity: Math.random() * 0.4 + 0.1,
        duration: hearts[index].duration,
        ease: 'sine.inOut',
      })

      tl.to(heart, {
        y: `${(Math.random() - 0.5) * 100}`,
        x: `${(Math.random() - 0.5) * 40}`,
        opacity: Math.random() * 0.3 + 0.05,
        duration: hearts[index].duration * 0.8,
        ease: 'sine.inOut',
      })
    })
  }, { scope: containerRef, dependencies: [hearts] })

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart absolute text-pink-rose/20"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            fontSize: `${heart.size}px`,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  )
}
