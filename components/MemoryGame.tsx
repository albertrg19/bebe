'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameCard, GameState } from '@/lib/types'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const EMOJIS: string[] = ['🌸', '💕', '🎀', '🦋', '💖', '🌷', '✨', '💝']

function createDeck(): GameCard[] {
  const cards: GameCard[] = []
  EMOJIS.forEach((emoji, index) => {
    cards.push({ id: index * 2, emoji, pairId: index })
    cards.push({ id: index * 2 + 1, emoji, pairId: index })
  })
  return shuffleArray(cards)
}

function shuffleArray(array: GameCard[]): GameCard[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled
}

export default function MemoryGame() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const cardElementRefs = useRef<(HTMLDivElement | null)[]>([])
  const shuffleBtnRef = useRef<HTMLButtonElement>(null)
  const winOverlayRef = useRef<HTMLDivElement>(null)

  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flipped: [],
    matched: [],
    flips: 0,
    locked: false,
  })

  useEffect(() => {
    setGameState((prev) => ({ ...prev, cards: createDeck() }))
  }, [])

  const [hasWon, setHasWon] = useState<boolean>(false)

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
  }, { scope: sectionRef })

  const flipCard = useCallback((cardElement: HTMLDivElement, toFront: boolean) => {
    const inner = cardElement.querySelector('.card-inner') as HTMLElement
    if (inner) {
      gsap.to(inner, {
        rotateY: toFront ? 180 : 0,
        duration: 0.5,
        ease: 'power2.inOut',
      })
    }
  }, [])

  const shakeCard = useCallback((cardElement: HTMLDivElement) => {
    const tl = gsap.timeline()
    tl.to(cardElement, { x: -6, duration: 0.08 })
    tl.to(cardElement, { x: 6, duration: 0.08 })
    tl.to(cardElement, { x: -6, duration: 0.08 })
    tl.to(cardElement, { x: 6, duration: 0.08 })
    tl.to(cardElement, { x: 0, duration: 0.08 })
  }, [])

  const glowCard = useCallback((cardElement: HTMLDivElement) => {
    gsap.fromTo(
      cardElement,
      { boxShadow: '0 0 0 0 rgba(240, 98, 146, 0)' },
      {
        boxShadow: '0 0 20px 8px rgba(240, 98, 146, 0.6)',
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      }
    )
  }, [])

  const spawnWinParticles = useCallback(() => {
    if (!winOverlayRef.current) return

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div')
      particle.textContent = '♥'
      particle.style.position = 'absolute'
      particle.style.left = '50%'
      particle.style.top = '50%'
      particle.style.fontSize = `${Math.random() * 20 + 12}px`
      particle.style.color = `hsl(${340 + Math.random() * 30}, 80%, ${60 + Math.random() * 20}%)`
      particle.style.pointerEvents = 'none'
      winOverlayRef.current.appendChild(particle)

      gsap.to(particle, {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        opacity: 0,
        scale: Math.random() * 2 + 0.5,
        duration: Math.random() * 1.5 + 1,
        ease: 'power2.out',
        onComplete: () => {
          particle.remove()
        },
      })
    }
  }, [])

  const handleCardClick = useCallback((cardIndex: number) => {
    setGameState((prev) => {
      if (prev.locked) return prev
      if (prev.flipped.includes(cardIndex)) return prev
      if (prev.matched.includes(prev.cards[cardIndex].pairId)) return prev

      const newFlipped = [...prev.flipped, cardIndex]
      const cardEl = cardElementRefs.current[cardIndex]
      if (cardEl) flipCard(cardEl, true)

      if (newFlipped.length === 2) {
        const [first, second] = newFlipped
        const card1 = prev.cards[first]
        const card2 = prev.cards[second]

        if (card1.pairId === card2.pairId) {
          const newMatched = [...prev.matched, card1.pairId]
          const el1 = cardElementRefs.current[first]
          const el2 = cardElementRefs.current[second]
          if (el1) setTimeout(() => glowCard(el1), 200)
          if (el2) setTimeout(() => glowCard(el2), 200)

          if (newMatched.length === EMOJIS.length) {
            setTimeout(() => {
              setHasWon(true)
              setTimeout(spawnWinParticles, 300)
            }, 600)
          }

          return {
            ...prev,
            flipped: [],
            matched: newMatched,
            flips: prev.flips + 1,
            locked: false,
          }
        } else {
          setTimeout(() => {
            const el1 = cardElementRefs.current[first]
            const el2 = cardElementRefs.current[second]
            if (el1) {
              shakeCard(el1)
              flipCard(el1, false)
            }
            if (el2) {
              shakeCard(el2)
              flipCard(el2, false)
            }
            setGameState((s) => ({
              ...s,
              flipped: [],
              locked: false,
            }))
          }, 800)

          return {
            ...prev,
            flipped: newFlipped,
            flips: prev.flips + 1,
            locked: true,
          }
        }
      }

      return {
        ...prev,
        flipped: newFlipped,
      }
    })
  }, [flipCard, shakeCard, glowCard, spawnWinParticles])

  const handleShuffle = () => {
    if (shuffleBtnRef.current) {
      gsap.to(shuffleBtnRef.current, {
        rotation: '+=360',
        duration: 0.5,
        ease: 'power2.inOut',
      })
    }

    cardElementRefs.current.forEach((el) => {
      if (el) {
        const inner = el.querySelector('.card-inner') as HTMLElement
        if (inner) {
          gsap.set(inner, { rotateY: 0 })
        }
      }
    })

    setGameState({
      cards: createDeck(),
      flipped: [],
      matched: [],
      flips: 0,
      locked: false,
    })
    setHasWon(false)
  }

  const matchCount = gameState.matched.length

  return (
    <section
      ref={sectionRef}
      id="game"
      className="relative py-10 sm:py-14 lg:py-20 px-4 sm:px-8 lg:px-16 z-10"
    >
      <div className="max-w-[320px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[500px] mx-auto">
        <h2
          ref={titleRef}
          className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-pink-deep text-center mb-6 sm:mb-8"
        >
          Memory Match 🧠
        </h2>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center">
            <p className="font-body text-[10px] sm:text-xs text-pink-hot/60 uppercase tracking-wider">Flips</p>
            <p className="font-heading text-xl sm:text-2xl font-bold text-pink-deep">{gameState.flips}</p>
          </div>
          <div className="w-px h-6 sm:h-8 bg-pink-soft" />
          <div className="text-center">
            <p className="font-body text-[10px] sm:text-xs text-pink-hot/60 uppercase tracking-wider">Matches</p>
            <p className="font-heading text-xl sm:text-2xl font-bold text-pink-deep">
              {matchCount}/{EMOJIS.length}
            </p>
          </div>
        </div>

        {/* Game Board */}
        <div
          ref={boardRef}
          className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-6"
        >
          {gameState.cards.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              ref={(el) => {
                cardElementRefs.current[index] = el
              }}
              onClick={() => handleCardClick(index)}
              className="aspect-square min-w-[60px] min-h-[60px] cursor-pointer rounded-lg sm:rounded-xl touch-active"
              style={{ perspective: '600px' }}
            >
              <div className="card-inner">
                <div className="card-back">
                  <span className="text-lg sm:text-2xl md:text-3xl text-white/80">♥</span>
                </div>
                <div className="card-front">
                  <span className="text-lg sm:text-2xl md:text-3xl">{card.emoji}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shuffle Button */}
        <div className="flex justify-center">
          <button
            ref={shuffleBtnRef}
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-pink-rose to-pink-hot text-white font-body font-semibold text-sm sm:text-base shadow-lg shadow-pink-rose/30 hover:shadow-xl hover:shadow-pink-hot/30 active:scale-95 transition-all touch-active min-h-[44px]"
          >
            🔄 Shuffle & Reset
          </button>
        </div>
      </div>

      {/* Win Screen */}
      <AnimatePresence>
        {hasWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setHasWon(false)}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center shadow-2xl max-w-[280px] sm:max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div ref={winOverlayRef} className="absolute inset-0 overflow-hidden pointer-events-none" />

              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎉</div>
              <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-pink-deep mb-2">
                You Won!
              </h3>
              <p className="font-body text-sm sm:text-base text-pink-hot/70 mb-4 sm:mb-6">
                Completed in {gameState.flips} flips! 💕
              </p>

              <button
                onClick={() => {
                  setHasWon(false)
                  handleShuffle()
                }}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-pink-rose to-pink-hot text-white font-body font-semibold text-sm sm:text-base shadow-lg active:scale-95 touch-active min-h-[44px]"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
