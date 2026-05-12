'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useEditMode } from '@/context/EditModeContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface SongData {
  title: string
  artist: string
  titleKey: string
  artistKey: string
  coverKey: string
  audioKey: string
  coverUrl?: string
  audioUrl?: string
}

const initialSongs: SongData[] = [
  { title: 'Perfect', artist: 'Ed Sheeran', titleKey: 'song1Title', artistKey: 'song1Artist', coverKey: 'song1Cover', audioKey: 'song1Audio' },
  { title: 'All of Me', artist: 'John Legend', titleKey: 'song2Title', artistKey: 'song2Artist', coverKey: 'song2Cover', audioKey: 'song2Audio' },
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran', titleKey: 'song3Title', artistKey: 'song3Artist', coverKey: 'song3Cover', audioKey: 'song3Audio' },
]

export default function Songs() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
  const coverInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const audioInputsRef = useRef<(HTMLInputElement | null)[]>([])

  const [songs, setSongs] = useState<SongData[]>(initialSongs)
  const { isEditMode } = useEditMode()
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0])
  const [durations, setDurations] = useState<number[]>([0, 0, 0])
  const [spotifyLinks, setSpotifyLinks] = useState<string[]>(['', '', ''])
  const [isFetchingSpotify, setIsFetchingSpotify] = useState<boolean>(false)

  const handleSpotifyFetch = async (index: number) => {
    const link = spotifyLinks[index]
    if (!link) return

    setIsFetchingSpotify(true)
    try {
      const res = await fetch(`/api/spotify?url=${encodeURIComponent(link)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      
      const song = songs[index]
      
      setSongs(prev => {
        const newSongs = [...prev]
        if (data.title) newSongs[index].title = data.title
        if (data.artist) newSongs[index].artist = data.artist
        if (data.coverUrl) newSongs[index].coverUrl = data.coverUrl
        return newSongs
      })

      setSpotifyLinks(prev => {
        const newLinks = [...prev]
        newLinks[index] = ''
        return newLinks
      })

      const updates: any[] = []
      if (data.title) updates.push({ key: song.titleKey, value: data.title })
      if (data.artist) updates.push({ key: song.artistKey, value: data.artist })
      if (data.coverUrl) updates.push({ key: song.coverKey, value: data.coverUrl })

      if (updates.length > 0) {
        await supabase.from('site_content').upsert(updates, { onConflict: 'key' })
      }
      
    } catch (err) {
      console.error(err)
      alert('Could not fetch Spotify details. Make sure the link is a valid Spotify track URL.')
    } finally {
      setIsFetchingSpotify(false)
    }
  }

  const loadContent = useCallback(async () => {
    try {
      const keys = initialSongs.flatMap(s => [s.titleKey, s.artistKey, s.coverKey, s.audioKey])
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', keys)

      if (data && data.length > 0) {
        const contentMap: Record<string, string> = {}
        data.forEach((row: { key: string; value: string }) => {
          contentMap[row.key] = row.value
        })

        setSongs((prev) =>
          prev.map((song) => ({
            ...song,
            title: contentMap[song.titleKey] ?? song.title,
            artist: contentMap[song.artistKey] ?? song.artist,
            coverUrl: contentMap[song.coverKey] ?? song.coverUrl,
            audioUrl: contentMap[song.audioKey] ?? song.audioUrl,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading songs:', err)
    }
  }, [])
  const [hasAutoPlayed, setHasAutoPlayed] = useState<boolean>(false)
  const [showPlayPrompt, setShowPlayPrompt] = useState<boolean>(false)

  useEffect(() => {
    loadContent()
  }, [loadContent])

  // Attempt autoplay of song 1 after audio is ready
  useEffect(() => {
    if (hasAutoPlayed) return
    const audio = audioRefs.current[0]
    if (!audio || !songs[0]?.audioUrl) return

    const tryAutoPlay = () => {
      audio.play()
        .then(() => {
          setPlayingIndex(0)
          setHasAutoPlayed(true)
        })
        .catch(() => {
          // Browser blocked autoplay — show a gentle prompt
          setShowPlayPrompt(true)
          setHasAutoPlayed(true)

          const handleUserInteraction = () => {
            const a = audioRefs.current[0]
            if (a) {
              a.play()
                .then(() => {
                  setPlayingIndex(0)
                  setShowPlayPrompt(false)
                })
                .catch(() => { /* still blocked, give up */ })
            }
            document.removeEventListener('click', handleUserInteraction)
            document.removeEventListener('touchstart', handleUserInteraction)
          }

          document.addEventListener('click', handleUserInteraction, { once: true })
          document.addEventListener('touchstart', handleUserInteraction, { once: true })
        })
    }

    // Small delay to let the audio element load
    const timer = setTimeout(tryAutoPlay, 1500)
    return () => clearTimeout(timer)
  }, [songs, hasAutoPlayed])

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

    // Removed buggy GSAP animation for cards that hides them on hash navigation
  }, { scope: sectionRef })

  const togglePlay = (index: number) => {
    if (playingIndex === index) {
      audioRefs.current[index]?.pause()
      setPlayingIndex(null)
    } else {
      if (playingIndex !== null) {
        audioRefs.current[playingIndex]?.pause()
      }
      const audio = audioRefs.current[index]
      if (audio) {
        audio.play().catch(e => console.error('Audio play failed:', e))
        setPlayingIndex(index)
      }
    }
  }

  const handleTimeUpdate = (index: number) => {
    const audio = audioRefs.current[index]
    if (audio) {
      setProgresses(prev => {
        const newProg = [...prev]
        newProg[index] = audio.currentTime
        return newProg
      })
    }
  }

  const handleLoadedMetadata = (index: number) => {
    const audio = audioRefs.current[index]
    if (audio) {
      setDurations(prev => {
        const newDur = [...prev]
        newDur[index] = audio.duration
        return newDur
      })
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const time = parseFloat(e.target.value)
    const audio = audioRefs.current[index]
    if (audio) {
      audio.currentTime = time
      setProgresses(prev => {
        const newProg = [...prev]
        newProg[index] = time
        return newProg
      })
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleFileUpload = async (file: File, type: 'audio' | 'cover', index: number) => {
    try {
      const song = songs[index]
      const ext = file.name.split('.').pop() ?? (type === 'audio' ? 'mp3' : 'jpg')
      const fileName = `${type}-${song.titleKey}-${Date.now()}.${ext}`
      const filePath = `songs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      const dbKey = type === 'audio' ? song.audioKey : song.coverKey
      await supabase
        .from('site_content')
        .upsert({ key: dbKey, value: publicUrl }, { onConflict: 'key' })

      setSongs(prev => {
        const newSongs = [...prev]
        if (type === 'audio') {
          newSongs[index].audioUrl = publicUrl
        } else {
          newSongs[index].coverUrl = publicUrl
        }
        return newSongs
      })
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload file.')
    }
  }

  return (
    <section
      ref={sectionRef}
      id="songs"
      className="relative py-10 sm:py-14 lg:py-20 px-4 sm:px-8 lg:px-16 z-10"
    >
      {/* Autoplay prompt — shown when browser blocks autoplay */}
      {showPlayPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-rose to-pink-hot text-white font-body font-semibold text-sm shadow-xl shadow-pink-hot/40 flex items-center gap-2">
            <span>🎵</span>
            <span>Tap anywhere to play music</span>
          </div>
        </div>
      )}
      <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
        <h2
          ref={titleRef}
          className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-pink-deep text-center mb-8 sm:mb-10 lg:mb-12"
        >
          Our Top 3 Songs 🎵
        </h2>

        <div className="flex flex-col gap-4 sm:gap-6">
          {songs.map((song, index) => {
            const isPlaying = playingIndex === index
            const progress = progresses[index] || 0
            const duration = durations[index] || 0
            const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0

            return (
              <div
                key={song.titleKey}
                ref={(el) => { cardRefs.current[index] = el }}
                className="flex flex-col bg-white/80 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-pink-soft/50 shadow-lg shadow-pink-soft/20 transition-all hover:shadow-xl hover:shadow-pink-soft/30"
              >
                <div className="flex items-center gap-4 sm:gap-5 lg:gap-6">
                  {/* Cover Art */}
                  <div 
                    className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-pink-soft/30 shadow-inner group"
                    onClick={() => isEditMode && coverInputsRef.current[index]?.click()}
                  >
                    {song.coverUrl ? (
                      <Image src={song.coverUrl} alt={song.title} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-pink-hot/40 text-2xl">🎵</div>
                    )}
                    {isEditMode && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-white text-[10px] sm:text-xs font-semibold">Upload Cover</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={el => { coverInputsRef.current[index] = el }} 
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, 'cover', index)
                      }}
                    />
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      data-edit-key={isEditMode ? song.titleKey : undefined}
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newTitle = e.currentTarget.textContent || 'Unknown Title'
                        if (newTitle !== song.title) {
                          setSongs(prev => {
                            const newSongs = [...prev]
                            newSongs[index].title = newTitle
                            return newSongs
                          })
                          supabase.from('site_content').upsert({ key: song.titleKey, value: newTitle }, { onConflict: 'key' })
                        }
                      }}
                      className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-pink-deep truncate outline-none focus:border-b-2 focus:border-pink-rose"
                    >
                      {song.title.replace(/&#x27;/g, "'")}
                    </h3>
                    <p
                      data-edit-key={isEditMode ? song.artistKey : undefined}
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newArtist = e.currentTarget.textContent || 'Unknown Artist'
                        if (newArtist !== song.artist) {
                          setSongs(prev => {
                            const newSongs = [...prev]
                            newSongs[index].artist = newArtist
                            return newSongs
                          })
                          supabase.from('site_content').upsert({ key: song.artistKey, value: newArtist }, { onConflict: 'key' })
                        }
                      }}
                      className="font-body text-sm sm:text-base lg:text-lg text-pink-hot/80 truncate mt-0.5 sm:mt-1 outline-none focus:border-b-2 focus:border-pink-rose"
                    >
                      {song.artist.replace(/&#x27;/g, "'")}
                    </p>
                  </div>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => togglePlay(index)}
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-rose to-pink-hot flex items-center justify-center text-white shadow-md shadow-pink-rose/40 hover:scale-105 active:scale-95 transition-all touch-active"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                </div>

                {/* Progress Bar & Audio Player */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-body text-[10px] sm:text-xs font-medium text-pink-hot/70 w-8 sm:w-10 text-right">
                    {formatTime(progress)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={progress}
                    onChange={(e) => handleSeek(e, index)}
                    className="flex-1 h-1.5 sm:h-2 bg-pink-soft/40 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:sm:w-4 [&::-webkit-slider-thumb]:sm:h-4 [&::-webkit-slider-thumb]:bg-pink-deep [&::-webkit-slider-thumb]:rounded-full cursor-pointer touch-active"
                    style={{
                      background: `linear-gradient(to right, #e91e8c ${progressPercentage}%, #ffd6e7 ${progressPercentage}%)`
                    }}
                  />
                  <span className="font-body text-[10px] sm:text-xs font-medium text-pink-hot/70 w-8 sm:w-10">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* EditMode Controls */}
                {isEditMode && (
                  <div className="mt-4 p-3 rounded-xl bg-pink-50/80 border border-pink-200 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Paste Spotify Link to auto-fill..."
                        value={spotifyLinks[index] || ''}
                        onChange={(e) => {
                          const newLinks = [...spotifyLinks]
                          newLinks[index] = e.target.value
                          setSpotifyLinks(newLinks)
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-pink-200 text-[10px] sm:text-xs font-body outline-none focus:border-pink-rose"
                      />
                      <button
                        onClick={() => handleSpotifyFetch(index)}
                        disabled={isFetchingSpotify || !spotifyLinks[index]}
                        className="px-4 py-1.5 bg-pink-rose text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-pink-hot transition-colors disabled:opacity-50"
                      >
                        {isFetchingSpotify ? '...' : 'Fetch'}
                      </button>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => audioInputsRef.current[index]?.click()}
                        className="text-[10px] sm:text-xs text-pink-rose font-medium border border-pink-rose rounded-full px-3 py-1 hover:bg-pink-rose hover:text-white transition-colors"
                      >
                        {song.audioUrl ? 'Change MP3 Audio File' : 'Upload MP3 Audio File'}
                      </button>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        ref={el => { audioInputsRef.current[index] = el }} 
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'audio', index)
                        }}
                      />
                    </div>
                  </div>
                )}

                <audio
                  ref={el => { audioRefs.current[index] = el }}
                  src={song.audioUrl}
                  onTimeUpdate={() => handleTimeUpdate(index)}
                  onLoadedMetadata={() => handleLoadedMetadata(index)}
                  onEnded={() => setPlayingIndex(null)}
                  className="hidden"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
