'use client'

import { useState, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  FiArrowRight, FiCheck, FiSend
} from 'react-icons/fi'
import {
  RiInstagramLine, RiTwitterXLine, RiTiktokLine, RiYoutubeLine,
  RiMapPin2Line, RiMailLine, RiTimeLine, RiPhoneLine
} from 'react-icons/ri'
import {
  PiTreePalm, PiMusicNoteFill, PiTicketFill,
  PiMicrophoneStageFill, PiHandshakeFill, PiChatCenteredTextFill,
  PiNewspaperFill, PiStarFill
} from 'react-icons/pi'

const EX = [0.19, 1, 0.22, 1] as const

/* ════════════════════════════════════════════════════════════
   PAGE HEADER
════════════════════════════════════════════════════════════ */
function PageHeader() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y    = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        minHeight: '62vh',
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 'clamp(4rem, 8vw, 7rem)',
        paddingTop: '120px',
        background: 'linear-gradient(155deg, #0d2b18 0%, #0a0f0d 50%, #130e08 100%)',
      }}
    >
      {/* Ambiience */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: [
          'radial-gradient(ellipse 60% 70% at 8% 60%,  rgba(13,59,26,0.55) 0%, transparent 65%)',
          'radial-gradient(ellipse 55% 55% at 92% 25%, rgba(var(--fire-rgb),0.09) 0%, transparent 60%)',
          'radial-gradient(ellipse 40% 60% at 50% 100%, rgba(45,106,79,0.12) 0%, transparent 60%)',
        ].join(','),
      }}/>
      <div className="absolute inset-0 pointer-events-none bg-dots" style={{ opacity: 0.35 }}/>

      {/* Left vertical fire line */}
      <div className="absolute left-[clamp(1.5rem,6vw,7rem)] top-0 bottom-0 w-px pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(var(--fire-rgb),0.4) 35%, rgba(var(--fire-rgb),0.6) 65%, transparent)' }}/>

      {/* Ghost background word */}
      <div className="absolute bottom-0 right-0 pointer-events-none select-none"
        style={{
          fontFamily: 'var(--f-display)', fontWeight: 900, fontStyle: 'italic',
          fontSize: 'clamp(8rem, 20vw, 20rem)', lineHeight: 0.85,
          color: 'rgba(240,235,224,0.022)', letterSpacing: '-0.04em',
          transform: 'translateX(6%)',
        }}
      >
        Connect
      </div>

      <motion.div style={{ y, opacity: fade }} className="relative z-10 w-full">
        <div className="wrap">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: EX, delay: 0.1 }}
            className="eyebrow" style={{ marginBottom: '2.5rem' }}
          >
            <RiMapPin2Line size={11}/> FUOYE, Oye-Ekiti · Get In Touch
          </motion.div>

          {/* GET */}
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
            >GET</motion.h1>
          </div>

          {/* IN TOUCH - italic fire offset */}
          <div className="overflow-hidden" style={{ marginBottom: '3.5rem' }}>
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
            >In Touch</motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EX, delay: 0.5 }}
          >
            <span className="div-fire" style={{ marginBottom: '1.25rem' }}/>
            <p className="t-body" style={{ maxWidth: '420px', fontSize: '0.95rem' }}>
              Table reservations, artist bookings, brand collabs, or just want to
              vibe with us - the Groove Garden team is ready.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, var(--fire), var(--fire-hot), var(--fire), transparent)' }}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   INQUIRY TYPE SELECTOR
════════════════════════════════════════════════════════════ */
const INQUIRY_TYPES = [
  { key: 'table',  label: 'Table Reservation', icon: <PiTicketFill size={15}/> },
  { key: 'artist', label: 'Artist / DJ Booking', icon: <PiMicrophoneStageFill size={15}/> },
  { key: 'collab', label: 'Brand Collab', icon: <PiHandshakeFill size={15}/> },
  { key: 'press',  label: 'Press / Media', icon: <PiNewspaperFill size={15}/> },
  { key: 'vip',    label: 'VIP Experience', icon: <PiStarFill size={15}/> },
  { key: 'other',  label: 'Other', icon: <PiChatCenteredTextFill size={15}/> },
]

function InquirySelector({
  value, onChange
}: {
  value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.22em', color: 'var(--fire-bright)', display: 'block', marginBottom: '0.9rem', textTransform: 'uppercase' }}>
        Inquiry Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {INQUIRY_TYPES.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="flex items-center gap-2.5 px-4 py-3 transition-all duration-300"
            style={{
              fontFamily: 'var(--f-sans)',
              fontWeight: value === key ? 700 : 400,
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              background: value === key ? 'rgba(var(--fire-rgb),0.14)' : 'rgba(240,235,224,0.025)',
              border: `1px solid ${value === key ? 'rgba(var(--fire-rgb),0.7)' : 'rgba(240,235,224,0.08)'}`,
              color: value === key ? 'var(--fire-bright)' : 'var(--cream-40)',
              cursor: 'none',
              textAlign: 'left',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              if (value !== key) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(var(--fire-rgb),0.35)'
                el.style.color = 'var(--cream-75)'
                el.style.background = 'rgba(240,235,224,0.04)'
              }
            }}
            onMouseLeave={e => {
              if (value !== key) {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(240,235,224,0.08)'
                el.style.color = 'var(--cream-40)'
                el.style.background = 'rgba(240,235,224,0.025)'
              }
            }}
          >
            <span style={{ color: value === key ? 'var(--fire)' : 'var(--cream-40)', flexShrink: 0, transition: 'color 0.3s' }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   INPUT FIELD COMPONENT
════════════════════════════════════════════════════════════ */
function Field({
  label, name, type = 'text', placeholder, value, onChange, required, textarea
}: {
  label: string; name: string; type?: string
  placeholder: string; value: string
  onChange: (v: string) => void
  required?: boolean; textarea?: boolean
}) {
  const [focused, setFocused] = useState(false)

  const sharedStyle: React.CSSProperties = {
    width: '100%',
    background: focused ? 'rgba(var(--fire-rgb),0.05)' : 'rgba(240,235,224,0.025)',
    border: `1px solid ${focused ? 'rgba(var(--fire-rgb),0.7)' : 'rgba(240,235,224,0.09)'}`,
    color: 'var(--cream)',
    fontFamily: 'var(--f-display)',
    fontWeight: 300,
    fontSize: '1rem',
    padding: '1.1rem 1.4rem',
    outline: 'none',
    transition: 'border-color 0.25s, background 0.25s',
    borderRadius: '1px',
    resize: textarea ? 'vertical' : undefined,
    minHeight: textarea ? '140px' : undefined,
  }

  return (
    <div>
      <label style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.22em', color: focused ? 'var(--fire-bright)' : 'rgba(var(--fire-rgb),0.6)', display: 'block', marginBottom: '0.65rem', textTransform: 'uppercase', transition: 'color 0.25s' }}>
        {label}{required && <span style={{ color: 'var(--fire)', marginLeft: '4px' }}>*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...sharedStyle, fontStyle: 'italic' }}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={sharedStyle}
        />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════════════════════════ */
type Status = 'idle' | 'sending' | 'sent' | 'error'

function ContactForm() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', type: 'table', message: ''
  })
  const [status, setStatus] = useState<Status>('idle')

  const set = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) setStatus('sent')
      else throw new Error(data.error || 'Failed to send')
    } catch (err) {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EX }}
        className="flex flex-col items-center justify-center text-center py-16 gap-8"
        style={{ minHeight: '500px' }}
      >
        {/* Animated checkmark circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          className="relative flex items-center justify-center"
          style={{ width: 80, height: 80 }}
        >
          <div className="absolute inset-0 rounded-full"
            style={{ border: '2px solid var(--fire)', animation: 'ping-slow 2s ease-out infinite', opacity: 0.3 }}/>
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ border: '2px solid var(--fire)', background: 'rgba(var(--fire-rgb),0.1)' }}>
            <FiCheck size={28} style={{ color: 'var(--fire-bright)' }}/>
          </div>
        </motion.div>

        <div>
          <h3 style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: 'var(--cream)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Message Sent
          </h3>
          <p className="t-body" style={{ maxWidth: '320px', fontSize: '0.95rem' }}>
            We&apos;ve got your message. The Groove Garden team will be in touch shortly. Keep the vibe going.
          </p>
        </div>

        <button
          onClick={() => { setStatus('idle'); setForm({ name:'', email:'', phone:'', type:'table', message:'' }) }}
          className="btn btn-fire-outline"
          style={{ cursor: 'none' }}
        >
          Send Another
        </button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Form header */}
      <div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 'clamp(1.8rem,3vw,2.6rem)', letterSpacing: '-0.02em', color: 'var(--cream)', lineHeight: 1.1 }}>
          Send a Message
        </h2>
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.57rem', letterSpacing: '0.15em', color: 'var(--cream-40)', marginTop: '0.5rem' }}>
          Fields marked <span style={{ color: 'var(--fire)' }}>*</span> are required
        </p>
      </div>

      {/* Inquiry type */}
      <InquirySelector value={form.type} onChange={set('type')}/>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full Name" name="name" placeholder="Your name" value={form.name} onChange={set('name')} required/>
        <Field label="Email Address" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required/>
      </div>

      {/* Phone */}
      <Field label="Phone Number" name="phone" type="tel" placeholder="+234 000 000 0000" value={form.phone} onChange={set('phone')}/>

      {/* Message */}
      <Field label="Your Message" name="message" placeholder="Tell us what you need, and we'll make it happen..." value={form.message} onChange={set('message')} required textarea/>

      {/* Submit */}
      <div className="flex items-center gap-5 flex-wrap">
        <button
          onClick={handleSubmit}
          disabled={status === 'sending' || !form.name || !form.email || !form.message}
          className="btn btn-fire"
          style={{
            cursor: 'none',
            opacity: (!form.name || !form.email || !form.message) ? 0.5 : 1,
            transition: 'all 0.4s ease',
          }}
        >
          {status === 'sending' ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(10,15,13,0.3)', borderTopColor: 'var(--bg-base)' }}
              />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Message</span>
              <FiSend size={13}/>
            </>
          )}
        </button>

        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', color: '#ff4444' }}
          >
            Something went wrong. Try again.
          </motion.p>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   CONTACT INFO PANEL
════════════════════════════════════════════════════════════ */
const SOCIALS = [
  { icon: <RiInstagramLine size={18}/>, label: 'Instagram', handle: '@groovegardenhq', href: 'https://instagram.com/groovegardenhq' },
  { icon: <RiTwitterXLine  size={16}/>, label: 'X / Twitter', handle: '@groovegardenhq', href: 'https://twitter.com/groovegardenhq' },
  { icon: <RiTiktokLine    size={16}/>, label: 'TikTok', handle: '@groovegardenhq', href: 'https://tiktok.com/@groovegardenhq' },
  { icon: <RiYoutubeLine   size={18}/>, label: 'YouTube', handle: '@GrooveGarden-HQ', href: 'https://www.youtube.com/@GrooveGarden-HQ' },
]

const INFO_ITEMS = [
  {
    icon: <RiMapPin2Line size={18}/>,
    label: 'Location',
    value: 'FUOYE, Oye-Ekiti\nEkiti State, Nigeria',
  },
  {
    icon: <RiMailLine size={18}/>,
    label: 'Email',
    value: 'groovegardenhq@gmail.com',
  },
  {
    icon: <RiPhoneLine size={18}/>,
    label: 'Phone',
    value: '+234 813 750 0025',
  },
  {
    icon: <RiTimeLine size={18}/>,
    label: 'Hours',
    value: 'Every Monday\n10 PM - Till Sunrise',
  },
]

function InfoPanel() {
  return (
    <div className="flex flex-col gap-10">
      {/* Intro text */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '1.5rem' }}>
          <PiTreePalm size={11}/> Let&apos;s Connect
        </div>
        <h3 style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 'clamp(1.6rem,3vw,2.4rem)', lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--cream)', marginBottom: '1.25rem' }}>
          We&apos;re Always<br/>
          <em className="t-fire" style={{ fontStyle: 'italic', fontWeight: 300 }}>In the Building</em>
        </h3>
        <span className="div-fire" style={{ marginBottom: '1.5rem' }}/>
        <p className="t-body" style={{ fontSize: '0.92rem', maxWidth: '320px' }}>
          Whether you&apos;re planning a reservation, pitching a collab, or just trying to link - 
          drop us a message and we&apos;ll come through.
        </p>
      </div>

      {/* Contact details */}
      <div className="flex flex-col gap-5">
        {INFO_ITEMS.map(({ icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EX, delay: i * 0.07 }}
            className="flex items-start gap-5 pb-5"
            style={{ borderBottom: '1px solid rgba(240,235,224,0.06)' }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
              style={{ border: '1px solid rgba(var(--fire-rgb),0.25)', color: 'var(--fire-bright)', background: 'rgba(var(--fire-rgb),0.07)' }}
            >
              {icon}
            </div>
            <div>
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.54rem', letterSpacing: '0.22em', color: 'rgba(var(--fire-rgb),0.55)', marginBottom: '5px', textTransform: 'uppercase' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--f-display)', fontWeight: 300, fontSize: '0.95rem', color: 'var(--cream)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Socials */}
      <div>
        <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', color: 'var(--fire-bright)', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
          Follow The Groove
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SOCIALS.map(({ icon, label, handle, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-3 px-4 py-3 transition-all duration-300 group"
              style={{
                border: '1px solid rgba(240,235,224,0.08)',
                background: 'rgba(240,235,224,0.02)',
                textDecoration: 'none',
                cursor: 'none',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = 'rgba(var(--fire-rgb),0.4)'
                el.style.background  = 'rgba(var(--fire-rgb),0.07)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = 'rgba(240,235,224,0.08)'
                el.style.background  = 'rgba(240,235,224,0.02)'
              }}
            >
              <span style={{ color: 'var(--fire-bright)', flexShrink: 0, transition: 'color 0.3s' }}>
                {icon}
              </span>
              <div>
                <p style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--cream-75)', lineHeight: 1 }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'var(--f-mono)', fontSize: '0.52rem', letterSpacing: '0.1em', color: 'var(--cream-40)', marginTop: '3px' }}>
                  {handle}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MARQUEE STRIP
════════════════════════════════════════════════════════════ */
function MarqueeStrip() {
  const items = ['GROOVE TILL SUNRISE', 'GET IN TOUCH', 'BOOK YOUR TABLE', 'OYE-EKITI', 'GROOVE GARDEN', 'EVERY MONDAY']
  return (
    <div className="relative overflow-hidden py-4"
      style={{ background: 'var(--jungle-deep)', borderTop: '1px solid rgba(240,235,224,0.04)', borderBottom: '1px solid rgba(240,235,224,0.04)' }}>
      <div className="mq-track">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-5 pr-8"
            style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(240,235,224,0.28)', whiteSpace: 'nowrap' }}>
            {t} <PiMusicNoteFill size={8} style={{ opacity: 0.35, flexShrink: 0 }}/>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   FAQ SECTION
════════════════════════════════════════════════════════════ */
const FAQS = [
  {
    q: 'When does Groove Garden happen?',
    a: 'Every Monday night, doors open at 10 PM and the groove runs till sunrise. Set your schedule accordingly.',
  },
  {
    q: 'Where exactly is the venue?',
    a: 'We are located at FUOYE, Oye-Ekiti, Ekiti State. Follow our socials for exact directions before each event.',
  },
  {
    q: 'Can I book a table in advance?',
    a: 'Absolutely. Use the contact form above or slide into our DMs and our team will sort you out with a reservation.',
  },
  {
    q: 'How do I book an artist or DJ slot?',
    a: "Select 'Artist / DJ Booking' in the inquiry form and give us your details. We listen to every pitch.",
  },
  {
    q: 'Do you offer brand sponsorships?',
    a: 'Yes. Select "Brand Collab" in the form. We work with brands that align with the Groove Garden energy.',
  },
]

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="sec" style={{ background: 'var(--bg-mid)', borderTop: '1px solid rgba(240,235,224,0.05)' }}>
      <div className="wrap">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="eyebrow"><PiChatCenteredTextFill size={11}/> FAQs</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontSize: 'clamp(2.8rem,6vw,5.5rem)', lineHeight: 0.92, letterSpacing: '-0.02em', color: 'var(--cream)' }}>
              Common<br/>
              <em className="t-fire" style={{ fontStyle: 'italic', fontWeight: 300 }}>Questions</em>
            </h2>
            <span className="div-fire"/>
          </div>
        </div>

        {/* FAQ items */}
        <div className="flex flex-col gap-2 max-w-3xl">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, ease: EX, delay: i * 0.06 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-6 px-6 text-left transition-all duration-300"
                style={{
                  background: open === i ? 'rgba(var(--fire-rgb),0.07)' : 'rgba(240,235,224,0.025)',
                  border: `1px solid ${open === i ? 'rgba(var(--fire-rgb),0.35)' : 'rgba(240,235,224,0.07)'}`,
                  cursor: 'none',
                  borderLeft: `3px solid ${open === i ? 'var(--fire)' : 'transparent'}`,
                  transition: 'all 0.35s ease',
                }}
                onMouseEnter={e => {
                  if (open !== i) {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(var(--fire-rgb),0.2)'
                    el.style.background = 'rgba(240,235,224,0.04)'
                    el.style.borderLeftColor = 'rgba(var(--fire-rgb),0.4)'
                  }
                }}
                onMouseLeave={e => {
                  if (open !== i) {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(240,235,224,0.07)'
                    el.style.background = 'rgba(240,235,224,0.025)'
                    el.style.borderLeftColor = 'transparent'
                  }
                }}
              >
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 400, fontSize: 'clamp(0.95rem,1.5vw,1.1rem)', color: open === i ? 'var(--cream)' : 'var(--cream-75)', lineHeight: 1.3, transition: 'color 0.3s' }}>
                  {q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: EX }}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center"
                  style={{ border: `1px solid ${open === i ? 'var(--fire)' : 'rgba(240,235,224,0.15)'}`, color: open === i ? 'var(--fire)' : 'var(--cream-40)', transition: 'border-color 0.3s, color 0.3s' }}
                >
                  <FiArrowRight size={12}/>
                </motion.div>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: EX }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-6 pt-4 pb-6"
                      style={{ borderLeft: '3px solid var(--fire)', borderRight: '1px solid rgba(var(--fire-rgb),0.35)', borderBottom: '1px solid rgba(var(--fire-rgb),0.35)', background: 'rgba(var(--fire-rgb),0.04)' }}>
                      <p style={{ fontFamily: 'var(--f-display)', fontWeight: 300, fontSize: '1rem', color: 'var(--cream-75)', lineHeight: 1.8 }}>
                        {a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ContactPage() {
  return (
    <div className="pg-enter">

      <PageHeader/>
      <MarqueeStrip/>

      {/* Main contact section - split layout */}
      <section
        className="sec"
        style={{
          background: 'linear-gradient(160deg, #0a0f0d 0%, #0d1a10 50%, #0a0f0d 100%)',
          borderTop: 'none',
        }}
      >
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20">

            {/* Info panel - left */}
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: EX }}
            >
              <InfoPanel/>
            </motion.div>

            {/* Vertical divider */}
            <div className="hidden lg:block lg:col-span-1 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(var(--fire-rgb),0.25) 25%, rgba(var(--fire-rgb),0.25) 75%, transparent)' }}/>
            </div>

            {/* Form - right */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: EX, delay: 0.1 }}
              style={{
                background: 'rgba(240,235,224,0.02)',
                border: '1px solid rgba(240,235,224,0.06)',
                padding: 'clamp(2rem, 4vw, 3.5rem)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(var(--fire-rgb),0.15) 0%, transparent 60%)' }}/>
              <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
                style={{ background: 'linear-gradient(315deg, rgba(var(--fire-rgb),0.1) 0%, transparent 60%)' }}/>

              <ContactForm/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection/>

      {/* Bottom CTA */}
      {/* <section className="sec-sm"
        style={{ background: 'linear-gradient(135deg, #130e08 0%, #0a0f0d 50%, #0d2b18 100%)', borderTop: '1px solid rgba(240,235,224,0.05)' }}>
        <div className="wrap text-center">
          <div className="eyebrow justify-center" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <PiTreePalm size={11}/> One More Thing <PiTreePalm size={11}/>
          </div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 900, fontSize: 'clamp(2.5rem,6vw,5.5rem)', lineHeight: 0.92, letterSpacing: '-0.02em', color: 'var(--cream)', marginBottom: '0.5rem' }}>
            See You On The
          </h2>
          <h2 className="t-fire glow-fire" style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2.5rem,6vw,5.5rem)', lineHeight: 0.92, letterSpacing: '-0.01em', marginBottom: '2.5rem' }}>
            Dance Floor
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/past-events" className="btn btn-fire">
              <span>View Past Events</span><FiArrowRight size={13}/>
            </Link>
            <Link href="/gallery" className="btn btn-outline">
              Browse Gallery
            </Link>
          </div>
        </div>
      </section> */}

      <style>{`
        @keyframes ping-slow {
          0%   { transform: scale(1);   opacity: 0.3; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}