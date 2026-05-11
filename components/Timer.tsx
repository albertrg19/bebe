'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface TimerProps {
  startDate: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Timer({ startDate }: TimerProps) {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const start = new Date(startDate)
    const now = new Date()
    const diffMs = Math.max(now.getTime() - start.getTime(), 0)

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  }, [startDate])

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeLeft])

  const timeUnits: { label: string; value: number }[] = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {timeUnits.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center justify-center w-[72px] h-[80px] sm:w-20 sm:h-24 md:w-24 md:h-28 rounded-2xl bg-white/60 backdrop-blur-sm border border-pink-soft shadow-md shadow-pink-soft/30"
        >
          <span className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-pink-deep leading-none">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="font-body text-[10px] sm:text-xs md:text-sm text-pink-hot/70 mt-1">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  )
}
