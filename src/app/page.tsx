'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  FiArrowRight, FiArrowDown, FiArrowLeft, FiChevronDown
} from 'react-icons/fi'
import {
  PiTreePalm, PiMusicNoteFill, PiLeafFill, PiStarFill
} from 'react-icons/pi'
import { RiMapPin2Line } from 'react-icons/ri'

/* ── UTILS ───────────────────────────────────────────────── */
async function getFiles(folder: string): Promise<string[]> {
  try {
    const r = await fetch(`/api/files?folder=${folder}`)
    const d = await r.json()
    return d.files ?? []
  } catch { return [] }
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const IMG = /\.(png|jpg|jpeg|webp)$/i
const EX  = [0.19, 1, 0.22, 1] as const
const HOME_FEATURED_YOUTUBE_ID = '1RURksGYP-E'

type Edition = {
  key: string
  title: string
  subtitle?: string
  dateKey: string
  dateLabel: string
  time: string
  venue: string
  ticket: string
  cabana: string
  lineUp: string
  flyerKeyword: string
}

const EDITIONS: Edition[] = [
  {
    key: 'easter-bunny',
    title: 'Easter Bunny',
    dateKey: '2026-04-06',
    dateLabel: 'Monday, April 6, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'easter bunny',
  },
  {
    key: 'whistle-fiesta',
    title: 'Whistle',
    subtitle: 'Fiesta',
    dateKey: '2026-04-13',
    dateLabel: 'Monday, April 13, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'whistle fiesta',
  },
  {
    key: 'shots-bundles',
    title: 'Shots &',
    subtitle: 'Bundles',
    dateKey: '2026-04-20',
    dateLabel: 'Monday, April 20, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'shots & bundles',
  },
  {
    key: 'groove-city',
    title: 'Groove City',
    subtitle: 'Grand Theft Auto',
    dateKey: '2026-04-27',
    dateLabel: 'Monday, April 27, 2026',
    time: '9 PM',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'gta_ groove city',
  },
  {
    key: 'groove-a-thon',
    title: 'Groove-A-Thon',
    dateKey: '2026-05-11',
    dateLabel: 'Monday, May 11, 2026',
    time: '9 PM',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in N1K',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'groove-a-thon',
  },
  {
    key: 'gender-switch',
    title: 'Gender Switch',
    subtitle: 'Monday',
    dateKey: '2026-05-18',
    dateLabel: 'Monday, May 18, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Dye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'gender switch',
  },
  {
    key: 'gelato-monday',
    title: 'Gelato',
    subtitle: 'Monday',
    dateKey: '2026-05-25',
    dateLabel: 'Monday, May 25, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Dye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'gelato',
  },
  {
    key: 'After the Storm 2.0',
    title: 'After the Storm',
    subtitle: '2.0',
    dateKey: '2026-06-01',
    dateLabel: 'Monday, June 01, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Dye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'after the storm',
  },
  {
    key: 'Cooperate Monday',
    title: 'Cooperate Monday',
    subtitle: 'Monday',
    dateKey: '2026-06-08',
    dateLabel: 'Monday, June 08, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in #1,000',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Shegszy, DJ Fletzy',
    flyerKeyword: 'cooperate monday',
  },
  {
    key: 'Big Bang Monday',
    title: 'Big Bang Monday',
    subtitle: 'Monday',
    dateKey: '2026-07-13',
    dateLabel: 'Monday, July 13, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Sammie Kiss, DJ Fletzy',
    flyerKeyword: 'big bang monday',
  },
  {
    key: 'the-last-dance',
    title: 'The Last Dance',
    dateKey: '2026-07-20',
    dateLabel: 'Monday, July 20, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'DJ Fletzy, DJ Virtual',
    flyerKeyword: 'the last dance',
  },
  {
    key: 'Lights Out',
    title: 'Lights Out',
    dateKey: '2026-07-27',
    dateLabel: 'Monday, July 27, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'DJ Fletzy, DJ Virtual, Sammie Kiss, Avatar',
    flyerKeyword: 'lights out',
  },
  {
    key: 'back-to-the-groove',
    title: 'Back to the Groove',
    dateKey: '2026-09-28',
    dateLabel: 'Monday, September 28, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Virtual',
    flyerKeyword: 'back to the groove',
  },
  {
    key: 'freedom-and-groove',
    title: 'Freedom & Redemption',
    dateKey: '2026-10-05',
    dateLabel: 'Monday, October 5, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Virtual',
    flyerKeyword: 'freedom',
  },
  {
    key: 'no-rules-monday',
    title: 'No Rules',
    subtitle: 'Monday',
    dateKey: '2026-10-12',
    dateLabel: 'Monday, October 12, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in Free',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Virtual',
    flyerKeyword: 'no rules monday',
  },
  {
    key: 'whistle-fiesta',
    title: 'Whistle',
    subtitle: 'Fiesta',
    dateKey: '2026-10-19',
    dateLabel: 'Monday, October 19, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in ₦1,000',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Virtual, DJ Kaysmart',
    flyerKeyword: 'whistle fiesta',
  },
  {
    key: 'halloween-monday',
    title: 'Halloween',
    subtitle: 'Monday',
    dateKey: '2026-11-02',
    dateLabel: 'Monday, November 2, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: 'Walk in ₦1,000',
    cabana: 'Strictly by Reservation',
    lineUp: 'Avatar, Sammie Kiss, DJ Virtual, DJ Kaysmart',
    flyerKeyword: 'halloween monday',
  },
  {
    key: 'groove-garden-carnival-2026',
    title: 'Groove Garden Carnival 2026',
    dateKey: '2026-11-30',
    dateLabel: 'Monday, November 30, 2026',
    time: '9 PM till Sunrise',
    venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
    ticket: '₦3,000 online · ₦5,000 at the gate',
    cabana: 'Strictly by Reservation',
    lineUp: 'God Over (GOE) & Azzi on the Beat',
    flyerKeyword: 'groove garden carnival 2026',
  },
]

const NEXT_EVENT_PLACEHOLDER: Edition = {
  key: 'next-event-placeholder',
  title: 'Next Event',
  dateKey: '9999-12-31',
  dateLabel: 'To be announced',
  time: 'To be announced',
  venue: 'Champions Cottage, FUOYE Phase 1 Road, Oye-Ekiti',
  ticket: 'To be announced',
  cabana: 'Strictly by Reservation',
  lineUp: 'To be announced',
  flyerKeyword: '',
}

function getLagosDateKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${lookup.year}-${lookup.month}-${lookup.day}`
}

function findFlyerByKeyword(files: string[], keyword: string) {
  if (!keyword) return ''
  return files.find(file => file.toLowerCase().includes(keyword)) || ''
}

function isWhistleFiestaWindow(dateKey: string = getLagosDateKey()) {
  return dateKey >= '2026-10-12' && dateKey <= '2026-10-19'
}

function playWhistleLoop(durationMs = 5000) {
  if (typeof window === 'undefined') return () => {}

  const AudioCtor = window.AudioContext || (window as typeof window & {
    webkitAudioContext?: typeof AudioContext
  }).webkitAudioContext

  if (!AudioCtor) return () => {}

  const ctx = new AudioCtor()
  const master = ctx.createGain()
  master.gain.value = 0.12
  master.connect(ctx.destination)

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined)
  }

  const chirps = [
    [0.05, 1750, 0.16],
    [0.28, 1540, 0.14],
    [0.52, 2050, 0.18],
    [0.82, 1680, 0.16],
    [1.08, 2240, 0.18],
    [1.42, 1820, 0.2],
    [1.82, 2400, 0.22],
    [2.24, 1760, 0.18],
    [2.62, 2100, 0.22],
    [3.08, 1880, 0.18],
    [3.55, 2280, 0.2],
    [4.1, 1700, 0.18],
    [4.5, 2000, 0.18],
  ] as const

  chirps.forEach(([start, pitch, dur]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const peak = ctx.currentTime + start

    osc.type = 'sine'
    osc.frequency.setValueAtTime(pitch, peak)
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, peak + dur)

    gain.gain.setValueAtTime(0.0001, peak)
    gain.gain.exponentialRampToValueAtTime(0.18, peak + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, peak + dur)

    osc.connect(gain)
    gain.connect(master)
    osc.start(peak)
    osc.stop(peak + dur)
  })

  const timeout = window.setTimeout(() => {
    void ctx.close()
  }, durationMs + 100)

  const resumeOnGesture = () => {
    void ctx.resume().catch(() => undefined)
  }

  window.addEventListener('pointerdown', resumeOnGesture, { once: true })
  window.addEventListener('touchstart', resumeOnGesture, { once: true })
  window.addEventListener('keydown', resumeOnGesture, { once: true })

  return () => {
    window.clearTimeout(timeout)
    window.removeEventListener('pointerdown', resumeOnGesture)
    window.removeEventListener('touchstart', resumeOnGesture)
    window.removeEventListener('keydown', resumeOnGesture)
    void ctx.close()
  }
}

function getActiveEdition(files: string[]) {
  const todayKey = getLagosDateKey()
  const activeEdition = EDITIONS.find(edition => edition.dateKey >= todayKey) || NEXT_EVENT_PLACEHOLDER

  return {
    edition: activeEdition,
    flyer: findFlyerByKeyword(files, activeEdition.flyerKeyword),
    isEasterSeason: todayKey <= '2026-04-13',
  }
}

/* ════════════════════════════════════════════════════════════
   SPLASH - fullscreen cinematic entrance
════════════════════════════════════════════════════════════ */
function Splash({ onDone }: { onDone: () => void }) {
  const [banners, setBanners] = useState<string[]>([])
  const [idx, setIdx]         = useState(0)
  const [exit, setExit]       = useState(false)

  useEffect(() => {
    getFiles('banners').then(f => setBanners(f.filter(x => IMG.test(x))))
  }, [])

  useEffect(() => {
    if (!banners.length) { const t = setTimeout(onDone, 600); return () => clearTimeout(t) }
    if (idx < banners.length - 1) {
      const t = setTimeout(() => setIdx(i => i + 1), 2200)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => { setExit(true); setTimeout(onDone, 1000) }, 2200)
      return () => clearTimeout(t)
    }
  }, [idx, banners, onDone])

  return (
    <motion.div
      className="splash"
      animate={{ opacity: exit ? 0 : 1 }}
      transition={{ duration: 1, ease: EX }}
    >
      <AnimatePresence mode="wait">
        {banners[idx] && (
          <motion.div key={banners[idx]} className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 1, ease: EX }}
          >
            <Image src={`/banners/${banners[idx]}`} alt="" fill className="object-contain" priority />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,15,13,0.3), rgba(10,15,13,0.7))' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered logo with glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10"
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: EX, delay: 0.3 }}
      >
        <div className="relative glow-fire"
          style={{ width: 'clamp(260px,36vw,480px)', height: 'clamp(200px,28vw,360px)' }}>
          <Image src="/banners/Groove-Garden-PNG-shadow.png" alt="Groove Garden" fill className="object-contain" priority />
        </div>
      </motion.div>

      {/* Progress lines */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <motion.div key={i} className="h-[2px] overflow-hidden rounded-full"
            animate={{ width: i === idx ? 52 : 16 }}
            transition={{ duration: 0.4, ease: EX }}
            style={{ background: 'rgba(240,235,224,0.15)' }}
          >
            {i === idx && (
              <motion.div className="h-full" style={{ background: 'var(--fire-bright)' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2.2, ease: 'linear' }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Ambient bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 z-20"
        style={{ background: 'linear-gradient(90deg, transparent, var(--fire), var(--fire-hot), var(--fire), transparent)' }} />
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════
   HERO - massive editorial type, no compromise
════════════════════════════════════════════════════════════ */
function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const py   = useTransform(scrollYProgress, [0,1], ['0%', '30%'])
  // Fade only after stats row is fully visible (e.g., after 0.8 scroll progress)
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const isEasterSeason = getLagosDateKey() <= '2026-04-13'

  useEffect(() => {
    const stop = playWhistleLoop()

    const resumeAudio = () => {
      const AudioCtor = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext
      }).webkitAudioContext

      if (!AudioCtor) return

      const ctx = new AudioCtor()
      void ctx.resume().catch(() => undefined)
      void ctx.close()
    }

    window.addEventListener('pointerdown', resumeAudio, { once: true })
    window.addEventListener('touchstart', resumeAudio, { once: true })
    window.addEventListener('keydown', resumeAudio, { once: true })

    return () => {
      stop()
      window.removeEventListener('pointerdown', resumeAudio)
      window.removeEventListener('touchstart', resumeAudio)
      window.removeEventListener('keydown', resumeAudio)
    }
  }, [])

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-end overflow-hidden bg-lines"
      style={{
        paddingTop: '80px',
        background: 'linear-gradient(160deg, #0d2b18 0%, #0a0f0d 40%, #1a0d06 100%)',
        paddingBottom: 'clamp(7rem,12vw,12rem)', // Increased bottom padding to ensure stats row is fully visible
      }}
    >
      {/* Ambient radial glows */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          'radial-gradient(ellipse 70% 60% at 15% 40%, rgba(13,59,26,0.55) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 50% at 85% 60%, rgba(var(--fire-rgb),0.12) 0%, transparent 60%)',
          'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(45,106,79,0.18) 0%, transparent 60%)',
        ].join(','),
      }} />

      {isEasterSeason && (
        <>
          <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none opacity-80"
            style={{
              background: 'repeating-linear-gradient(90deg, rgba(255,209,102,0.9) 0 16px, transparent 16px 54px, rgba(255,200,221,0.8) 54px 70px, transparent 70px 108px, rgba(144,224,239,0.85) 108px 124px, transparent 124px 162px)',
              clipPath: 'polygon(0 0,100% 0,100% 40%,96% 52%,92% 40%,88% 52%,84% 40%,80% 52%,76% 40%,72% 52%,68% 40%,64% 52%,60% 40%,56% 52%,52% 40%,48% 52%,44% 40%,40% 52%,36% 40%,32% 52%,28% 40%,24% 52%,20% 40%,16% 52%,12% 40%,8% 52%,4% 40%,0 52%)',
            }} />
          <div className="absolute top-[18%] left-[clamp(1rem,4vw,4rem)] w-[clamp(52px,6vw,76px)] h-[clamp(72px,8vw,104px)] rounded-[50%]"
            style={{
              background: 'linear-gradient(180deg, #ffd166 0%, #ff9f1c 100%)',
              boxShadow: '0 18px 40px rgba(255, 209, 102, 0.18)',
              transform: 'rotate(-18deg)',
              border: '2px solid rgba(255,255,255,0.14)',
            }} />
          <div className="absolute top-[20%] left-[clamp(1.8rem,6vw,5rem)] w-[clamp(16px,1.8vw,22px)] h-[clamp(16px,1.8vw,22px)] rounded-full"
            style={{ background: 'rgba(255,255,255,0.16)' }} />
          <div className="absolute top-[14%] right-[clamp(1rem,5vw,5rem)] flex gap-2 opacity-90">
            <div style={{
              width: 'clamp(22px,2.3vw,30px)',
              height: 'clamp(64px,7vw,92px)',
              background: 'linear-gradient(180deg, #ffe5ec 0%, #ffc2d1 100%)',
              borderRadius: '999px 999px 20px 20px',
              transform: 'rotate(-12deg)',
              border: '2px solid rgba(255,255,255,0.16)',
            }} />
            <div style={{
              width: 'clamp(22px,2.3vw,30px)',
              height: 'clamp(64px,7vw,92px)',
              background: 'linear-gradient(180deg, #e0fbfc 0%, #98f5e1 100%)',
              borderRadius: '999px 999px 20px 20px',
              transform: 'rotate(12deg)',
              border: '2px solid rgba(255,255,255,0.16)',
            }} />
          </div>
          <div className="absolute bottom-[24%] right-[clamp(1rem,6vw,6rem)] w-[clamp(44px,5vw,66px)] h-[clamp(60px,7vw,90px)] rounded-[50%] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #caf0f8 0%, #90e0ef 100%)',
              transform: 'rotate(14deg)',
              border: '2px solid rgba(255,255,255,0.14)',
              boxShadow: '0 14px 32px rgba(144,224,239,0.16)',
            }} />
          <div className="absolute bottom-[23%] right-[clamp(1.8rem,7.4vw,7.3rem)] w-[12px] h-[12px] rounded-full pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.18)' }} />
          <div className="absolute bottom-[34%] left-[clamp(1.2rem,7vw,7rem)] pointer-events-none"
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '0.58rem',
              letterSpacing: '0.22em',
              color: 'rgba(255,240,245,0.55)',
              textTransform: 'uppercase',
              transform: 'rotate(-8deg)',
            }}>
            Easter Mode
          </div>
        </>
      )}

      {/* Dot grid texture */}
      <div className="absolute inset-0 pointer-events-none bg-dots" style={{ opacity: 0.5 }} />

      {/* Vertical fire line left */}
      <div className="absolute left-[clamp(1.5rem,6vw,7rem)] top-0 bottom-0 w-[1px] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(var(--fire-rgb),0.35) 40%, rgba(var(--fire-rgb),0.6) 60%, transparent 90%)' }} />

      {/* Parallax content */}
      <motion.div style={{ y: py, opacity: fade }} className="relative z-10 w-full pb-[clamp(4rem,8vw,8rem)]">
        <div className="wrap">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity:0, x:-20 }}
            animate={{ opacity:1, x:0 }}
            transition={{ duration:0.9, ease:EX, delay:0.15 }}
            className="eyebrow"
            style={{ marginBottom:'3rem' }}
          >
            <RiMapPin2Line size={11}/>
            FUOYE, Oye-Ekiti · Ekiti State
          </motion.div>

          {/* GROOVE */}
          <div className="overflow-hidden" style={{ marginBottom: '-0.05em' }}>
            <motion.h1 className="t-hero"
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease: EX, delay: 0.2 }}
            >
              GROOVE
            </motion.h1>
          </div>

          {/* GARDEN - italic, fire-colored, bleeds right */}
          <div className="overflow-hidden" style={{ marginBottom: '3.5rem' }}>
            <motion.h1 className="t-hero-italic t-fire"
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease: EX, delay: 0.32 }}
              style={{ paddingLeft: 'clamp(1.5rem, 8vw, 10rem)' }}
            >
              Garden
            </motion.h1>
          </div>

          {/* Bottom row: description + CTAs */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.9, ease:EX, delay:0.55 }}
              style={{ maxWidth: '400px' }}
            >
              <div className="div-fire" style={{ marginBottom:'1.5rem' }} />
              <p className="t-body" style={{ fontSize: 'clamp(0.95rem,1.3vw,1.1rem)' }}>
                FUOYE&apos;s premier entertainment destination, known for hosting unforgettable Monday nights.<br/>
                Mondays here are the heartbeat of the campus.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.9, ease:EX, delay:0.7 }}
              className="flex flex-col sm:flex-row gap-4 flex-shrink-0"
            >
              <Link href="/past-events" className="btn btn-fire">
                <span>Explore Events</span><FiArrowRight size={13}/>
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Book a Table
              </Link>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity:0, y:24 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.9, ease:EX, delay:0.9 }}
            className="flex flex-wrap gap-12 mb-16 pt-12"
            style={{ borderTop: '1px solid rgba(240,235,224,0.07)' }}
          >
            {[
              { num:'100+', label:'Events Hosted' },
              { num:'1K+',  label:'Grooves Attended' },
              { num:'Every', label:'Monday Night' },
              { num:'∞',    label:'Memories Made' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="stat-num">{num}</p>
                <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.57rem', letterSpacing:'0.2em', color:'var(--cream-40)', marginTop:'6px' }}>
                  {label.toUpperCase()}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:1.5, duration:1 }}
        className="absolute right-[clamp(1.5rem,6vw,7rem)] bottom-12 flex flex-col items-center gap-3 z-10"
      >
        <motion.div animate={{ y:[0,10,0] }} transition={{ repeat:Infinity, duration:1.8, ease:'easeInOut' }}
          style={{ color:'var(--fire)' }}>
          <FiArrowDown size={18}/>
        </motion.div>
        <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.52rem', letterSpacing:'0.25em', color:'var(--cream-40)', writingMode:'vertical-rl', textTransform:'uppercase' }}>
          Scroll to explore
        </p>
      </motion.div>

      {/* Bottom fire line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background:'linear-gradient(90deg, transparent, var(--fire-hot), var(--fire), transparent)' }} />
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   MARQUEE
════════════════════════════════════════════════════════════ */
function Marquee() {
  const items = ['GROOVE TILL SUNRISE','NO MONDAY WITHOUT GROOVE','OYE-EKITI','FEEL THE MUSIC','DANCE ALL NIGHT','GROOVE GARDEN','EVERY MONDAY']
  const all   = [...items,...items]
  return (
    <div className="relative overflow-hidden py-[18px] -mt-6"
      style={{ background:'var(--fire)', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
      <div className="mq-track">
        {all.map((t,i) => (
          <span key={i} className="flex items-center gap-5 pr-10"
            style={{ fontFamily:'var(--f-sans)', fontWeight:700, fontSize:'0.7rem', letterSpacing:'0.22em', color:'var(--bg-base)', whiteSpace:'nowrap' }}>
            {t} <PiMusicNoteFill size={10} style={{ opacity:0.45, flexShrink:0 }}/>
          </span>
        ))}
      </div>
    </div>
  )
}

function WhyGrooveGarden() {
  const points = [
    'Biggest Monday crowd in FUOYE',
    'Premium outdoor clubbing experience',
    'Consistent weekly vibes',
  ]

  return (
    <section className="sec" style={{
      background: 'linear-gradient(160deg, #0a0f0d 0%, #0d1e12 55%, #130e08 100%)',
      borderTop: '1px solid rgba(240,235,224,0.05)',
      borderBottom: '1px solid rgba(240,235,224,0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          'radial-gradient(ellipse 55% 70% at 15% 40%, rgba(13,59,26,0.28) 0%, transparent 70%)',
          'radial-gradient(ellipse 45% 55% at 85% 60%, rgba(var(--fire-rgb),0.08) 0%, transparent 65%)',
        ].join(','),
      }} />

      <div className="wrap relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity:0, y:30 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, margin:'-80px' }}
            transition={{ duration:0.8, ease:EX }}
          >
            <div className="eyebrow"><PiTreePalm size={10}/>Why Groove Garden?</div>
            <h2 className="t-section" style={{ color:'var(--cream)' }}>
              The Home Of<br/>
              <span className="t-section-italic t-fire">Monday Nights</span>
            </h2>
            <span className="div-fire"/>
            <p className="t-body" style={{ marginTop:'1.5rem', maxWidth:'28rem' }}>
              Built for the crowd that wants the energy to feel full, open-air, and worth showing up for every single week.
            </p>
          </motion.div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            {points.map((point, i) => (
              <motion.div
                key={point}
                className="photo-luxury"
                initial={{ opacity:0, y:36 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, margin:'-60px' }}
                transition={{ duration:0.7, ease:EX, delay:i * 0.08 }}
                style={{
                  padding: '1.6rem 1.35rem',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(180deg, rgba(18,28,21,0.92) 0%, rgba(10,15,13,0.98) 100%)',
                }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(var(--fire-rgb),0.35)',
                  color: 'var(--fire-bright)',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                }}>
                  0{i + 1}
                </div>

                <p style={{
                  fontFamily: 'var(--f-display)',
                  fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
                  lineHeight: 1.15,
                  color: 'var(--cream)',
                }}>
                  {point}
                </p>

                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, var(--fire), transparent)',
                  opacity: 0.7,
                }} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   EVENTS SECTION - Styled photo gallery with frames
════════════════════════════════════════════════════════════ */

// Frame configs for visual variety
const FRAME_CONFIGS = [
  // [frameClass, tiltClass, aspectRatio, colSpan, rowSpan]
  { frame:'photo-luxury',   tilt:'',          aspect:'65%',  col:'md:col-span-7', row:'row-span-2', zIndex: 2 },
  { frame:'photo-polaroid', tilt:'tilt-r',    aspect:'80%',  col:'md:col-span-5', row:'',           zIndex: 3 },
  { frame:'photo-film',     tilt:'tilt-sm-l', aspect:'75%',  col:'md:col-span-5', row:'',           zIndex: 1 },
  { frame:'photo-torn',     tilt:'tilt-sm-r', aspect:'100%', col:'md:col-span-4', row:'',           zIndex: 2 },
  { frame:'photo-luxury',   tilt:'tilt-l',    aspect:'75%',  col:'md:col-span-4', row:'',           zIndex: 3 },
  { frame:'photo-polaroid', tilt:'',          aspect:'85%',  col:'md:col-span-4', row:'',           zIndex: 1 },
  { frame:'photo-film',     tilt:'tilt-r',    aspect:'70%',  col:'md:col-span-6', row:'',           zIndex: 2 },
  { frame:'photo-torn',     tilt:'tilt-sm-l', aspect:'75%',  col:'md:col-span-6', row:'',           zIndex: 3 },
]

function EventsGallery({ images }: { images: string[] }) {
  const preview = images.slice(0, 8)

  return (
    <section className="sec" style={{ background:'var(--bg-mid)', position:'relative', overflow:'hidden' }}>
      {/* BG texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(13,59,26,0.2) 0%, transparent 65%)',
      }}/>

      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div>
            <div className="eyebrow"><PiLeafFill size={10}/>The Archive</div>
            <h2 className="t-section" style={{ color:'var(--cream)' }}>
              Nights We<br/>
              <span className="t-section-italic t-fire">Lived</span>
            </h2>
            <span className="div-fire"/>
          </div>
          <Link href="/gallery" className="btn btn-fire-outline flex-shrink-0 self-start md:self-auto" style={{ marginBottom:'0.5rem' }}>
            Full Gallery <FiArrowRight size={12}/>
          </Link>
        </div>

        {/* Photo grid - styled frames */}
        {preview.length > 0 ? (
          <div className="grid grid-cols-12 gap-6 md:gap-8" style={{ gridAutoRows: '220px', alignItems: 'start' }}>
            {preview.map((file, i) => {
              const cfg = FRAME_CONFIGS[i % FRAME_CONFIGS.length]
              return (
                <motion.div
                  key={file}
                  className={`${cfg.col} ${cfg.row} card-hover ${cfg.frame} ${cfg.tilt} col-span-12`}
                  style={{ zIndex: cfg.zIndex }}
                  initial={{ opacity:0, y:48, rotate: cfg.tilt.includes('r') ? 3 : cfg.tilt.includes('l') ? -3 : 0 }}
                  whileInView={{ opacity:1, y:0, rotate: cfg.tilt.includes('r') ? (cfg.tilt.includes('sm') ? 1.4 : 2) : cfg.tilt.includes('l') ? (cfg.tilt.includes('sm') ? -1.2 : -2.5) : 0 }}
                  viewport={{ once:true, margin:'-80px' }}
                  transition={{ duration:0.85, ease:EX, delay: i * 0.08 }}
                  whileHover={{ scale:1.04, rotate:0, zIndex:10, transition:{ duration:0.5, ease:EX } }}
                >
                  <div className="relative w-full" style={{ paddingBottom: cfg.aspect, overflow:'hidden' }}>
                    <Image
                      src={`/past-events/${file}`}
                      alt={`Groove Garden event ${i+1}`}
                      fill className="object-cover"
                      sizes="(max-width:768px)100vw,50vw"
                    />
                    <div className="ov-bottom"/>
                    {/* Photo number badge */}
                    <div className="absolute bottom-3 right-3"
                      style={{ fontFamily:'var(--f-mono)', fontSize:'0.52rem', letterSpacing:'0.15em', color:'rgba(240,235,224,0.5)', background:'rgba(10,15,13,0.7)', padding:'3px 8px', backdropFilter:'blur(4px)' }}>
                      {String(i+1).padStart(2,'0')}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.65rem', color:'var(--cream-15)', letterSpacing:'0.2em' }}>
              ADD PHOTOS TO /public/past-events
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   FLYERS CAROUSEL - editorial horizontal scroll
════════════════════════════════════════════════════════════ */
function FlyersCarousel({ flyers }: { flyers: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (d: 1|-1) => ref.current?.scrollBy({ left: d*300, behavior:'smooth' })

  return (
    <section className="sec" style={{
      background:'linear-gradient(160deg, #0a0f0d 0%, #0d1e12 50%, #0a0f0d 100%)',
      borderTop:'1px solid rgba(240,235,224,0.05)',
      borderBottom:'1px solid rgba(240,235,224,0.05)',
      overflow:'hidden',
      position:'relative',
    }}>
      {/* Left/right fade */}
      <div className="absolute left-0 top-0 bottom-0 w-[clamp(60px,8vw,120px)] z-10 pointer-events-none"
        style={{ background:'linear-gradient(to right, #0a0f0d, transparent)' }}/>
      <div className="absolute right-0 top-0 bottom-0 w-[clamp(60px,8vw,120px)] z-10 pointer-events-none"
        style={{ background:'linear-gradient(to left, #0a0f0d, transparent)' }}/>

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 60% 80% at 80% 40%, rgba(var(--fire-rgb),0.06) 0%, transparent 65%)' }}/>

      <div className="wrap">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <div className="eyebrow"><PiTreePalm size={11}/>Archive</div>
            <h2 className="t-section" style={{ color:'var(--cream)' }}>
              Past<br/>
              <span className="t-section-italic t-fire">Editions</span>
            </h2>
            <span className="div-fire"/>
          </div>
          <div className="flex gap-3 mb-2">
            {([
              { d: -1, I: <FiArrowLeft size={15}/> },
              { d: 1, I: <FiArrowRight size={15}/> },
            ] as const).map(({d,I},i)=>(
              <button key={i} onClick={()=>scroll(d)}
                className="w-12 h-12 flex items-center justify-center transition-all duration-300"
                style={{ border:'1px solid rgba(var(--fire-rgb),0.25)', color:'var(--cream-40)', background:'transparent', cursor:'none' }}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='var(--fire)';el.style.color='var(--bg-base)';el.style.borderColor='var(--fire)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='transparent';el.style.color='var(--cream-40)';el.style.borderColor='rgba(var(--fire-rgb),0.25)'}}
              >{I}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll track - full bleed */}
      <div ref={ref} className="sx flex gap-5 pb-4"
        style={{ paddingLeft:'clamp(1.5rem,6vw,7rem)', paddingRight:'clamp(1.5rem,6vw,7rem)' }}>
        {flyers.map((file, i) => {
          // Alternate frame styles
          const frames = ['photo-luxury','photo-polaroid','photo-film','photo-torn']
          const tilts  = ['tilt-sm-r','','tilt-sm-l','tilt-r','tilt-l','']
          return (
            <motion.div key={file}
              className={`flex-shrink-0 card-hover ${frames[i%frames.length]} ${tilts[i%tilts.length]}`}
              style={{ width:'clamp(200px,18vw,260px)' }}
              initial={{ opacity:0, x:40 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true, margin:'-40px' }}
              transition={{ duration:0.7, ease:EX, delay:Math.min(i*0.07,0.5) }}
              whileHover={{ scale:1.05, rotate:0, y:-8, zIndex:10, transition:{ duration:0.5, ease:EX }}}
            >
              <div className="relative" style={{ paddingBottom:'138%', overflow:'hidden' }}>
                <Image src={`/main-past-flyers/${file}`} alt={`Flyer ${i+1}`} fill className="object-cover" sizes="260px"/>
                <div className="ov-bottom"/>
                <div className="absolute bottom-3 left-3"
                  style={{ fontFamily:'var(--f-mono)', fontSize:'0.5rem', letterSpacing:'0.12em', color:'rgba(240,235,224,0.45)' }}>
                  #{String(i+1).padStart(2,'0')}
                </div>
              </div>
            </motion.div>
          )
        })}
        {flyers.length===0 && (
          <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.65rem', color:'var(--cream-15)', letterSpacing:'0.2em', padding:'4rem 0' }}>
            ADD FLYERS TO /public/main-past-flyers
          </p>
        )}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   VIDEO SECTION - immersive cinema cards
════════════════════════════════════════════════════════════ */
function VideoSection() {
  return (
    <section className="sec" style={{ background:'var(--bg-mid)', position:'relative', overflow:'hidden' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 70% 60% at 85% 30%, rgba(45,106,79,0.12) 0%, transparent 65%)' }}/>

      <div className="wrap">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="eyebrow"><PiMusicNoteFill size={10}/>Raw Energy</div>
            <h2 className="t-section" style={{ color:'var(--cream)' }}>
              Feel The<br/>
              <span className="t-section-italic t-fire">Energy</span>
            </h2>
            <span className="div-fire"/>
          </div>
          <Link href="/gallery" className="btn btn-fire-outline flex-shrink-0 self-start md:self-auto" style={{ marginBottom:'0.5rem' }}>
            Watch More <FiArrowRight size={12}/>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <motion.div
            className="card-hover photo-luxury"
            style={{ position:'relative', paddingBottom: '42%', cursor:'none' }}
            initial={{ opacity:0, y:40 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, margin:'-60px' }}
            transition={{ duration:0.8, ease:EX }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${HOME_FEATURED_YOUTUBE_ID}?controls=1&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              title="Groove Garden featured YouTube video"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ border: 'none' }}
            />

            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 z-10"
              style={{ background:'var(--fire)', backdropFilter:'blur(8px)' }}>
              <span style={{ fontFamily:'var(--f-mono)', fontSize:'0.48rem', letterSpacing:'0.15em', color:'var(--bg-base)', fontWeight:600 }}>
                YOUTUBE
              </span>
            </div>

            <div className="ov-bottom"/>
            <div className="absolute bottom-4 left-5"
              style={{ fontFamily:'var(--f-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', color:'var(--cream-40)' }}>
              ANNIVERSARY RECAP
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   UPCOMING EVENT - luxury split layout
════════════════════════════════════════════════════════════ */
// function UpcomingEvent({ flyer }: { flyer: string }) {
//   return (
//     <section className="sec" style={{
//       background:'linear-gradient(160deg, #130e08 0%, #0a0f0d 40%, #0d2b18 100%)',
//       borderTop:'1px solid rgba(240,235,224,0.05)',
//     }}>
//       <div className="wrap">
//         <div className="text-center mb-20">
//           <div className="eyebrow justify-center" style={{ justifyContent:'center' }}>
//             <PiTreePalm size={11}/> What&apos;s Coming <PiTreePalm size={11}/>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">

//           {/* Flyer - framed with luxury border + angled glow */}
//           <motion.div
//             className="relative"
//             initial={{ opacity:0, x:-50, rotate:-2 }}
//             whileInView={{ opacity:1, x:0, rotate:-1.5 }}
//             viewport={{ once:true, margin:'-80px' }}
//             transition={{ duration:1, ease:EX }}
//             whileHover={{ rotate:0, scale:1.02, transition:{ duration:0.5, ease:EX } }}
//           >
//             <div className="photo-luxury" style={{ position:'relative' }}>
//               <div style={{ paddingBottom:'128%', position:'relative', overflow:'hidden' }}>
//                 {flyer ? (
//                   <Image src={`/past-flyers/${flyer}`} alt="Upcoming Event" fill className="object-cover"/>
//                 ) : (
//                   <div className="absolute inset-0 flex items-center justify-center"
//                     style={{ background:'var(--bg-raised)' }}>
//                     <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.6rem', color:'var(--fire-bright)', letterSpacing:'0.2em' }}>
//                       FLYER DROPPING SOON
//                     </p>
//                   </div>
//                 )}
//                 <div className="ov-bottom"/>
//               </div>
//             </div>

//             {/* Glow behind flyer */}
//             <div className="absolute -inset-8 -z-10 rounded-full pointer-events-none"
//               style={{ background:'radial-gradient(ellipse at center, rgba(var(--fire-rgb),0.15) 0%, transparent 70%)', filter:'blur(20px)' }}/>

//             {/* UPCOMING badge */}
//             <div className="absolute -top-4 -right-4 px-5 py-2"
//               style={{ background:'var(--g-fire)', fontFamily:'var(--f-sans)', fontWeight:700, fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--bg-base)', boxShadow:'0 8px 32px rgba(var(--fire-rgb),0.4)' }}>
//               UPCOMING
//             </div>
//           </motion.div>

//           {/* Info */}
//           <motion.div
//             initial={{ opacity:0, x:40 }}
//             whileInView={{ opacity:1, x:0 }}
//             viewport={{ once:true, margin:'-80px' }}
//             transition={{ duration:0.9, ease:EX, delay:0.15 }}
//           >
//             <h2 className="t-section" style={{ color:'var(--cream)', marginBottom:'0.25rem' }}>
//               Groove Till
//             </h2>
//             <h2 className="t-section-italic t-fire glow-fire" style={{ marginBottom:'0.5rem' }}>
//               Sunrise
//             </h2>
//             <span className="div-fire" style={{ marginBottom:'3rem' }}/>

//             <div className="flex flex-col gap-6 mb-12">
//               {[
//                 { icon:<RiMapPin2Line size={14}/>, label:'Venue',   val:'Groove Garden, FUOYE – Oye-Ekiti' },
//                 { icon:<PiStarFill    size={12}/>, label:'Date',    val:'TBA - Stay Tuned' },
//                 { icon:<PiMusicNoteFill size={12}/>, label:'Time',  val:'10 PM till Sunrise' },
//                 { icon:<PiLeafFill    size={12}/>, label:'Dress',   val:'Turn Up Ready' },
//               ].map(({ icon, label, val }, i) => (
//                 <motion.div key={label}
//                   initial={{ opacity:0, x:20 }}
//                   whileInView={{ opacity:1, x:0 }}
//                   viewport={{ once:true }}
//                   transition={{ duration:0.5, ease:EX, delay:0.25+i*0.08 }}
//                   className="flex items-start gap-5 pb-5"
//                   style={{ borderBottom:'1px solid rgba(240,235,224,0.06)' }}
//                 >
//                   <div className="flex-shrink-0 mt-1" style={{ color:'var(--fire-bright)' }}>{icon}</div>
//                   <div>
//                     <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.55rem', letterSpacing:'0.22em', color:'rgba(var(--fire-rgb),0.6)', marginBottom:'5px' }}>
//                       {label.toUpperCase()}
//                     </p>
//                     <p style={{ fontFamily:'var(--f-display)', fontWeight:300, fontSize:'1rem', color:'var(--cream)' }}>
//                       {val}
//                     </p>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4">
//               <Link href="/contact" className="btn btn-fire">
//                 <span>Reserve a Spot</span><FiArrowRight size={13}/>
//               </Link>
//               <Link href="/past-events" className="btn btn-outline">
//                 View Archive
//               </Link>
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </section>
//   )
// }

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
type TicketCheckoutSettings = {
  enabled: boolean
  eventName: string
  eventDate: string
  eventTime: string
  ticketPriceNaira: number | null
  maxTickets: number
}

type TicketConfirmation = {
  ticketCode: string
  downloadUrl: string
}

function formatTicketEventDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString('en-NG', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
}

function TicketPurchase() {
  const [settings, setSettings] = useState<TicketCheckoutSettings | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [quantityMenuOpen, setQuantityMenuOpen] = useState(false)
  const [activeQuantity, setActiveQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pendingReference, setPendingReference] = useState('')
  const paymentCheckRef = useRef<string | null>(null)
  const quantityPickerRef = useRef<HTMLDivElement | null>(null)
  const quantityTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [tickets, setTickets] = useState<TicketConfirmation[]>([])
  const [emailSent, setEmailSent] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)
  const [ticketsDownloadBusy, setTicketsDownloadBusy] = useState(false)
  const [emailToast, setEmailToast] = useState<{ message: string; tone: 'success' | 'warning' } | null>(null)
  const [error, setError] = useState('')

  async function downloadAllTickets() {
    setTicketsDownloadBusy(true)
    try {
      for (const [index, ticket] of tickets.entries()) {
        if (index > 0) {
          await new Promise(resolve => window.setTimeout(resolve, 450))
        }
        const link = document.createElement('a')
        link.href = ticket.downloadUrl
        link.download = `groove-garden-ticket-${ticket.ticketCode}.png`
        document.body.append(link)
        link.click()
        link.remove()
      }
    } finally {
      setTicketsDownloadBusy(false)
    }
  }

  useEffect(() => {
    setModalRoot(document.body)
  }, [])

  useEffect(() => {
    fetch('/api/tickets/config', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Ticket sales status could not be loaded.')
        const result: unknown = await response.json()
        if (
          !result ||
          typeof result !== 'object' ||
          typeof (result as TicketCheckoutSettings).enabled !== 'boolean' ||
          typeof (result as TicketCheckoutSettings).eventName !== 'string' ||
          typeof (result as TicketCheckoutSettings).eventDate !== 'string' ||
          typeof (result as TicketCheckoutSettings).eventTime !== 'string' ||
          !(
            (result as TicketCheckoutSettings).ticketPriceNaira === null ||
            typeof (result as TicketCheckoutSettings).ticketPriceNaira === 'number'
          ) ||
          !Number.isInteger((result as TicketCheckoutSettings).maxTickets) ||
          (result as TicketCheckoutSettings).maxTickets < 1 ||
          (result as TicketCheckoutSettings).maxTickets > 5
        ) {
          throw new Error('Ticket sales status response was invalid.')
        }
        setSettings(result as TicketCheckoutSettings)
      })
      .catch(() => setError('Ticket sales status could not be loaded. Please try again later.'))
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) setIsOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, isBusy])

  useEffect(() => {
    if (!quantityMenuOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !quantityPickerRef.current?.contains(event.target)) {
        setQuantityMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [quantityMenuOpen])

  useEffect(() => {
    if (!emailToast) return
    const timeout = window.setTimeout(() => setEmailToast(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [emailToast])

  const total = (settings?.ticketPriceNaira ?? 0) * quantity
  const quantityOptions = Array.from({ length: settings?.maxTickets ?? 0 }, (_, index) => index + 1)

  const handleQuantityKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!quantityMenuOpen) {
        setActiveQuantity(quantity)
        setQuantityMenuOpen(true)
        return
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const currentIndex = quantityOptions.indexOf(activeQuantity)
      const nextIndex = (currentIndex + direction + quantityOptions.length) % quantityOptions.length
      setActiveQuantity(quantityOptions[nextIndex])
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      if (!quantityMenuOpen) setQuantityMenuOpen(true)
      setActiveQuantity(event.key === 'Home' ? quantityOptions[0] : quantityOptions[quantityOptions.length - 1])
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (quantityMenuOpen) {
        setQuantity(activeQuantity)
        setQuantityMenuOpen(false)
      } else {
        setActiveQuantity(quantity)
        setQuantityMenuOpen(true)
      }
      return
    }

    if (event.key === 'Escape' && quantityMenuOpen) {
      event.preventDefault()
      event.stopPropagation()
      setQuantityMenuOpen(false)
    }
  }

  const deliverTicketEmail = async (reference: string) => {
    setEmailBusy(true)
    try {
      const response = await fetch('/api/tickets/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
        signal: AbortSignal.timeout(45_000),
      })
      const result = await response.json() as { ok?: unknown; emailSent?: unknown; error?: unknown }
      if (!response.ok || result.ok !== true) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Ticket email delivery is pending.')
      }

      const wasEmailSent = result.emailSent === true
      setEmailSent(wasEmailSent)
      setEmailToast({
        tone: wasEmailSent ? 'success' : 'warning',
        message: wasEmailSent
          ? `Payment confirmed. Your ticket was sent to ${email}. Check your inbox and spam folder.`
          : 'Payment confirmed. Ticket delivery is being completed; check your inbox and spam folder, then retry email delivery if it has not arrived.',
      })
    } catch {
      setEmailSent(false)
      setEmailToast({
        tone: 'warning',
        message: 'Payment is confirmed, but ticket email delivery is still pending. Check your inbox and spam folder, then retry email delivery below.',
      })
    } finally {
      setEmailBusy(false)
    }
  }

  const confirmPayment = async (reference: string) => {
    if (paymentCheckRef.current === reference) return
    paymentCheckRef.current = reference
    setPendingReference(reference)
    setIsBusy(true)
    setError('')
    try {
      const maxAttempts = 7
      let transientFailures = 0
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let response: Response
        let result: {
          ok?: unknown
          status?: unknown
          error?: unknown
          tickets?: unknown
        }
        try {
          response = await fetch('/api/tickets/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
            signal: AbortSignal.timeout(30_000),
          })
          result = await response.json() as typeof result
        } catch (requestError) {
          transientFailures += 1
          if (transientFailures >= 2 || attempt === maxAttempts - 1) throw requestError
          await new Promise(resolve => window.setTimeout(resolve, Math.min(1500 * (attempt + 1), 5000)))
          continue
        }

        if (result.status === 'failed') {
          setPendingReference('')
          setError('Paystack confirmed that this payment did not complete. No ticket was issued. You can try checkout again.')
          return
        }
        if (result.status === 'pending' && response.status === 202) {
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => window.setTimeout(resolve, Math.min(1500 * (attempt + 1), 5000)))
            continue
          }
          setError('Paystack is still confirming this payment. No ticket has been issued yet. Do not pay again; use “Check payment again” shortly.')
          return
        }
        if (!response.ok || result.ok !== true || result.status !== 'paid') {
          if (response.status >= 500 && attempt < maxAttempts - 1 && transientFailures < 1) {
            transientFailures += 1
            await new Promise(resolve => window.setTimeout(resolve, Math.min(1500 * (attempt + 1), 5000)))
            continue
          }
          throw new Error(typeof result.error === 'string' ? result.error : 'Payment verification failed. You can safely check again; tickets are issued only after Paystack confirms payment.')
        }
        if (
          !Array.isArray(result.tickets) ||
          !result.tickets.every(ticket =>
            ticket &&
            typeof ticket === 'object' &&
            typeof (ticket as { ticketCode?: unknown }).ticketCode === 'string' &&
            typeof (ticket as { downloadUrl?: unknown }).downloadUrl === 'string'
          )
        ) {
          throw new Error('Payment was confirmed, but ticket details could not be loaded. Please check payment again.')
        }
        setTickets(result.tickets as TicketConfirmation[])
        setEmailSent(false)
        setEmailToast({
          tone: 'success',
          message: `Payment confirmed. Your ticket is being emailed to ${email}; check your inbox and spam folder.`,
        })
        void deliverTicketEmail(reference)
        return
      }
    } catch (verificationError) {
      const message = verificationError instanceof Error ? verificationError.message : ''
      setError(
        /timeout|timed out|network|fetch|abort/i.test(message)
          ? 'We could not reach Paystack to confirm the final status. No ticket is issued until payment is confirmed. Use “Check payment again” before starting another checkout.'
          : message || 'Payment verification is taking longer than expected. Check payment again before starting another checkout.',
      )
    } finally {
      paymentCheckRef.current = null
      setIsBusy(false)
    }
  }

  const startCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settings?.enabled) return

    setIsBusy(true)
    setError('')
    try {
      const response = await fetch('/api/tickets/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, email, phone, quantity }),
      })
      const order = await response.json() as {
        reference?: unknown
        publicKey?: unknown
        amountKobo?: unknown
        error?: unknown
      }
      if (!response.ok) {
        throw new Error(typeof order.error === 'string' ? order.error : 'Could not start checkout.')
      }
      if (
        typeof order.reference !== 'string' ||
        typeof order.publicKey !== 'string' ||
        typeof order.amountKobo !== 'number'
      ) {
        throw new Error('Checkout could not be initialized. Please try again.')
      }

      const paymentReference = order.reference
      setPendingReference(paymentReference)
      const { default: PaystackPop } = await import('@paystack/inline-js')
      const paystack = new PaystackPop()
      paystack.newTransaction({
        key: order.publicKey,
        email,
        phone,
        amount: order.amountKobo,
        currency: 'NGN',
        reference: paymentReference,
        firstName: name.trim().split(/\s+/)[0],
        lastName: name.trim().split(/\s+/).slice(1).join(' '),
        onSuccess: () => { void confirmPayment(paymentReference) },
        onCancel: () => {
          setError('Checking Paystack for the final payment status…')
          void confirmPayment(paymentReference)
        },
        onError: paymentError => {
          setError(paymentError.message || 'Checking Paystack for the final payment status…')
          void confirmPayment(paymentReference)
        },
      })
    } catch (checkoutError) {
      setIsBusy(false)
      setError(checkoutError instanceof Error ? checkoutError.message : 'Could not start checkout.')
    }
  }

  return (
    <>
      <AnimatePresence>
        {emailToast && (
          <motion.div
            className={`ticket-toast ticket-toast-${emailToast.tone}`}
            role={emailToast.tone === 'success' ? 'status' : 'alert'}
            aria-live={emailToast.tone === 'success' ? 'polite' : 'assertive'}
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <span className="ticket-toast-mark">{emailToast.tone === 'success' ? '✓' : '!'}</span>
            <span>{emailToast.message}</span>
            <button type="button" onClick={() => setEmailToast(null)} aria-label="Dismiss notification">×</button>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" className="btn btn-fire" onClick={() => {
        if (tickets.length) {
          setTickets([])
          setEmailSent(false)
          setPendingReference('')
        }
        setError('')
        setIsOpen(true)
      }}>
        <span>Get Tickets</span><FiArrowRight size={13}/>
      </button>

      {modalRoot && createPortal(
        <AnimatePresence>
          {isOpen && (
          <motion.div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={event => {
              if (event.target === event.currentTarget && !isBusy) setIsOpen(false)
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ticket-dialog-title"
              className="ticket-dialog-panel w-full max-w-lg max-h-[90vh] overflow-y-auto"
              initial={{ y: 24, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
            >
              <div className="ticket-dialog-heading">
                <div className="ticket-dialog-brand">
                  <span className="ticket-dialog-brand-mark"><PiStarFill size={13}/></span>
                  <span>GROOVE GARDEN <i/> SECURE CHECKOUT</span>
                </div>
                <button type="button" className="ticket-dialog-close" onClick={() => setIsOpen(false)} disabled={isBusy} aria-label="Close ticket dialog">
                  ×
                </button>
                <h2 id="ticket-dialog-title" className="ticket-dialog-title">
                  {tickets.length ? <>You’re on the <em>list.</em></> : <>Your next night <em>out.</em></>}
                </h2>
                <p className="ticket-dialog-subtitle">
                  {tickets.length ? 'Your payment has been verified.' : 'Reserve your place at the next Groove Garden.'}
                </p>
              </div>

              {tickets.length > 0 ? (
                <div className="ticket-confirmation">
                  <div className="ticket-confirmation-event">
                    <span>CONFIRMED EVENT</span>
                    <strong>{settings?.eventName}</strong>
                    <small>{settings?.eventDate ? formatTicketEventDate(settings.eventDate) : ''} · {settings?.eventTime}</small>
                  </div>
                  <div className="ticket-confirmation-codes">
                    {tickets.map(ticket => (
                      <div key={ticket.ticketCode} className="ticket-confirmation-ticket">
                        <Image
                          className="ticket-confirmation-image"
                          src={ticket.downloadUrl}
                          alt={`Groove Garden ticket ${ticket.ticketCode} with QR code`}
                          width={1000}
                          height={460}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  <p className="ticket-confirmation-message">
                    {emailSent
                      ? `${tickets.length > 1 ? 'Your tickets have' : 'Your ticket has'} been sent to ${email}. Check your inbox and spam folder. Present each ticket code or QR at the entrance.`
                      : `${tickets.length > 1 ? 'Your tickets are' : 'Your ticket is'} shown above. ${tickets.length > 1 ? 'Copies will' : 'A copy will'} also be sent to ${email}; check your inbox and spam folder. Present each ticket code or QR at the entrance.`}
                  </p>
                  <p className="ticket-confirmation-disclaimer">
                    Each ticket is valid for one entry only and can be used once at the gate.
                  </p>
                  {!emailSent && pendingReference && (
                    <button type="button" className="ticket-dialog-secondary-button" disabled={emailBusy || isBusy} onClick={() => { void deliverTicketEmail(pendingReference) }}>
                      {emailBusy ? 'Sending ticket email…' : 'Retry email delivery'}
                    </button>
                  )}
                  <div className="ticket-confirmation-actions">
                    <button
                      type="button"
                      className="ticket-dialog-download-button"
                      onClick={() => { void downloadAllTickets() }}
                      disabled={ticketsDownloadBusy}
                    >
                      {ticketsDownloadBusy ? 'Preparing tickets…' : `Download ${tickets.length > 1 ? 'all tickets' : 'ticket'}`}
                    </button>
                    <button type="button" className="ticket-dialog-primary-button ticket-dialog-done" onClick={() => setIsOpen(false)}>Done</button>
                  </div>
                </div>
              ) : settings?.enabled ? (
                <>
                  <div className="ticket-event-summary">
                    <div className="ticket-event-summary-copy">
                      <span>UP NEXT AT GROOVE GARDEN</span>
                      <strong>{settings.eventName}</strong>
                      <small>{formatTicketEventDate(settings.eventDate)} <i/> {settings.eventTime}</small>
                    </div>
                    <div className="ticket-event-price">
                      <span>PRICE PER TICKET</span>
                      <strong>₦{settings.ticketPriceNaira?.toLocaleString('en-NG')}</strong>
                    </div>
                  </div>
                  <form onSubmit={startCheckout} className="ticket-checkout-form">
                    <div className="ticket-checkout-form-heading">
                      <strong>Your details</strong>
                      <span>Up to {settings.maxTickets} tickets per order</span>
                    </div>
                    <label className="ticket-form-label" htmlFor="ticket-name">Full name
                      <input id="ticket-name" className="field ticket-form-input" autoComplete="name" placeholder="Name on the ticket" required maxLength={100} value={name} onChange={event => setName(event.target.value)} />
                    </label>
                    <label className="ticket-form-label" htmlFor="ticket-email">Email address
                      <input id="ticket-email" className="field ticket-form-input" type="email" autoComplete="email" placeholder="Where we’ll send your ticket" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
                    </label>
                    <label className="ticket-form-label" htmlFor="ticket-phone">Phone number
                      <input id="ticket-phone" className="field ticket-form-input" type="tel" autoComplete="tel" placeholder="Your contact number" required value={phone} onChange={event => setPhone(event.target.value)} />
                    </label>
                    <div className="ticket-form-label">
                      <span id="ticket-quantity-label">Number of tickets</span>
                      <div className="ticket-quantity-picker" ref={quantityPickerRef}>
                        <button
                          ref={quantityTriggerRef}
                          id="ticket-quantity"
                          type="button"
                          className="ticket-form-input ticket-quantity-trigger"
                          role="combobox"
                          aria-labelledby="ticket-quantity-label"
                          aria-controls="ticket-quantity-options"
                          aria-expanded={quantityMenuOpen}
                          aria-haspopup="listbox"
                          aria-activedescendant={quantityMenuOpen ? `ticket-quantity-option-${activeQuantity}` : undefined}
                          onClick={() => {
                            setActiveQuantity(quantity)
                            setQuantityMenuOpen(open => !open)
                          }}
                          onKeyDown={handleQuantityKeyDown}
                        >
                          <span>{quantity} {quantity === 1 ? 'ticket' : 'tickets'}</span>
                          <FiChevronDown size={16} aria-hidden="true"/>
                        </button>
                        {quantityMenuOpen && (
                          <div id="ticket-quantity-options" className="ticket-quantity-options" role="listbox" aria-labelledby="ticket-quantity-label">
                            {quantityOptions.map(count => (
                              <button
                                key={count}
                                id={`ticket-quantity-option-${count}`}
                                type="button"
                                className={`ticket-quantity-option${count === quantity ? ' selected' : ''}${count === activeQuantity ? ' active' : ''}`}
                                role="option"
                                aria-selected={count === quantity}
                                tabIndex={-1}
                                onMouseEnter={() => setActiveQuantity(count)}
                                onClick={() => {
                                  setQuantity(count)
                                  setQuantityMenuOpen(false)
                                  quantityTriggerRef.current?.focus()
                                }}
                              >
                                <span>{count} {count === 1 ? 'ticket' : 'tickets'}</span>
                                <span className="ticket-quantity-option-meta">
                                  <span>{settings.ticketPriceNaira === null ? '—' : `₦${(settings.ticketPriceNaira * count).toLocaleString('en-NG')}`}</span>
                                  {count === quantity && <span className="ticket-quantity-check" aria-hidden="true">✓</span>}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ticket-total-row">
                      <span>Total · {quantity} {quantity === 1 ? 'ticket' : 'tickets'}</span>
                      <strong>₦{total.toLocaleString('en-NG')}</strong>
                    </div>
                    {error && <p role="alert" className="ticket-dialog-error">{error}</p>}
                    {pendingReference && error && (
                      <button type="button" className="ticket-dialog-secondary-button" disabled={isBusy} onClick={() => { void confirmPayment(pendingReference) }}>
                        {isBusy ? 'Checking payment…' : 'Check payment again'}
                      </button>
                    )}
                    <button type="submit" className="ticket-dialog-primary-button" disabled={isBusy}>
                      {isBusy ? 'Opening secure payment…' : <>Continue to secure payment <FiArrowRight size={15}/></>}
                    </button>
                    <p className="ticket-payment-note"><span aria-hidden="true">●</span> Secure payment powered by Paystack. Your unique ticket and QR code are emailed after payment is verified.</p>
                  </form>
                </>
              ) : (
                <div className="ticket-sales-unavailable">
                  <span className="ticket-sales-unavailable-icon">✦</span>
                  <strong>{settings?.eventName ?? 'Next Groove Garden event'}</strong>
                  <p>{settings?.eventDate ? formatTicketEventDate(settings.eventDate) : 'To be announced'}{settings?.eventTime ? ` · ${settings.eventTime}` : ''}</p>
                  <p>Ticket sales will open as soon as event details are confirmed.</p>
                  {error && <p role="alert" className="ticket-dialog-error">{error}</p>}
                </div>
              )}
              {error && tickets.length > 0 && <p role="alert" className="ticket-dialog-error ticket-dialog-bottom-error">{error}</p>}
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        modalRoot,
      )}
    </>
  )
}

function UpcomingEvent({
  flyer,
  edition,
  isEasterSeason,
}: {
  flyer: string
  edition: Edition
  isEasterSeason: boolean
}) {
  const isWhistleFiesta = edition.key === 'whistle-fiesta' && isWhistleFiestaWindow()
  const isCarnival = edition.key === 'groove-garden-carnival-2026'

  return (
    <section id="upcoming-event" className={`sec upcoming-event-section${isCarnival ? ' carnival-edition' : ''}`} style={{
      background: isCarnival
        ? 'linear-gradient(145deg, #17101e 0%, #0a0f0d 54%, #201125 100%)'
        : 'linear-gradient(160deg, #130e08 0%, #0a0f0d 40%, #0d2b18 100%)',
      borderTop:'1px solid rgba(240,235,224,0.05)',
      borderBottom:'1px solid rgba(240,235,224,0.05)',
      position:'relative',
      overflow:'hidden',
    }}>
      {isEasterSeason && (
        <>
          <div className="absolute inset-x-0 top-0 h-12 pointer-events-none opacity-75"
            style={{
              background: 'repeating-linear-gradient(90deg, rgba(255,209,102,0.8) 0 14px, transparent 14px 42px, rgba(202,240,248,0.8) 42px 56px, transparent 56px 84px, rgba(255,200,221,0.8) 84px 98px, transparent 98px 126px)',
              clipPath: 'polygon(0 0,100% 0,100% 38%,95% 54%,90% 38%,85% 54%,80% 38%,75% 54%,70% 38%,65% 54%,60% 38%,55% 54%,50% 38%,45% 54%,40% 38%,35% 54%,30% 38%,25% 54%,20% 38%,15% 54%,10% 38%,5% 54%,0 38%)',
            }} />
          <div className="absolute top-10 left-[max(1rem,4vw)] w-14 h-20 rounded-[50%]"
            style={{
              background: 'linear-gradient(180deg, #f9c74f 0%, #f9844a 100%)',
              transform: 'rotate(-16deg)',
              boxShadow: '0 12px 30px rgba(249,199,79,0.18)',
              border: '2px solid rgba(255,255,255,0.14)',
            }} />
          <div className="absolute top-16 right-[max(1rem,5vw)] flex gap-2 opacity-85">
            <div style={{
              width: '18px',
              height: '58px',
              background: 'linear-gradient(180deg, #ffe5ec 0%, #ffc8dd 100%)',
              borderRadius: '999px 999px 18px 18px',
              transform: 'rotate(-10deg)',
            }} />
            <div style={{
              width: '18px',
              height: '58px',
              background: 'linear-gradient(180deg, #caf0f8 0%, #90e0ef 100%)',
              borderRadius: '999px 999px 18px 18px',
              transform: 'rotate(10deg)',
            }} />
          </div>
          <div className="absolute bottom-10 right-[max(1rem,4vw)] w-12 h-[72px] rounded-[50%] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #ffe5ec 0%, #ffc8dd 100%)',
              transform: 'rotate(-12deg)',
              border: '2px solid rgba(255,255,255,0.14)',
              boxShadow: '0 12px 28px rgba(255,200,221,0.16)',
            }} />
          <div className="absolute bottom-24 left-[max(1rem,6vw)] pointer-events-none"
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '0.56rem',
              letterSpacing: '0.2em',
              color: 'rgba(255,240,245,0.52)',
              textTransform: 'uppercase',
            }}>
            Easter Special
          </div>
        </>
      )}

      {isWhistleFiesta && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[0, 1, 2, 3].map((item) => (
              <motion.div
                key={item}
                animate={{
                  x: [0, item % 2 === 0 ? 22 : -22, 0],
                  y: [0, -18, 0],
                  rotate: [item % 2 === 0 ? -12 : 12, item % 2 === 0 ? 12 : -12, item % 2 === 0 ? -12 : 12],
                  opacity: [0.28, 0.7, 0.28],
                }}
                transition={{
                  duration: 3 + item * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: item * 0.5,
                }}
                style={{
                  position: 'absolute',
                  left: `${10 + item * 20}%`,
                  top: `${14 + (item % 3) * 18}%`,
                  width: item % 2 === 0 ? '70px' : '54px',
                  height: item % 2 === 0 ? '18px' : '12px',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(147,197,253,0.8), rgba(255,255,255,0))',
                  boxShadow: '0 0 18px rgba(125,211,252,0.3)',
                }}
              />
            ))}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                right: 'max(1rem, 5vw)',
                top: '30%',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(147,197,253,0.22) 0%, rgba(147,197,253,0.08) 28%, transparent 70%)',
              }}
            />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '0.58rem',
              letterSpacing: '0.28em',
              color: 'rgba(191,219,254,0.9)',
              textTransform: 'uppercase',
              textShadow: '0 0 16px rgba(147,197,253,0.6)',
            }}>
            WHISTLE MODE
          </div>
        </>
      )}
      <div className="wrap">
        <div className="text-center mb-20">
          <div className="eyebrow justify-center" style={{ justifyContent:'center' }}>
            <PiTreePalm size={11}/> {isCarnival ? 'Carnival Night · November 30' : 'Next Edition'} <PiTreePalm size={11}/>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          <motion.div
            className="relative"
            initial={{ opacity:0, x:-50, rotate:-2 }}
            whileInView={{ opacity:1, x:0, rotate:-1.5 }}
            viewport={{ once:true, margin:'-80px' }}
            transition={{ duration:1, ease:EX }}
            whileHover={{ rotate:0, scale:1.02, transition:{ duration:0.5, ease:EX } }}
          >
            <div className="photo-luxury" style={{ position:'relative' }}>
              <div style={{ paddingBottom:'128%', position:'relative', overflow:'hidden' }}>
                {flyer ? (
                  <Image src={`/coming-soon/${flyer}`} alt={`${edition.title} flyer`} fill className="object-cover"/>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background:'var(--bg-raised)' }}>
                    <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.6rem', color:'var(--fire-bright)', letterSpacing:'0.2em' }}>
                      FLYER DROPPING SOON
                    </p>
                  </div>
                )}
                <div className="ov-bottom"/>
              </div>
            </div>

            <div className="absolute -inset-8 -z-10 rounded-full pointer-events-none"
              style={{ background:'radial-gradient(ellipse at center, rgba(var(--fire-rgb),0.15) 0%, transparent 70%)', filter:'blur(20px)' }}/>

            <div className="absolute -top-4 -right-4 px-5 py-2"
              style={{ background:'var(--g-fire)', fontFamily:'var(--f-sans)', fontWeight:700, fontSize:'0.58rem', letterSpacing:'0.2em', color:'var(--bg-base)', boxShadow:'0 8px 32px rgba(var(--fire-rgb),0.4)' }}>
              {isCarnival ? 'CARNIVAL 2026' : 'NEXT EDITION'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity:0, x:40 }}
            whileInView={{ opacity:1, x:0 }}
            viewport={{ once:true, margin:'-80px' }}
            transition={{ duration:0.9, ease:EX, delay:0.15 }}
          >
            <h2 className="t-section" style={{ color:'var(--cream)', marginBottom:'0.25rem' }}>
              {edition.title}
            </h2>
            {edition.subtitle && (
              <h2 className="t-section-italic t-fire glow-fire" style={{ marginBottom:'0.5rem' }}>
                {edition.subtitle}
              </h2>
            )}
            <span className="div-fire" style={{ marginBottom:'3rem' }}/>

            <div className="event-details-list">
              {[
                { icon:<RiMapPin2Line size={14}/>, label:'Venue', val:edition.venue },
                { icon:<PiStarFill size={12}/>, label:'Date', val:edition.dateLabel },
                { icon:<PiMusicNoteFill size={12}/>, label:'Time', val:edition.time },
                { icon:<PiLeafFill size={12}/>, label:'Ticket', val:edition.ticket },
                { icon:<PiTreePalm size={12}/>, label:'Cabana', val:edition.cabana },
                { icon:<PiMusicNoteFill size={12}/>, label:'Line Up', val:edition.lineUp },
              ].map(({ icon, label, val }, i) => (
                <motion.div key={label}
                  initial={{ opacity:0, x:20 }}
                  whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }}
                  transition={{ duration:0.5, ease:EX, delay:0.25+i*0.08 }}
                  className="flex items-start gap-5 pb-5"
                  style={{ borderBottom:'1px solid rgba(240,235,224,0.06)' }}
                >
                  <div className="flex-shrink-0 mt-1" style={{ color:'var(--fire-bright)' }}>{icon}</div>
                  <div>
                    <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.55rem', letterSpacing:'0.22em', color:'rgba(var(--fire-rgb),0.6)', marginBottom:'5px' }}>
                      {label.toUpperCase()}
                    </p>
                    <p style={{ fontFamily:'var(--f-display)', fontWeight:300, fontSize:'1rem', color:'var(--cream)' }}>
                      {val}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="event-action-buttons">
              <TicketPurchase/>
              <Link href="/contact" className="btn btn-fire">
                <span>Reserve a Cabana</span><FiArrowRight size={13}/>
              </Link>
              <Link href="/gallery" className="btn btn-outline">
                View The Vibe
              </Link>
            </div>

            <p className="event-support-note">
              For more enquiries or payment issues, contact{' '}
              <a href="mailto:groovegardenhq@gmail.com">groovegardenhq@gmail.com</a>
              {' '}and our team will be happy to assist you.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const [splash, setSplash] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [flyers, setFlyers] = useState<string[]>([])
  const [comingSoonFlyers, setComingSoonFlyers] = useState<string[]>([])
  const { edition: activeEdition, flyer: activeFlyer, isEasterSeason } = getActiveEdition(comingSoonFlyers)

  const done = useCallback(() => { setSplash(false); document.body.style.overflow = 'auto' }, [])

  useEffect(() => {
    if (splash) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [splash])

  useEffect(() => {
    getFiles('past-events').then(f => setImages(shuffle(f.filter(x => IMG.test(x)))))
    getFiles('main-past-flyers').then(f => setFlyers(f.filter(x => IMG.test(x))))
    getFiles('coming-soon').then(f => setComingSoonFlyers(f.filter(x => IMG.test(x))))
  }, [])

  return (
    <>
      {splash && <Splash onDone={done}/>}

      <AnimatePresence>
        {!splash && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ duration:0.8, ease:EX }}
          >
            <UpcomingEvent flyer={activeFlyer} edition={activeEdition} isEasterSeason={isEasterSeason}/>
            <Hero/>
            <Marquee/>
            <WhyGrooveGarden/>
            <hr style={{ border:'none', height:'1px', background:'linear-gradient(90deg,transparent,rgba(240,235,224,0.07),transparent)' }}/>
            <EventsGallery images={images}/>
            <hr style={{ border:'none', height:'1px', background:'linear-gradient(90deg,transparent,rgba(240,235,224,0.07),transparent)' }}/>
            <FlyersCarousel flyers={flyers}/>
            <hr style={{ border:'none', height:'1px', background:'linear-gradient(90deg,transparent,rgba(240,235,224,0.07),transparent)' }}/>
            <VideoSection/>
            <hr style={{ border:'none', height:'1px', background:'linear-gradient(90deg,transparent,rgba(240,235,224,0.07),transparent)' }}/>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}