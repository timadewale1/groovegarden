'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import {
  FiX, FiArrowLeft, FiArrowRight, FiChevronLeft, FiChevronRight, FiArrowRight as FiAR
} from 'react-icons/fi'
import {
  PiTreePalm, PiMusicNoteFill, PiCalendarBlankFill,
  PiTicketFill, PiArrowsOutSimpleFill
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
const PER_PAGE = 9

/* ── FRAME STYLE PER CARD ────────────────────────────────── */
// Cycles through 3 visual treatments for visual rhythm
const CARD_STYLES = [
  // Standard luxury bordered
  {
    wrapper: 'photo-luxury',
    tilt: -1.5,
    accent: 'var(--fire)',
  },
  // Polaroid
  {
    wrapper: 'photo-polaroid',
    tilt: 1.2,
    accent: 'var(--fire-bright)',
  },
  // Clean film strip
  {
    wrapper: 'photo-film',
    tilt: -0.8,
    accent: 'var(--fire-hot)',
  },
]

/* ════════════════════════════════════════════════════════════
   PAGE HEADER
════════════════════════════════════════════════════════════ */
function PageHeader({ total }: { total: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y    = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        minHeight: '65vh',
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
        paddingTop: '120px',
        background: 'linear-gradient(155deg, #130e08 0%, #0a0f0d 40%, #0d2b18 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          'radial-gradient(ellipse 65% 70% at 90% 20%, rgba(var(--fire-rgb),0.1) 0%, transparent 65%)',
          'radial-gradient(ellipse 80% 60% at 5% 70%,  rgba(13,59,26,0.45) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 50% at 50% 100%, rgba(45,106,79,0.1) 0%, transparent 60%)',
        ].join(','),
      }}/>

      {/* Dot texture */}
      <div className="absolute inset-0 pointer-events-none bg-dots" style={{ opacity: 0.35 }}/>

      {/* Right vertical line */}
      <div
        className="absolute right-[clamp(1.5rem,6vw,7rem)] top-0 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(var(--fire-rgb),0.35) 35%, rgba(var(--fire-rgb),0.55) 65%, transparent)' }}
      />

      {/* Large background text - atmosphere */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none select-none"
        style={{
          fontFamily: 'var(--f-display)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 'clamp(8rem, 22vw, 22rem)',
          lineHeight: 0.85,
          color: 'rgba(240,235,224,0.025)',
          letterSpacing: '-0.04em',
          transform: 'translateX(8%)',
          userSelect: 'none',
        }}
      >
        Archive
      </div>

      <motion.div style={{ y, opacity: fade }} className="relative z-10 w-full">
        <div className="wrap">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: EX, delay: 0.1 }}
            className="eyebrow"
            style={{ marginBottom: '2.5rem' }}
          >
            <PiTreePalm size={11}/> Groove Garden · Oye-Ekiti
          </motion.div>

          {/* PAST */}
          <div className="overflow-hidden" style={{ marginBottom: '-0.04em' }}>
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease: EX, delay: 0.15 }}
              style={{
                fontFamily: 'var(--f-display)',
                fontWeight: 900,
                fontSize: 'clamp(5rem, 15vw, 13rem)',
                lineHeight: 0.88,
                letterSpacing: '-0.03em',
                color: 'var(--cream)',
              }}
            >
              PAST
            </motion.h1>
          </div>

          {/* EVENTS - italic fire, offset right */}
          <div className="overflow-hidden" style={{ marginBottom: '3.5rem' }}>
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease: EX, delay: 0.28 }}
              className="t-fire"
              style={{
                fontFamily: 'var(--f-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(5rem, 15vw, 13rem)',
                lineHeight: 0.88,
                letterSpacing: '-0.02em',
                paddingLeft: 'clamp(2rem, 12vw, 16rem)',
                filter: 'drop-shadow(0 0 60px rgba(var(--fire-rgb),0.3))',
              }}
            >
              Events
            </motion.h1>
          </div>

          {/* Bottom meta row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EX, delay: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-16"
          >
            <div>
              <span className="div-fire" style={{ marginBottom: '1.25rem' }}/>
              <p className="t-body" style={{ maxWidth: '380px', fontSize: '0.95rem' }}>
                Every flyer a chapter. Every night a story that&apos;ll be told for years.
                The full Groove Garden archive.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-10 flex-shrink-0">
              <div>
                <p style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(2.2rem,4vw,3.5rem)', color: 'var(--fire-bright)', lineHeight: 1 }}>
                  {total}
                </p>
                <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--cream-40)', marginTop: '5px' }}>
                  EVENTS ARCHIVED
                </p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(2.2rem,4vw,3.5rem)', color: 'var(--fire-bright)', lineHeight: 1 }}>
                  ∞
                </p>
                <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--cream-40)', marginTop: '5px' }}>
                  MEMORIES MADE
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, var(--fire), var(--fire-hot), var(--fire), transparent)' }}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   LIGHTBOX - plain <img> tag, no Next/Image sizing issues
════════════════════════════════════════════════════════════ */
function Lightbox({
  flyers, index, onClose, onPrev, onNext,
}: {
  flyers: FlyerWithFolder[]; index: number
  onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', fn)
    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', fn)
    }
  }, [onClose, onPrev, onNext])

  const flyer = flyers[index]
  const src = `/${flyer.folder}/${flyer.file}`
  const name = flyer.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase()

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: 'rgba(10,15,13,0.97)', backdropFilter: 'blur(28px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(10,15,13,0.9), transparent)' }}>
        {/* Counter */}
        <div className="flex items-center gap-3">
          <PiTicketFill size={13} style={{ color: 'var(--fire)' }}/>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--cream-40)' }}>
            {String(index + 1).padStart(2,'0')}
            <span style={{ color: 'var(--fire)', margin: '0 6px' }}>/</span>
            {String(flyers.length).padStart(2,'0')}
          </span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--cream-40)', marginLeft: '8px' }}>
            {name}
          </span>
        </div>

        {/* Close */}
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          className="w-11 h-11 flex items-center justify-center transition-all duration-300"
          style={{ border: '1px solid rgba(240,235,224,0.12)', color: 'var(--cream-75)', background: 'rgba(10,15,13,0.8)', backdropFilter: 'blur(8px)', cursor: 'none' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='var(--fire)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(10,15,13,0.8)'; el.style.color='var(--cream-75)'; el.style.borderColor='rgba(240,235,224,0.12)' }}
        >
          <FiX size={16}/>
        </button>
      </div>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 md:left-8 z-30 w-12 h-12 flex items-center justify-center transition-all duration-300"
        style={{ border: '1px solid rgba(var(--fire-rgb),0.3)', color: 'var(--cream-75)', background: 'rgba(10,15,13,0.7)', backdropFilter: 'blur(8px)', cursor: 'none' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='var(--fire)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(10,15,13,0.7)'; el.style.color='var(--cream-75)'; el.style.borderColor='rgba(var(--fire-rgb),0.3)' }}
      >
        <FiArrowLeft size={16}/>
      </button>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); onNext() }}
        className="absolute right-4 md:right-8 z-30 w-12 h-12 flex items-center justify-center transition-all duration-300"
        style={{ border: '1px solid rgba(var(--fire-rgb),0.3)', color: 'var(--cream-75)', background: 'rgba(10,15,13,0.7)', backdropFilter: 'blur(8px)', cursor: 'none' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='var(--fire)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(10,15,13,0.7)'; el.style.color='var(--cream-75)'; el.style.borderColor='rgba(var(--fire-rgb),0.3)' }}
      >
        <FiArrowRight size={16}/>
      </button>

      {/* Flyer image - plain img, no sizing issues */}
      <AnimatePresence mode="wait">
        <motion.div
          key={src}
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -16 }}
          transition={{ duration: 0.38, ease: EX }}
          style={{
            position: 'relative',
            maxWidth: 'min(500px, 85vw)',
            maxHeight: '82vh',
            width: '100%',
          }}
        >
          {/* Glow behind flyer */}
          <div
            className="absolute -inset-6 -z-10 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(var(--fire-rgb),0.18) 0%, transparent 70%)',
              filter: 'blur(16px)',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              maxHeight: '82vh',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Bottom keyboard hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
        {[['←','prev'],['→','next'],['esc','close']].map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <kbd style={{
              fontFamily: 'var(--f-mono)', fontSize: '0.52rem', padding: '2px 7px',
              border: '1px solid rgba(240,235,224,0.12)', color: 'var(--cream-40)',
              background: 'rgba(240,235,224,0.04)', borderRadius: '3px', letterSpacing: '0.05em',
            }}>{key}</kbd>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(240,235,224,0.2)' }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGINATION
════════════════════════════════════════════════════════════ */
function Pagination({
  current, total, perPage, onChange,
}: {
  current: number; total: number; perPage: number; onChange: (p: number) => void
}) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null

  const go = (p: number) => {
    onChange(p)
    const el = document.getElementById('events-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const nums: (number | '...')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= current - 1 && i <= current + 1)) {
      nums.push(i)
    } else if (nums[nums.length - 1] !== '...') {
      nums.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-16 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => current > 1 && go(current - 1)}
        disabled={current === 1}
        className="w-10 h-10 flex items-center justify-center transition-all duration-250"
        style={{
          border: '1px solid rgba(var(--fire-rgb),0.22)',
          color: current === 1 ? 'rgba(240,235,224,0.18)' : 'var(--cream-40)',
          background: 'transparent', cursor: current === 1 ? 'not-allowed' : 'none',
          opacity: current === 1 ? 0.35 : 1,
        }}
        onMouseEnter={e => { if (current > 1) { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)' }}}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--cream-40)' }}
      >
        <FiChevronLeft size={15}/>
      </button>

      {nums.map((n, i) =>
        n === '...'
          ? <span key={`el${i}`} style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', color: 'var(--cream-40)', padding: '0 2px' }}>···</span>
          : (
            <button key={n} onClick={() => go(n as number)}
              className="w-10 h-10 flex items-center justify-center transition-all duration-250"
              style={{
                fontFamily: 'var(--f-mono)', fontSize: '0.62rem', letterSpacing: '0.1em',
                border: `1px solid ${current===n ? 'var(--fire)' : 'rgba(240,235,224,0.1)'}`,
                background: current===n ? 'var(--fire)' : 'transparent',
                color: current===n ? 'var(--bg-base)' : 'var(--cream-40)',
                fontWeight: current===n ? 700 : 400, cursor: 'none',
                clipPath: current===n ? 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' : 'none',
              }}
              onMouseEnter={e => { if (current!==n) { const el=e.currentTarget as HTMLElement; el.style.background='rgba(var(--fire-rgb),0.12)'; el.style.color='var(--fire-bright)'; el.style.borderColor='rgba(var(--fire-rgb),0.35)' }}}
              onMouseLeave={e => { if (current!==n) { const el=e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--cream-40)'; el.style.borderColor='rgba(240,235,224,0.1)' }}}
            >
              {n}
            </button>
          )
      )}

      {/* Next */}
      <button
        onClick={() => current < pages && go(current + 1)}
        disabled={current === pages}
        className="w-10 h-10 flex items-center justify-center transition-all duration-250"
        style={{
          border: '1px solid rgba(var(--fire-rgb),0.22)',
          color: current===pages ? 'rgba(240,235,224,0.18)' : 'var(--cream-40)',
          background: 'transparent', cursor: current===pages ? 'not-allowed' : 'none',
          opacity: current===pages ? 0.35 : 1,
        }}
        onMouseEnter={e => { if (current<pages) { const el=e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)' }}}
        onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--cream-40)' }}
      >
        <FiChevronRight size={15}/>
      </button>

      <span style={{ fontFamily:'var(--f-mono)', fontSize:'0.54rem', letterSpacing:'0.14em', color:'var(--cream-40)', marginLeft:'0.75rem' }}>
        {current} / {pages}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   FLYER GRID
════════════════════════════════════════════════════════════ */
function FlyerGrid({ flyers }: { flyers: FlyerWithFolder[] }) {
  const [page, setPage]         = useState(1)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const totalPages = Math.ceil(flyers.length / PER_PAGE)
  const start      = (page - 1) * PER_PAGE
  const pageFly    = flyers.slice(start, start + PER_PAGE)

  const prev = useCallback(() => setLightbox(i => {
    if (i === null) return 0
    const ni = (i - 1 + flyers.length) % flyers.length
    setPage(Math.floor(ni / PER_PAGE) + 1)
    return ni
  }), [flyers.length])

  const next = useCallback(() => setLightbox(i => {
    if (i === null) return 0
    const ni = (i + 1) % flyers.length
    setPage(Math.floor(ni / PER_PAGE) + 1)
    return ni
  }), [flyers.length])

  const open = (localIdx: number) => setLightbox(start + localIdx)

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.45, ease: EX }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {pageFly.map((flyerData, i) => {
            const globalIdx = start + i
            const style     = CARD_STYLES[globalIdx % CARD_STYLES.length]
            const editionNum = String(globalIdx + 1).padStart(2, '0')
            const name       = flyerData.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

            return (
              <motion.div
                key={`${flyerData.folder}-${flyerData.file}`}
                className={`card-hover ${style.wrapper} group`}
                style={{ rotate: style.tilt, cursor: 'none' }}
                initial={{ opacity: 0, y: 36, rotate: style.tilt + (style.tilt > 0 ? 3 : -3) }}
                animate={{ opacity: 1, y: 0, rotate: style.tilt }}
                transition={{ duration: 0.65, ease: EX, delay: Math.min(i * 0.06, 0.45) }}
                whileHover={{ scale: 1.04, rotate: 0, y: -10, zIndex: 10, transition: { duration: 0.4, ease: EX } }}
                onClick={() => open(i)}
              >
                {/* Flyer image */}
                <div className="relative" style={{ paddingBottom: '138%', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/${flyerData.folder}/${flyerData.file}`}
                    alt={name}
                    loading="lazy"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Gradient overlay */}
                  <div className="ov-bottom"/>

                  {/* Hover reveal */}
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ background: 'rgba(10,15,13,0.55)', backdropFilter: 'blur(2px)' }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ border: `2px solid ${style.accent}`, background: 'rgba(10,15,13,0.6)', backdropFilter: 'blur(8px)' }}
                    >
                      <PiArrowsOutSimpleFill size={18} style={{ color: style.accent }}/>
                    </div>
                    <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.52rem', letterSpacing: '0.2em', color: 'var(--cream-75)', textAlign: 'center', padding: '0 16px', textTransform: 'uppercase' }}>
                      View Full
                    </p>
                  </motion.div>

                  {/* Edition badge */}
                  <div
                    className="absolute top-3 left-3 px-2 py-1"
                    style={{
                      background: 'rgba(10,15,13,0.75)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${style.accent}33`,
                      fontFamily: 'var(--f-mono)',
                      fontSize: '0.52rem',
                      letterSpacing: '0.15em',
                      color: style.accent,
                    }}
                  >
                    #{editionNum}
                  </div>
                </div>

                {/* Name tag - below polaroid border if applicable */}
                <div
                  className="absolute bottom-2 left-0 right-0 text-center"
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: '0.5rem',
                    letterSpacing: '0.12em',
                    color: style.wrapper === 'photo-polaroid' ? 'rgba(10,15,13,0.55)' : 'var(--cream-40)',
                    textTransform: 'uppercase',
                    padding: '0 10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    // Polaroid text sits below the image in the white area
                    ...(style.wrapper === 'photo-polaroid' ? { bottom: '8px' } : {}),
                  }}
                >
                  {name}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      <Pagination current={page} total={flyers.length} perPage={PER_PAGE} onChange={setPage}/>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            flyers={flyers}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   MARQUEE STRIP
════════════════════════════════════════════════════════════ */
function MarqueeStrip() {
  const items = ['GROOVE TILL SUNRISE','EVERY MONDAY','OYE-EKITI FINEST','GROOVE GARDEN','THE ARCHIVE','NO MONDAY WITHOUT GROOVE']
  const all   = [...items, ...items]

  return (
    <div className="relative overflow-hidden py-4"
      style={{ background: 'var(--jungle-deep)', borderTop: '1px solid rgba(240,235,224,0.04)', borderBottom: '1px solid rgba(240,235,224,0.04)' }}>
      <div className="mq-track">
        {all.map((t, i) => (
          <span key={i} className="flex items-center gap-5 pr-8"
            style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(240,235,224,0.3)', whiteSpace: 'nowrap' }}>
            {t} <PiMusicNoteFill size={8} style={{ opacity: 0.4, flexShrink: 0 }}/>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   UPCOMING CTA SECTION
════════════════════════════════════════════════════════════ */
function UpcomingCTA() {
  return (
    <section
      className="sec-sm"
      style={{
        background: 'linear-gradient(135deg, #130e08 0%, #0a0f0d 50%, #0d2b18 100%)',
        borderTop: '1px solid rgba(240,235,224,0.05)',
      }}
    >
      <div className="wrap">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 py-8 px-8 md:px-14"
          style={{
            border: '1px solid rgba(var(--fire-rgb),0.15)',
            background: 'rgba(240,235,224,0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 100% at 80% 50%, rgba(var(--fire-rgb),0.07) 0%, transparent 70%)' }}/>

          {/* Fire side accent */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: 'var(--g-fire)' }}/>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <PiCalendarBlankFill size={14} style={{ color: 'var(--fire)' }}/>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', color: 'var(--fire-bright)', textTransform: 'uppercase' }}>
                What&apos;s Next
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 'clamp(1.8rem,3.5vw,3rem)', lineHeight: 1, color: 'var(--cream)', letterSpacing: '-0.02em' }}>
              The Next Edition Is<br/>
              <em className="t-fire" style={{ fontStyle: 'italic', fontWeight: 300 }}>Coming Soon</em>
            </h3>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <Link href="/contact" className="btn btn-fire">
              <span>Reserve a Spot</span>
              <FiAR size={13}/>
            </Link>
            <Link href="/gallery" className="btn btn-outline">
              View Gallery
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
type FlyerWithFolder = { file: string; folder: 'main-past-flyers' | 'past-flyers' }

export default function PastEventsPage() {
  const [flyers, setFlyers] = useState<FlyerWithFolder[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      getFiles('main-past-flyers'),
      getFiles('past-flyers'),
    ]).then(([mainFlyers, otherFlyers]) => {
      const mainFlyersFiltered = mainFlyers.filter(x => IMG.test(x)).map(f => ({ file: f, folder: 'main-past-flyers' as const }))
      const otherFlyersFiltered = otherFlyers.filter(x => IMG.test(x)).map(f => ({ file: f, folder: 'past-flyers' as const }))
      // Combine with main-past-flyers first, then shuffle
      const combined = shuffle([...mainFlyersFiltered, ...otherFlyersFiltered])
      setFlyers(combined)
      setLoaded(true)
    })
  }, [])

  return (
    <div className="pg-enter">
      <PageHeader total={flyers.length}/>
      <MarqueeStrip/>

      {/* Main section */}
      <section
        id="events-section"
        className="sec"
        style={{ background: 'var(--bg-mid)', minHeight: '60vh' }}
      >
        <div className="wrap">

          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EX, delay: 0.1 }}
            className="flex items-center justify-between mb-14"
          >
            <div className="flex items-center gap-4">
              <PiTicketFill size={14} style={{ color: 'var(--fire)' }}/>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--cream-40)', textTransform: 'uppercase' }}>
                {loaded ? `${flyers.length} events in the archive` : 'Loading archive...'}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.18em', color: 'rgba(var(--fire-rgb),0.5)', textTransform: 'uppercase' }}>
              Click to expand
            </span>
          </motion.div>

          {/* Loading */}
          {!loaded && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                className="w-10 h-10 rounded-full"
                style={{ border: '2px solid rgba(var(--fire-rgb),0.15)', borderTopColor: 'var(--fire)' }}
              />
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', color: 'var(--cream-40)' }}>
                LOADING ARCHIVE...
              </p>
            </div>
          )}

          {/* Grid */}
          {loaded && flyers.length > 0 && (
            <FlyerGrid flyers={flyers}/>
          )}

          {/* Empty */}
          {loaded && flyers.length === 0 && (
            <div className="text-center py-32">
              <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 'clamp(2.5rem,5vw,4rem)', color: 'rgba(240,235,224,0.05)' }}>
                No events yet
              </p>
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--cream-40)', marginTop: '1.5rem' }}>
                ADD FLYER IMAGES TO /public/past-flyers
              </p>
            </div>
          )}
        </div>
      </section>

      <UpcomingCTA/>
    </div>
  )
}