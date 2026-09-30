'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  FiX, FiArrowLeft, FiArrowRight, FiPlay, FiPause, FiMaximize2,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi'
import {
  PiImagesSquareFill, PiVideoFill, PiGridFourFill,
  PiSquaresFourFill, PiMusicNoteFill, PiLeafFill
} from 'react-icons/pi'

/* ── TYPES ───────────────────────────────────────────────── */
type LocalVideo = { type: 'local'; filename: string }
type YouTubeVideo = { type: 'youtube'; id: string; title?: string; description?: string }
type Video = LocalVideo | YouTubeVideo

/* ── UTILS ───────────────────────────────────────────────── */
async function getFiles(folder: string): Promise<string[]> {
  try {
    const r = await fetch(`/api/files?folder=${folder}`)
    const d = await r.json()
    return d.files ?? []
  } catch { return [] }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com.*[?&]v=([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

async function fetchYouTubeMetadata(
  videoId: string
): Promise<{ title: string; description?: string } | null> {
  try {
    const res = await fetch(`/api/youtube?id=${videoId}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch YouTube metadata:', err)
  }
  return null
}

const IMG = /\.(png|jpg|jpeg|webp)$/i
const VID = /\.(mp4|mov|webm)$/i
const EX  = [0.19, 1, 0.22, 1] as const

const PHOTOS_PER_PAGE = 10
const VIDEOS_PER_PAGE = 6

// YouTube videos - add your links here
const YOUTUBE_VIDEOS = [
  'https://youtu.be/Ds0bJ4uupxM?si=xHIcDkZnToBt0IQa',
  'https://youtu.be/Njez24_ZFcI?si=189z5xgfH_pSckT9',
  'https://youtu.be/1RURksGYP-E?si=za3TitoCtKGGTJjt',
  'https://youtu.be/4C56e14TXsE',
].map(url => {
  const id = extractYouTubeId(url)
  if (!id) throw new Error(`Invalid YouTube URL: ${url}`)
  return { type: 'youtube' as const, id } as YouTubeVideo
}) as YouTubeVideo[]

/* ── FRAME CONFIGS ───────────────────────────────────────── */
const FRAMES = [
  { frame: 'photo-luxury',   tilt: -2,   aspect: 75  },
  { frame: 'photo-polaroid', tilt:  1.5, aspect: 85  },
  { frame: 'photo-film',     tilt: -1,   aspect: 70  },
  { frame: 'photo-torn',     tilt:  2,   aspect: 100 },
  { frame: 'photo-luxury',   tilt: -1.5, aspect: 80  },
  { frame: 'photo-polaroid', tilt:  0,   aspect: 90  },
  { frame: 'photo-film',     tilt: -2.5, aspect: 72  },
  { frame: 'photo-torn',     tilt:  1,   aspect: 95  },
  { frame: 'photo-luxury',   tilt:  2,   aspect: 78  },
  { frame: 'photo-polaroid', tilt: -1.2, aspect: 88  },
]

/* ════════════════════════════════════════════════════════════
   PAGE HEADER
════════════════════════════════════════════════════════════ */
function PageHeader({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y    = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div ref={ref} className="relative overflow-hidden"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
        paddingTop: '120px',
        background: 'linear-gradient(160deg, #0d2b18 0%, #0a0f0d 45%, #130e08 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          'radial-gradient(ellipse 70% 80% at 10% 30%, rgba(13,59,26,0.5) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 60% at 90% 70%, rgba(var(--fire-rgb),0.07) 0%, transparent 60%)',
        ].join(','),
      }}/>
      <div className="absolute inset-0 pointer-events-none bg-dots" style={{ opacity: 0.4 }}/>
      <div className="absolute left-[clamp(1.5rem,6vw,7rem)] top-0 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(var(--fire-rgb),0.4) 40%, rgba(var(--fire-rgb),0.6) 60%, transparent)' }}/>

      <motion.div style={{ y, opacity: fade }} className="relative z-10 w-full">
        <div className="wrap">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: EX, delay: 0.1 }}
            className="eyebrow" style={{ marginBottom: '2.5rem' }}
          >
            <PiImagesSquareFill size={11}/> Groove Garden
          </motion.div>

          <div className="overflow-hidden" style={{ marginBottom: '-0.04em' }}>
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease: EX, delay: 0.15 }}
              style={{
                fontFamily: 'var(--f-display)', fontWeight: 900,
                fontSize: 'clamp(5rem, 15vw, 13rem)',
                lineHeight: 0.88, letterSpacing: '-0.03em', color: 'var(--cream)',
              }}
            >OUR</motion.h1>
          </div>

          <div className="overflow-hidden" style={{ marginBottom: '3rem' }}>
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease: EX, delay: 0.28 }}
              className="t-fire"
              style={{
                fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300,
                fontSize: 'clamp(5rem, 15vw, 13rem)',
                lineHeight: 0.88, letterSpacing: '-0.02em',
                paddingLeft: 'clamp(2rem, 10vw, 14rem)',
                filter: 'drop-shadow(0 0 60px rgba(var(--fire-rgb),0.3))',
              }}
            >Gallery</motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EX, delay: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-16"
          >
            <div>
              <span className="div-fire" style={{ marginBottom: '1.25rem' }}/>
              <p className="t-body" style={{ maxWidth: '360px', fontSize: '0.95rem' }}>
                Every photo a story. Every clip a feeling. The full archive - unfiltered.
              </p>
            </div>
            {count > 0 && (
              // <div>
              //   <p style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(2rem,3.5vw,3rem)', color: 'var(--fire-bright)', lineHeight: 1 }}>{count}</p>
              //   <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--cream-40)', marginTop: '5px' }}>TOTAL MEDIA</p>
              // </div>
              null
            )}
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, var(--fire), transparent)' }}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   LIGHTBOX - fixed: uses window.location origin for img src
════════════════════════════════════════════════════════════ */
function Lightbox({
  images, index, folder, onClose, onPrev, onNext,
}: {
  images: string[]; index: number; folder: string
  onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  // Keyboard nav
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, onPrev, onNext])

  // Build a plain URL string Next/Image can resolve
  const src = `/${folder}/${images[index]}`

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: 'rgba(10,15,13,0.96)', backdropFilter: 'blur(24px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        className="absolute top-6 right-6 z-30 w-11 h-11 flex items-center justify-center transition-all duration-300"
        style={{ border: '1px solid rgba(240,235,224,0.15)', color: 'var(--cream-75)', background: 'rgba(10,15,13,0.8)', backdropFilter: 'blur(8px)', cursor: 'none' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='var(--fire)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(10,15,13,0.8)'; el.style.color='var(--cream-75)'; el.style.borderColor='rgba(240,235,224,0.15)' }}
      >
        <FiX size={16}/>
      </button>

      {/* Counter */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--cream-40)' }}>
          {String(index + 1).padStart(2,'0')} <span style={{ color: 'var(--fire)' }}>/</span> {String(images.length).padStart(2,'0')}
        </span>
      </div>

      {/* Prev arrow */}
      <button
        onClick={e => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 md:left-8 z-30 w-12 h-12 flex items-center justify-center transition-all duration-300"
        style={{ border: '1px solid rgba(var(--fire-rgb),0.3)', color: 'var(--cream-75)', background: 'rgba(10,15,13,0.7)', backdropFilter: 'blur(8px)', cursor: 'none' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='var(--fire)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(10,15,13,0.7)'; el.style.color='var(--cream-75)'; el.style.borderColor='rgba(var(--fire-rgb),0.3)' }}
      >
        <FiArrowLeft size={16}/>
      </button>

      {/* Next arrow */}
      <button
        onClick={e => { e.stopPropagation(); onNext() }}
        className="absolute right-4 md:right-8 z-30 w-12 h-12 flex items-center justify-center transition-all duration-300"
        style={{ border: '1px solid rgba(var(--fire-rgb),0.3)', color: 'var(--cream-75)', background: 'rgba(10,15,13,0.7)', backdropFilter: 'blur(8px)', cursor: 'none' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='rgba(var(--fire-rgb),0.3)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(10,15,13,0.7)'; el.style.color='var(--cream-75)'; el.style.borderColor='rgba(var(--fire-rgb),0.3)' }}
      >
        <FiArrowRight size={16}/>
      </button>

      {/* Image container - stops click propagation so clicking image doesn't close */}
      <AnimatePresence mode="wait">
        <motion.div
          key={src}
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.04, y: 0 }}
          transition={{ duration: 0.35, ease: EX }}
          style={{
            position: 'relative',
            width: 'min(90vw, 1000px)',
            maxWidth: '90vw',
            height: 'min(80vh, 700px)',
            maxHeight: '80vh',
            flexShrink: 0,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Using a regular <img> tag avoids Next/Image domain issues in lightbox */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Gallery ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Filename */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--cream-40)', textAlign: 'center', textTransform: 'uppercase' }}>
          {images[index].replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}
        </p>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGINATION CONTROLS
════════════════════════════════════════════════════════════ */
function Pagination({
  current, total, perPage, onChange
}: {
  current: number; total: number; perPage: number; onChange: (p: number) => void
}) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null

  const scrollToSection = (page: number) => {
    onChange(page)
    // Smooth scroll to top of section
    const el = document.getElementById('gallery-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Build page numbers: always show first, last, current ±1, with ellipsis
  const nums: (number | '...')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= current - 1 && i <= current + 1)) {
      nums.push(i)
    } else if (nums[nums.length - 1] !== '...') {
      nums.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-16">
      {/* Prev */}
      <button
        onClick={() => current > 1 && scrollToSection(current - 1)}
        disabled={current === 1}
        className="w-10 h-10 flex items-center justify-center transition-all duration-250"
        style={{
          border: '1px solid rgba(var(--fire-rgb),0.25)',
          color: current === 1 ? 'rgba(240,235,224,0.2)' : 'var(--cream-40)',
          background: 'transparent',
          cursor: current === 1 ? 'not-allowed' : 'none',
          opacity: current === 1 ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (current > 1) { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)' }}}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--cream-40)' }}
      >
        <FiChevronLeft size={15}/>
      </button>

      {/* Page numbers */}
      {nums.map((n, i) =>
        n === '...'
          ? <span key={`el-${i}`} style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', color: 'var(--cream-40)', padding: '0 4px' }}>···</span>
          : (
            <button
              key={n}
              onClick={() => scrollToSection(n as number)}
              className="w-10 h-10 flex items-center justify-center transition-all duration-250"
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '0.62rem',
                letterSpacing: '0.1em',
                border: `1px solid ${current === n ? 'var(--fire)' : 'rgba(240,235,224,0.1)'}`,
                background: current === n ? 'var(--fire)' : 'transparent',
                color: current === n ? 'var(--bg-base)' : 'var(--cream-40)',
                fontWeight: current === n ? 700 : 400,
                cursor: 'none',
                clipPath: current === n ? 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' : 'none',
              }}
              onMouseEnter={e => { if (current !== n) { const el = e.currentTarget as HTMLElement; el.style.background='rgba(var(--fire-rgb),0.12)'; el.style.color='var(--fire-bright)'; el.style.borderColor='rgba(var(--fire-rgb),0.35)' }}}
              onMouseLeave={e => { if (current !== n) { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--cream-40)'; el.style.borderColor='rgba(240,235,224,0.1)' }}}
            >
              {n}
            </button>
          )
      )}

      {/* Next */}
      <button
        onClick={() => current < pages && scrollToSection(current + 1)}
        disabled={current === pages}
        className="w-10 h-10 flex items-center justify-center transition-all duration-250"
        style={{
          border: '1px solid rgba(var(--fire-rgb),0.25)',
          color: current === pages ? 'rgba(240,235,224,0.2)' : 'var(--cream-40)',
          background: 'transparent',
          cursor: current === pages ? 'not-allowed' : 'none',
          opacity: current === pages ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (current < pages) { const el = e.currentTarget as HTMLElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)' }}}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--cream-40)' }}
      >
        <FiChevronRight size={15}/>
      </button>

      {/* Page info */}
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--cream-40)', marginLeft: '1rem' }}>
        Page {current} of {pages}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PHOTO GRID - paginated, framed, lightbox
════════════════════════════════════════════════════════════ */
type Layout = 'masonry' | 'grid'

function PhotoGrid({ images, layout }: { images: string[]; layout: Layout }) {
  const [page, setPage]         = useState(1)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Reset to page 1 when layout changes
  useEffect(() => { setPage(1) }, [layout])

  const totalPages   = Math.ceil(images.length / PHOTOS_PER_PAGE)
  const startIdx     = (page - 1) * PHOTOS_PER_PAGE
  const pageImages   = images.slice(startIdx, startIdx + PHOTOS_PER_PAGE)

  // Lightbox navigates across ALL images (not just current page)
  const prev = useCallback(() => {
    setLightbox(i => {
      if (i === null) return 0
      const newIdx = (i - 1 + images.length) % images.length
      // switch page if needed
      const newPage = Math.floor(newIdx / PHOTOS_PER_PAGE) + 1
      setPage(newPage)
      return newIdx
    })
  }, [images.length])

  const next = useCallback(() => {
    setLightbox(i => {
      if (i === null) return 0
      const newIdx = (i + 1) % images.length
      const newPage = Math.floor(newIdx / PHOTOS_PER_PAGE) + 1
      setPage(newPage)
      return newIdx
    })
  }, [images.length])

  const openLightbox = (pageLocalIdx: number) => {
    // Convert page-local index to global index
    const globalIdx = startIdx + pageLocalIdx
    setLightbox(globalIdx)
  }

  const gridClass = layout === 'masonry' ? 'masonry' : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${page}-${layout}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: EX }}
          className={gridClass}
        >
          {pageImages.map((file, i) => {
            const cfg = FRAMES[(startIdx + i) % FRAMES.length]
            return (
              <motion.div
                key={file}
                className={`card-hover ${cfg.frame} cursor-none ${layout === 'masonry' ? 'mb-5' : ''}`}
                style={{ rotate: cfg.tilt }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EX, delay: Math.min(i * 0.05, 0.4) }}
                whileHover={{ scale: 1.04, rotate: 0, y: -8, zIndex: 10, transition: { duration: 0.4, ease: EX } }}
                onClick={() => openLightbox(i)}
              >
                <div className="relative w-full" style={{ paddingBottom: layout === 'grid' ? '75%' : `${cfg.aspect}%`, overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/past-events/${file}`}
                    alt={`Event ${startIdx + i + 1}`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="ov-bottom"/>
                  {/* Expand icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'rgba(10,15,13,0.22)' }}>
                    <FiMaximize2 size={22} style={{ color: 'var(--cream)', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}/>
                  </div>
                  {/* Index badge */}
                  <div className="absolute bottom-2 right-2"
                    style={{ fontFamily: 'var(--f-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', color: 'rgba(240,235,224,0.45)', background: 'rgba(10,15,13,0.65)', padding: '2px 6px' }}>
                    {String(startIdx + i + 1).padStart(2, '0')}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      <Pagination
        current={page}
        total={images.length}
        perPage={PHOTOS_PER_PAGE}
        onChange={setPage}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            images={images}
            index={lightbox}
            folder="past-events"
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
   VIDEO GRID - paginated (local + YouTube)
════════════════════════════════════════════════════════════ */
function VideoGrid({ videos }: { videos: Video[] }) {
  const [page, setPage]    = useState(1)
  const [playing, setPlaying] = useState<number | null>(null)
  const [ytMetadata, setYtMetadata] = useState<Record<string, { title: string; description?: string }>>({})
  const refs = useRef<(HTMLVideoElement | null)[]>([])

  const startIdx  = (page - 1) * VIDEOS_PER_PAGE
  const pageVids  = videos.slice(startIdx, startIdx + VIDEOS_PER_PAGE)

  // Fetch YouTube metadata on mount with delay to prevent initial hang
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchAll = async () => {
        const ytVideos = YOUTUBE_VIDEOS
        const meta: typeof ytMetadata = {}
        for (const yt of ytVideos) {
          const data = await fetchYouTubeMetadata(yt.id)
          if (data) {
            meta[yt.id] = data
          }
        }
        setYtMetadata(meta)
      }
      fetchAll()
    }, 500) // Defer metadata fetch by 500ms to prevent UI hang
    return () => clearTimeout(timer)
  }, [])

  // Stop all videos when page changes
  useEffect(() => {
    refs.current.forEach(v => v?.pause())
    setPlaying(null)
  }, [page])

  const toggle = (localIdx: number) => {
    const v = refs.current[localIdx]
    if (!v) return
    if (v.paused) {
      refs.current.forEach((x, j) => j !== localIdx && x?.pause())
      v.play()
      setPlaying(localIdx)
    } else {
      v.pause()
      setPlaying(null)
    }
  }

  const getVideoTitle = (video: Video): string => {
    if (video.type === 'local') {
      return video.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase()
    } else {
      return ytMetadata[video.id]?.title || `YouTube Video (${video.id})`
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: EX }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {pageVids.map((video, i) => (
            <motion.div
              key={`${video.type}-${video.type === 'youtube' ? video.id : video.filename}`}
              className="photo-luxury card-hover"
              style={{ position: 'relative', paddingBottom: '58%', cursor: 'none' }}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EX, delay: i * 0.07 }}
              onClick={() => video.type === 'local' && toggle(i)}
            >
              {video.type === 'local' ? (
                <>
                  <video
                    ref={el => { refs.current[i] = el }}
                    src={`/past-events-videos/${video.filename}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop playsInline
                    onPlay={e => { e.currentTarget.muted = false; e.currentTarget.volume = 1; }}
                  />

                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ background: playing === i ? 'rgba(10,15,13,0)' : 'rgba(10,15,13,0.45)' }}
                    transition={{ duration: 0.4 }}
                  >
                    <AnimatePresence mode="wait">
                      {playing !== i && (
                        <motion.div key="play"
                          initial={{ opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.75 }}
                          transition={{ duration: 0.3, ease: EX }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ border: '2px solid rgba(var(--fire-rgb),0.7)', background: 'rgba(10,15,13,0.55)', backdropFilter: 'blur(12px)' }}>
                            <FiPlay size={20} style={{ color: 'var(--fire-bright)', marginLeft: 3 }}/>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {playing === i && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1"
                      style={{ background: 'var(--fire)', backdropFilter: 'blur(8px)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-base)', display: 'block', animation: 'pulse 1s infinite' }}/>
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.48rem', letterSpacing: '0.15em', color: 'var(--bg-base)', fontWeight: 600 }}>LIVE</span>
                    </div>
                  )}
                </>
              ) : (
                // YouTube video
                <>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?controls=1&modestbranding=1`}
                    className="absolute inset-0 w-full h-full"
                    title="YouTube video"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: 'none' }}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 z-10"
                    style={{ background: 'var(--fire)', backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.48rem', letterSpacing: '0.15em', color: 'var(--bg-base)', fontWeight: 600 }}>YOUTUBE</span>
                  </div>
                </>
              )}

              <div className="ov-bottom"/>
              <div className="absolute bottom-3 left-4"
                style={{ fontFamily: 'var(--f-mono)', fontSize: '0.52rem', letterSpacing: '0.12em', color: 'var(--cream-40)', maxWidth: 'calc(100% - 3rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getVideoTitle(video)}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <Pagination
        current={page}
        total={videos.length}
        perPage={VIDEOS_PER_PAGE}
        onChange={setPage}
      />
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   TAB BAR + LAYOUT TOGGLE
════════════════════════════════════════════════════════════ */
type Tab = 'all' | 'photos' | 'videos'

function Controls({
  tab, setTab, layout, setLayout, photoCount, videoCount
}: {
  tab: Tab; setTab: (t: Tab) => void
  layout: Layout; setLayout: (l: Layout) => void
  photoCount: number; videoCount: number
}) {
  const tabs: { key: Tab; icon: React.ReactNode; label: string; count: number }[] = [
    { key: 'all',    icon: <PiGridFourFill size={12}/>,     label: 'All',    count: photoCount + videoCount },
    { key: 'photos', icon: <PiImagesSquareFill size={12}/>, label: 'Photos', count: photoCount },
    { key: 'videos', icon: <PiVideoFill size={12}/>,        label: 'Videos', count: videoCount },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-14">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, icon, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2.5 px-5 py-3 transition-all duration-300"
            style={{
              fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              background: tab === key ? 'var(--fire)' : 'transparent',
              color: tab === key ? 'var(--bg-base)' : 'var(--cream-40)',
              border: `1px solid ${tab === key ? 'var(--fire)' : 'rgba(240,235,224,0.1)'}`,
              cursor: 'none',
              clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)',
            }}
          >
            {icon}{label}
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.55rem', padding: '2px 7px', background: tab === key ? 'rgba(0,0,0,0.2)' : 'rgba(240,235,224,0.07)', borderRadius: '1px' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Layout toggle - only for photos */}
      {(tab === 'all' || tab === 'photos') && (
        <div className="flex gap-1">
          {([
            { key: 'masonry' as Layout, icon: <PiSquaresFourFill size={15}/>, label: 'Masonry' },
            { key: 'grid'    as Layout, icon: <PiGridFourFill    size={15}/>, label: 'Grid' },
          ]).map(({ key, icon, label }) => (
            <button key={key} onClick={() => setLayout(key)}
              title={label}
              className="w-9 h-9 flex items-center justify-center transition-all duration-250"
              style={{
                border: `1px solid ${layout === key ? 'var(--fire)' : 'rgba(240,235,224,0.1)'}`,
                background: layout === key ? 'rgba(var(--fire-rgb),0.15)' : 'transparent',
                color: layout === key ? 'var(--fire-bright)' : 'var(--cream-40)',
                cursor: 'none',
              }}
            >{icon}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── SECTION DIVIDER ─────────────────────────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-6 mb-10 pb-4" style={{ borderBottom: '1px solid rgba(240,235,224,0.06)' }}>
      <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.28em', color: 'var(--fire-bright)', textTransform: 'uppercase', flexShrink: 0 }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,rgba(var(--fire-rgb),0.3),transparent)' }}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function GalleryPage() {
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loaded, setLoaded] = useState(false)
  const [tab,    setTab]    = useState<Tab>('all')
  const [layout, setLayout] = useState<Layout>('masonry')

  // Fisher-Yates shuffle
  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  useEffect(() => {
    Promise.all([
      getFiles('past-events'),
      getFiles('past-events-videos'),
    ]).then(([imgs, vids]) => {
      setImages(shuffle(imgs.filter(f => IMG.test(f))))
      
      // Combine local videos with YouTube videos
      const localVideos: LocalVideo[] = vids
        .filter(f => VID.test(f))
        .map(filename => ({ type: 'local' as const, filename }))
      
      const allVideos: Video[] = shuffle([...localVideos, ...YOUTUBE_VIDEOS])
      setVideos(allVideos)
      setLoaded(true)
    })
  }, [])

  return (
    <div className="pg-enter">
      <PageHeader count={images.length + videos.length}/>

      <section id="gallery-section" className="sec" style={{ background: 'var(--bg-mid)', minHeight: '60vh' }}>
        <div className="wrap">

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EX, delay: 0.1 }}
          >
            <Controls
              tab={tab} setTab={setTab}
              layout={layout} setLayout={setLayout}
              photoCount={images.length} videoCount={videos.length}
            />
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
                LOADING MEDIA...
              </p>
            </div>
          )}

          {/* Photos section */}
          {loaded && (tab === 'all' || tab === 'photos') && images.length > 0 && (
            <div style={{ marginBottom: tab === 'all' ? '6rem' : 0 }}>
              {tab === 'all' && <SectionDivider label={`Photos - ${images.length} shots`}/>}
              <PhotoGrid images={images} layout={layout}/>
            </div>
          )}

          {/* Videos section */}
          {loaded && (tab === 'all' || tab === 'videos') && videos.length > 0 && (
            <div>
              {tab === 'all' && <SectionDivider label={`Videos - ${videos.length} clips`}/>}
              <VideoGrid videos={videos}/>
            </div>
          )}

          {/* Empty states */}
          {loaded && tab === 'photos' && images.length === 0 && (
            <div className="text-center py-28">
              <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '3rem', color: 'rgba(240,235,224,0.06)' }}>No photos yet</p>
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--cream-40)', marginTop: '1rem' }}>ADD IMAGES TO /public/past-events</p>
            </div>
          )}
          {loaded && tab === 'videos' && videos.length === 0 && (
            <div className="text-center py-28">
              <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: '3rem', color: 'rgba(240,235,224,0.06)' }}>No videos yet</p>
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--cream-40)', marginTop: '1rem' }}>ADD VIDEOS TO /public/past-events-videos</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}