export interface SiteContent {
  name1: string
  name2: string
  tagline: string
  hisPov: string
  herPov: string
  song1Title: string
  song1Artist: string
  song1Cover?: string
  song1Audio?: string
  song2Title: string
  song2Artist: string
  song2Cover?: string
  song2Audio?: string
  song3Title: string
  song3Artist: string
  song3Cover?: string
  song3Audio?: string
  games: (string | GameItem)[]
  startDate: string
}

export interface GameItem {
  id: string
  name: string
  imageUrl?: string
  gallery?: string[]
}

export interface CalendarPhoto {
  id: string
  date: string
  photo_url: string
  caption?: string
}

export interface GameCard {
  id: number
  emoji: string
  pairId: number
}

export interface GameState {
  cards: GameCard[]
  flipped: number[]
  matched: number[]
  flips: number
  locked: boolean
}

export interface HeartParticle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export interface EditableField {
  key: keyof SiteContent
  element: HTMLElement
  originalValue: string
}
