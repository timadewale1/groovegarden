'use client'

import { BrowserQRCodeReader } from '@zxing/browser'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FiArrowRight, FiCamera, FiCheck, FiCheckCircle, FiClock, FiHash, FiLock, FiLogOut, FiXCircle } from 'react-icons/fi'

type Redemption = {
  status: 'valid' | 'used' | 'not_found'
  ticket_code: string | null
  full_name: string | null
  event_name: string | null
  event_date: string | null
  used_at: string | null
}

export default function TicketVerificationClient() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loginCode, setLoginCode] = useState('')
  const [ticketCode, setTicketCode] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Redemption | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    fetch('/api/tickets/session', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Could not check the staff session.')
        const body = await response.json() as { authenticated?: unknown }
        setAuthenticated(body.authenticated === true)
      })
      .catch(() => setError('Could not check the staff session. Refresh and try again.'))
      .finally(() => setCheckingSession(false))
  }, [])

  const redeem = useCallback(async (value: string) => {
    const normalizedCode = value.trim()
    if (!/^\d{5}$/.test(normalizedCode)) {
      setError('Ticket codes must contain exactly five digits.')
      return
    }

    setIsBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/tickets/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode }),
      })
      const body = await response.json() as { error?: unknown } & Partial<Redemption>
      if (!response.ok) {
        if (response.status === 401) setAuthenticated(false)
        throw new Error(typeof body.error === 'string' ? body.error : 'Ticket verification failed.')
      }
      if (!['valid', 'used', 'not_found'].includes(body.status ?? '')) {
        throw new Error('Ticket verification returned an invalid response.')
      }
      setResult(body as Redemption)
      setTicketCode(normalizedCode)
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Ticket verification failed.')
    } finally {
      setIsBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!isScanning || !videoRef.current) return

    let cancelled = false
    let handled = false
    let controls: { stop: () => void } | undefined
    setError('')

    const startScanner = async () => {
      try {
        const reader = new BrowserQRCodeReader()
        const scannerControls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, _scanError, scannerControls) => {
            if (!result || handled) return
            handled = true
            scannerControls.stop()
            setIsScanning(false)
            const scannedValue = result.getText().trim()
            setTicketCode(scannedValue)
            void redeem(scannedValue)
          },
        )
        controls = scannerControls
        if (cancelled) scannerControls.stop()
      } catch {
        if (!cancelled) {
          setIsScanning(false)
          setError('Could not access the camera. Allow camera access or enter the ticket ID manually.')
        }
      }
    }

    void startScanner()
    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [isScanning, redeem])

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsBusy(true)
    setError('')
    try {
      const response = await fetch('/api/tickets/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: loginCode }),
      })
      const body = await response.json() as { error?: unknown }
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Could not log in.')
      setAuthenticated(true)
      setLoginCode('')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not log in.')
    } finally {
      setIsBusy(false)
    }
  }

  const logout = async () => {
    await fetch('/api/tickets/session', { method: 'DELETE' })
    setAuthenticated(false)
    setIsScanning(false)
    setResult(null)
    setTicketCode('')
  }

  return (
    <div className="verifier-page">
      <main className="verifier-main">
        <header className="verifier-topbar">
          <Link className="verifier-brand" href="/" aria-label="Groove Garden home">
            <Image
              src="/banners/Groove-Garden-PNG-shadow.png"
              alt="Groove Garden"
              width={190}
              height={76}
              priority
            />
          </Link>
          {authenticated && (
            <div className="verifier-staff-pill"><span/>Staff console</div>
          )}
        </header>

        {checkingSession ? (
          <section className="verifier-loading" aria-live="polite">
            <span className="verifier-spinner"/>
            <p>Checking secure staff access</p>
          </section>
        ) : !authenticated ? (
          <section className="verifier-login-wrap">
            <div className="verifier-overline"><span/> SECURE ENTRY CONTROL</div>
            <h1 className="verifier-title">Ticket<br/><em>verification.</em></h1>
            <p className="verifier-intro">Sign in with your staff access code to validate guest tickets at the door.</p>

            <form onSubmit={login} className="verifier-card verifier-login-card">
              <div className="verifier-card-icon"><FiLock size={19}/></div>
              <div>
                <h2>Staff sign in</h2>
                <p>Authorized event staff only</p>
              </div>
              <label className="verifier-label" htmlFor="staff-code">Access code</label>
              <input
                id="staff-code"
                className="verifier-input"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="Enter your staff code"
                required
                value={loginCode}
                onChange={event => setLoginCode(event.target.value)}
              />
              {error && <p role="alert" className="verifier-inline-error">{error}</p>}
              <button type="submit" className="verifier-primary-button" disabled={isBusy}>
                {isBusy ? 'Verifying access…' : <>Continue securely <FiArrowRight size={16}/></>}
              </button>
              <p className="verifier-secure-note"><FiLock size={12}/> Protected staff session · Expires after 12 hours</p>
            </form>
          </section>
        ) : (
          <section className="verifier-console">
            <div className="verifier-console-heading">
              <div>
                <div className="verifier-overline"><span/> DOOR CHECK-IN</div>
                <h1 className="verifier-title">Verify a<br/><em>ticket.</em></h1>
                <p className="verifier-intro">Scan the guest’s QR code or enter the five-digit ticket ID.</p>
              </div>
              <button type="button" className="verifier-logout" onClick={() => { void logout() }}>
                <FiLogOut size={15}/> <span>Sign out</span>
              </button>
            </div>

            <div className="verifier-methods">
              <form onSubmit={event => { event.preventDefault(); void redeem(ticketCode) }} className="verifier-card verifier-manual-card">
                <div className="verifier-card-heading">
                  <span className="verifier-method-icon"><FiHash size={18}/></span>
                  <div><h2>Enter ticket ID</h2><p>Type the code printed on the ticket</p></div>
                </div>
                <label className="verifier-label" htmlFor="ticket-code">5-digit ticket code</label>
                <input
                  id="ticket-code"
                  className="verifier-code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  placeholder="00000"
                  required
                  value={ticketCode}
                  onChange={event => setTicketCode(event.target.value.replace(/\D/g, '').slice(0, 5))}
                />
                <button type="submit" className="verifier-primary-button" disabled={isBusy || isScanning}>
                  {isBusy ? 'Checking ticket…' : <>Verify and admit <FiArrowRight size={16}/></>}
                </button>
              </form>

              <section className={`verifier-card verifier-scanner-card ${isScanning ? 'is-scanning' : ''}`}>
                <div className="verifier-card-heading">
                  <span className="verifier-method-icon"><FiCamera size={18}/></span>
                  <div><h2>Scan QR code</h2><p>Use the camera on this device</p></div>
                </div>
                {isScanning ? (
                  <div className="verifier-camera-frame">
                    <video ref={videoRef} muted playsInline aria-label="Camera scanning ticket QR code"/>
                    <span className="verifier-scan-line"/>
                    <span className="verifier-corner verifier-corner-tl"/>
                    <span className="verifier-corner verifier-corner-tr"/>
                    <span className="verifier-corner verifier-corner-bl"/>
                    <span className="verifier-corner verifier-corner-br"/>
                  </div>
                ) : (
                  <div className="verifier-camera-placeholder">
                    <span><FiCamera size={25}/></span>
                    <p>Camera scanner is ready</p>
                    <small>Position the QR code inside the frame</small>
                  </div>
                )}
                <button
                  type="button"
                  className={isScanning ? 'verifier-secondary-button verifier-stop-button' : 'verifier-secondary-button'}
                  disabled={isBusy}
                  onClick={() => setIsScanning(value => !value)}
                >
                  {isScanning ? 'Stop scanning' : 'Start camera scanner'}
                </button>
                <p className="verifier-camera-note">Camera access requires permission and a secure HTTPS connection.</p>
              </section>
            </div>

            {error && <p role="alert" className="verifier-inline-error verifier-global-error">{error}</p>}

            {result && (
              <section
                className={`verifier-result verifier-result-${result.status}`}
                role="status"
                aria-live="polite"
              >
                <div className="verifier-result-icon">
                  {result.status === 'valid' ? <FiCheckCircle size={25}/> : <FiXCircle size={25}/>}
                </div>
                <div className="verifier-result-content">
                  <div className="verifier-result-eyebrow">
                    {result.status === 'valid' ? 'CHECK-IN APPROVED' : 'CHECK-IN DENIED'}
                  </div>
                  <h2>
                    {result.status === 'valid' ? 'Valid ticket — admit guest' : result.status === 'used' ? 'Ticket already used' : 'Ticket not found'}
                  </h2>
                  {result.status === 'valid' ? (
                    <div className="verifier-guest-details">
                      <strong>{result.full_name}</strong>
                      <span>{result.event_name} · {result.event_date}</span>
                      <span>Ticket ID <b>{result.ticket_code}</b></span>
                    </div>
                  ) : (
                    <p className="verifier-result-note">
                      {result.status === 'used'
                        ? `This ticket was already checked in${result.used_at ? ` at ${new Date(result.used_at).toLocaleString()}` : ''}. Do not admit again.`
                        : 'No paid ticket matches this code. Do not admit.'}
                    </p>
                  )}
                </div>
                {result.status === 'valid' && <FiCheck className="verifier-approved-check" size={22}/>}
              </section>
            )}
          </section>
        )}

        <footer className="verifier-footer">
          <span>GROOVE GARDEN</span>
          <span><FiClock size={12}/> Secure check-in system</span>
        </footer>
      </main>
    </div>
  )
}
