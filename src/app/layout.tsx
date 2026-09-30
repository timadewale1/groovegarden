'use client'

import './globals.css'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi'
import { RiInstagramLine, RiTwitterXLine, RiTiktokLine, RiYoutubeLine } from 'react-icons/ri'
import { PiTreePalm, PiMusicNoteFill } from 'react-icons/pi'
import { Analytics } from '@vercel/analytics/react'

const EX = { ease: [0.19, 1, 0.22, 1], duration: 0.7 } as const

const LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/gallery',     label: 'Gallery' },
  { href: '/past-events', label: 'Past Events' },
  { href: '/contact',     label: 'Contact' },
]

/* ── CURSOR ──────────────────────────────────────────────── */
function Cursor() {
  const dot  = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const pos  = useRef({ x: 0, y: 0 })
  const lag  = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (dot.current) {
        dot.current.style.left = e.clientX + 'px'
        dot.current.style.top  = e.clientY + 'px'
      }
    }
    const loop = () => {
      lag.current.x += (pos.current.x - lag.current.x) * 0.09
      lag.current.y += (pos.current.y - lag.current.y) * 0.09
      if (ring.current) {
        ring.current.style.left = lag.current.x + 'px'
        ring.current.style.top  = lag.current.y + 'px'
      }
      requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', move)
    loop()
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <>
      <div ref={dot}  className="cur-dot" />
      <div ref={ring} className="cur-ring" />
    </>
  )
}

function IndependenceTheme() {
  useEffect(() => {
    const updateTheme = () => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date())
      const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]))
      const dateKey = `${lookup.year}-${lookup.month}-${lookup.day}`
      const isIndependenceWeek = dateKey >= '2026-09-30' && dateKey <= '2026-10-05'
      const wasGreetingDismissed = document.documentElement.dataset.independenceGreeting === 'dismissed'

      if (isIndependenceWeek) {
        document.documentElement.dataset.theme = 'independence'
        if (!wasGreetingDismissed) {
          document.documentElement.dataset.independenceGreeting = 'show'
        }
      } else {
        delete document.documentElement.dataset.theme
        delete document.documentElement.dataset.independenceGreeting
      }
    }

    updateTheme()
    const interval = window.setInterval(updateTheme, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const dismissGreeting = () => {
    document.documentElement.dataset.independenceGreeting = 'dismissed'
  }

  return (
    <div className="independence-welcome" aria-live="polite" aria-atomic="true">
      <div className="independence-confetti" aria-hidden="true">
        {Array.from({ length: 36 }, (_, index) => (
          <span
            key={index}
            className="independence-confetti-piece"
            style={{
              left: `${(index * 37) % 100}%`,
              animationDelay: `${-((index * 13) % 8)}s`,
              animationDuration: `${7 + (index % 6)}s`,
              '--confetti-drift': `${(index % 2 ? 1 : -1) * (24 + (index % 8) * 8)}px`,
              background: index % 3 === 1 ? '#ffffff' : '#008751',
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="independence-welcome-message">
        <span className="independence-flag" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <div className="independence-welcome-copy">
          <strong>Happy Independence Day, Nigeria!</strong>
          <span>Celebrating 66 years of freedom, unity, and culture.</span>
        </div>
        <button type="button" className="btn btn-fire independence-welcome-dismiss" onClick={dismissGreeting} title="Dismiss greeting">
          <span>Let&apos;s groove</span>
          <FiArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── NAVBAR ──────────────────────────────────────────────── */
function Navbar() {
  const path   = usePathname()
  const [filled, setFilled] = useState(false)
  const [open, setOpen]     = useState(false)

  useEffect(() => {
    const fn = () => setFilled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [path])

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[900]"
      animate={{
        background:     filled ? 'rgba(10,15,13,0.92)' : 'transparent',
        backdropFilter: filled ? 'blur(24px) saturate(160%)' : 'none',
        paddingTop:     filled ? '0.75rem' : '1.5rem',
        paddingBottom:  filled ? '0.75rem' : '1.5rem',
        borderBottom:   filled ? '1px solid rgba(240,235,224,0.05)' : '1px solid transparent',
      }}
      transition={{ duration: 0.5, ease: [0.19,1,0.22,1] }}
    >
      <div className="wrap flex items-center justify-between">
        {/* LOGO - bigger & more presence */}
        <Link href="/" className="relative flex-shrink-0 block"
          style={{
            width: 'clamp(140px, 14vw, 200px)',
            height: 'clamp(56px, 5.5vw, 80px)',
          }}>
          <Image
            src="/banners/Groove-Garden-PNG-shadow.png"
            alt="Groove Garden"
            fill priority
            className="object-contain object-left"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-12">
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`nav-item ${path === href ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/contact" className="btn btn-fire"
            style={{ padding: '0.8rem 1.9rem', fontSize: '0.58rem' }}>
            <span>Book a Table</span>
            <FiArrowRight size={11} />
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Menu"
          className="md:hidden flex flex-col gap-[5px] p-1"
          style={{ cursor: 'none' }}
        >
          {[0,1,2].map(i => (
            <motion.span key={i}
              className="block w-[22px]"
              style={{ height: '1px', background: 'var(--cream)', display: 'block' }}
              animate={open
                ? i===0 ? {rotate:45,y:6}
                : i===1 ? {opacity:0}
                : {rotate:-45,y:-6}
                : {rotate:0,y:0,opacity:1}
              }
              transition={{ duration: 0.28 }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.19,1,0.22,1] }}
            style={{ background: 'rgba(10,15,13,0.98)', borderTop: '1px solid rgba(240,235,224,0.05)', overflow: 'hidden' }}
          >
            <div className="wrap py-8 flex flex-col gap-7">
              {LINKS.map(({ href, label }, i) => (
                <motion.div key={href}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                >
                  <Link href={href} className={`nav-item ${path===href?'active':''}`}
                    style={{ fontSize: '0.9rem', letterSpacing: '0.14em' }}>
                    {label}
                  </Link>
                </motion.div>
              ))}
              <Link href="/contact" className="btn btn-fire self-start mt-2">
                <span>Book a Table</span><FiArrowRight size={12}/>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: '#070c09', borderTop: '1px solid rgba(240,235,224,0.05)' }}>

      {/* Big CTA band */}
      <div className="bg-lines" style={{
        background: 'linear-gradient(135deg, #0d2b18 0%, #0a0f0d 60%, #130e08 100%)',
        borderBottom: '1px solid rgba(240,235,224,0.05)',
        padding: 'clamp(4rem,8vw,7rem) 0',
      }}>
        <div className="wrap text-center">
          <p className="eyebrow justify-center mb-6" style={{ justifyContent: 'center' }}>
            <PiTreePalm size={11}/> Oye-Ekiti&apos;s Premier Nightlife
          </p>
          <h2 className="t-section" style={{ color: 'var(--cream)', marginBottom: '0.5rem' }}>
            See You On The
          </h2>
          <h2 className="t-section-italic t-fire glow-fire" style={{ marginBottom: '2.5rem' }}>
            Dance Floor
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn btn-fire">
              <span>Reserve a Spot</span><FiArrowRight size={13}/>
            </Link>
            <Link href="/gallery" className="btn btn-outline">
              View Gallery
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="wrap" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Brand */}
          <div className="md:col-span-5">
            {/* BIGGER LOGO IN FOOTER */}
            <div className="relative mb-6"
              style={{ width: 'clamp(160px,16vw,220px)', height: 'clamp(64px,6.5vw,88px)' }}>
              <Image
                src="/banners/Groove-Garden-PNG-shadow.png"
                alt="Groove Garden" fill
                className="object-contain object-left"
              />
            </div>
            <p className="t-body" style={{ maxWidth: '300px', fontSize: '0.92rem', lineHeight: 1.8 }}>
              Where every Monday becomes a memory. Premium nightlife experience at
              the heart of FUOYE, Oye-Ekiti - groove till the sun comes up.
            </p>
            <div className="flex gap-3 mt-8">
              {[ 
                { icon: <RiInstagramLine size={17}/>, label: 'Instagram', url: 'https://instagram.com/groovegardenhq' },
                { icon: <RiTwitterXLine  size={15}/>, label: 'X', url: 'https://twitter.com/groovegardenhq' },
                { icon: <RiTiktokLine    size={15}/>, label: 'TikTok', url: 'https://tiktok.com/@groovegardenhq' },
                { icon: <RiYoutubeLine   size={17}/>, label: 'YouTube', url: 'https://www.youtube.com/@GrooveGarden-HQ' },
              ].map(({ icon, label, url }) => (
                <a key={label}
                  href={url}
                  target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center transition-all duration-300"
                  style={{ border: '1px solid rgba(240,235,224,0.1)', color: 'var(--cream-40)', borderRadius: '2px' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background='var(--fire)'; el.style.color='var(--bg-base)'; el.style.borderColor='var(--fire)'; el.style.transform='translateY(-3px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background='transparent'; el.style.color='var(--cream-40)'; el.style.borderColor='rgba(240,235,224,0.1)'; el.style.transform='none' }}
                  aria-label={label}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-3 md:col-start-7">
            <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.58rem', letterSpacing:'0.28em', color:'var(--fire-bright)', marginBottom:'1.8rem' }}>
              NAVIGATE
            </p>
            <div className="flex flex-col gap-4">
              {LINKS.map(({ href, label }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 group"
                  style={{ fontFamily:'var(--f-display)', fontWeight:300, fontSize:'1rem', color:'var(--cream-75)', textDecoration:'none', transition:'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='var(--cream)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='var(--cream-75)'}
                >
                  <FiArrowRight size={11} style={{ color:'var(--fire)', flexShrink:0 }}/>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-3">
            <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.58rem', letterSpacing:'0.28em', color:'var(--fire-bright)', marginBottom:'1.8rem' }}>
              FIND US
            </p>
            <div className="flex flex-col gap-5">
              {[
                { l: 'Location', v: 'Champions Cottage, FUOYE, Oye-Ekiti\nEkiti State, Nigeria' },
                { l: 'Contact',  v: 'groovegardenhq@gmail.com' },
                { l: 'Hours',    v: 'Every Monday\n10 PM - Sunrise' },
              ].map(({ l, v }) => (
                <div key={l}>
                  <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.54rem', letterSpacing:'0.2em', color:'rgba(var(--fire-rgb),0.55)', marginBottom:'5px' }}>
                    {l.toUpperCase()}
                  </p>
                  <p style={{ fontFamily:'var(--f-display)', fontWeight:300, fontSize:'0.9rem', color:'var(--cream-75)', lineHeight:1.6, whiteSpace:'pre-line' }}>
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="hr-subtle" style={{ marginBottom: '2rem' }}/>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p style={{ fontFamily:'var(--f-mono)', fontSize:'0.55rem', letterSpacing:'0.14em', color:'rgba(240,235,224,0.22)' }}>
            © {new Date().getFullYear()} GROOVE GARDEN - ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-3"
            style={{ fontFamily:'var(--f-mono)', fontSize:'0.55rem', letterSpacing:'0.14em', color:'rgba(240,235,224,0.22)' }}>
            <PiMusicNoteFill size={10} style={{ color:'var(--fire)' }}/>
            GROOVE TILL SUNRISE
            <PiTreePalm size={11} style={{ color:'var(--fire)' }}/>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── ROOT ────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="has-noise">
        <IndependenceTheme />
        <Cursor />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
