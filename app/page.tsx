'use client'

import { EditModeProvider } from '@/context/EditModeContext'
import Navbar from '@/components/Navbar'
import FloatingHearts from '@/components/FloatingHearts'
import Hero from '@/components/Hero'
import OurStory from '@/components/OurStory'
import Songs from '@/components/Songs'
import GamesSection from '@/components/GamesSection'
import MemoryCalendar from '@/components/MemoryCalendar'
import MemoryGame from '@/components/MemoryGame'
import EditMode from '@/components/EditMode'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <EditModeProvider>
      <Navbar />
      <FloatingHearts />
      <main>
        <Hero />
        <OurStory />
        <Songs />
        <GamesSection />
        <MemoryCalendar />
        <MemoryGame />
      </main>
      <Footer />
      <EditMode />
    </EditModeProvider>
  )
}
