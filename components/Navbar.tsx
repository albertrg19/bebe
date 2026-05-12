'use client'

import React, { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useEditMode } from '@/context/EditModeContext'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const navLinks: { label: string; href: string }[] = [
  { label: 'Home', href: '#home' },
  { label: 'Our Story', href: '#our-story' },
  { label: 'Songs', href: '#songs' },
  { label: 'Memories', href: '#memories' },
  { label: 'Notes', href: '#love-letters' },
  { label: 'Bucket List', href: '#bucket-list' },
  { label: 'Game', href: '#game' },
]

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const underlineRefs = useRef<(HTMLDivElement | null)[]>([])
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isEditMode, toggleEditMode } = useEditMode()
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  useGSAP(() => {
    if (navRef.current) {
      gsap.from(navRef.current, {
        y: -80,
        duration: 0.6,
        ease: 'power2.out',
      })
    }

    if (progressRef.current) {
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      })
    }
  }, { scope: navRef })

  const handleMouseEnter = (index: number) => {
    const underline = underlineRefs.current[index]
    if (underline) {
      gsap.to(underline, {
        scaleX: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }

  const handleMouseLeave = (index: number) => {
    const underline = underlineRefs.current[index]
    if (underline) {
      gsap.to(underline, {
        scaleX: 0,
        duration: 0.3,
        ease: 'power2.in',
      })
    }
  }

  const toggleMenu = () => {
    const newState = !menuOpen
    setMenuOpen(newState)

    if (hamburgerRef.current) {
      gsap.to(hamburgerRef.current, {
        rotation: newState ? 45 : 0,
        duration: 0.3,
        ease: 'power2.inOut',
      })
    }

    if (dropdownRef.current) {
      if (newState) {
        gsap.set(dropdownRef.current, { display: 'flex' })
        gsap.from(dropdownRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        })
      } else {
        gsap.to(dropdownRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            if (dropdownRef.current) {
              gsap.set(dropdownRef.current, { display: 'none', y: 0, opacity: 1 })
            }
          },
        })
      }
    }
  }

  const handleMobileLinkClick = () => {
    setMenuOpen(false)
    if (hamburgerRef.current) {
      gsap.to(hamburgerRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      })
    }
    if (dropdownRef.current) {
      gsap.to(dropdownRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          if (dropdownRef.current) {
            gsap.set(dropdownRef.current, { display: 'none', y: 0, opacity: 1 })
          }
        },
      })
    }
  }

  return (
    <>
      <div
        ref={progressRef}
        className="scroll-progress"
        style={{ transform: 'scaleX(0)' }}
      />
      <nav
        ref={navRef}
        className="fixed top-[3px] left-0 right-0 z-50 backdrop-blur-md bg-pink-blush/70 border-b border-pink-soft/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <a
              href="#home"
              className="font-heading italic text-lg sm:text-xl lg:text-2xl text-pink-deep font-bold tracking-wide min-h-0"
            >
              our love story
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  ref={(el) => {
                    linkRefs.current[index] = el
                  }}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  className="relative font-body text-sm text-pink-deep/80 hover:text-pink-deep transition-colors py-1 min-h-0"
                >
                  {link.label}
                  <div
                    ref={(el) => {
                      underlineRefs.current[index] = el
                    }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-hot origin-left"
                    style={{ transform: 'scaleX(0)' }}
                  />
                </a>
              ))}
            </div>

            {/* Right side: Edit button + Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Edit toggle */}
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-body font-medium transition-all duration-200 border-2 min-h-[36px] sm:min-h-0"
                style={{
                  backgroundColor: isEditMode ? '#c2185b' : 'transparent',
                  color: isEditMode ? 'white' : '#c2185b',
                  borderColor: '#c2185b',
                }}
              >
                <span>✏️</span>
                <span className="hidden sm:inline">{isEditMode ? 'Editing' : 'Edit'}</span>
              </button>

              {/* Hamburger - visible on tablet and below */}
              <button
                ref={hamburgerRef}
                onClick={toggleMenu}
                className="flex md:hidden flex-col items-center justify-center gap-1.5 w-10 h-10 rounded-lg touch-active"
                aria-label="Toggle menu"
              >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          ref={dropdownRef}
          className="mobile-nav-dropdown md:hidden flex-col items-stretch bg-pink-blush/95 backdrop-blur-md border-t border-pink-soft/50 shadow-lg"
          style={{ display: 'none' }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleMobileLinkClick}
              className="font-body text-base text-pink-deep/80 hover:text-pink-deep active:bg-pink-soft/30 px-6 py-3.5 border-b border-pink-soft/20 transition-colors touch-active min-h-[44px] flex items-center"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}
