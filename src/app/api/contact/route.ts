import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  const { name, email, phone, type, message } = await req.json()

  // Configure transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GG_MAIL_USER,
      pass: process.env.GG_MAIL_PASS,
    },
  })

  // Try to get logo as base64
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public/banners/Groove-Garden-PNG-shadow.png')
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      logoBase64 = logoBuffer.toString('base64')
    }
  } catch (err) {
    console.error('Failed to read logo:', err)
  }

  const logoHtml = logoBase64 && logoBase64.length < 200000
    ? `<div style="text-align:center;padding:0 0 24px 0;"><img src="data:image/png;base64,${logoBase64}" alt="Groove Garden" style="max-width:160px;height:auto;display:block;margin:0 auto;" /></div>`
    : ''

  // Map inquiry types to readable labels
  const typeLabels: Record<string, string> = {
    table: 'Table Reservation',
    artist: 'Artist / DJ Booking',
    collab: 'Brand Collab',
    press: 'Press / Media',
    vip: 'VIP Experience',
    other: 'Other',
  }
  const typeLabel = typeLabels[type as keyof typeof typeLabels] || type

  // Admin mail HTML
  const adminHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#070c09;font-family:Georgia,serif;">
<div style="max-width:600px;width:100%;background:#0a0f0d;margin:20px auto;border-left:4px solid #e85d04;">
  <div style="padding:32px;text-align:center;">
    ${logoHtml}
    <h1 style="color:#e85d04;font-size:28px;margin:0 0 16px 0;border-bottom:2px solid #e85d04;padding-bottom:16px;font-weight:normal;">New Contact Form Submission</h1>
  </div>
  <div style="padding:0 32px 32px 32px;color:#f0ebe0;">
    <table style="width:100%;border-collapse:collapse;background:#18130c;margin:24px 0;">
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Name:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${name}</td></tr>
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Email:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${email}</td></tr>
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Phone:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${phone || '—'}</td></tr>
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Type:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${typeLabel}</td></tr>
      <tr><td colspan="2" style="padding:0;"><div style="padding:15px;background:rgba(232,93,4,0.08);border-left:3px solid #e85d04;color:#f0ebe0;word-wrap:break-word;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</div></td></tr>
    </table>
  </div>
  <div style="padding:24px 32px;border-top:1px solid rgba(232,93,4,0.3);color:#e85d04;font-size:14px;text-align:center;">
    Groove Garden Website · ${new Date().toLocaleString()}
  </div>
</div>
</body>
</html>`

  // User mail HTML
  const userHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#070c09;font-family:Georgia,serif;">
<div style="max-width:600px;width:100%;background:#0a0f0d;margin:20px auto;border-left:4px solid #e85d04;">
  <div style="padding:32px;text-align:center;">
    ${logoHtml}
    <h1 style="color:#e85d04;font-size:28px;margin:0 0 16px 0;border-bottom:2px solid #e85d04;padding-bottom:16px;font-weight:normal;">Thank you for contacting Groove Garden!</h1>
  </div>
  <div style="padding:0 32px 32px 32px;color:#f0ebe0;line-height:1.6;">
    <p style="margin:12px 0;font-size:16px;">Hi <strong>${name}</strong>,</p>
    <p style="margin:12px 0;font-size:16px;">We received your message and will get back to you soon.<br/>Here's what you sent us:</p>
    <table style="width:100%;border-collapse:collapse;background:#18130c;margin:24px 0;">
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Name:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${name}</td></tr>
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Email:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${email}</td></tr>
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Phone:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${phone || '—'}</td></tr>
      <tr><td style="padding:10px 12px;color:#e85d04;font-weight:600;text-align:right;width:100px;">Type:</td><td style="padding:10px 12px;color:#f0ebe0;border-bottom:1px solid rgba(232,93,4,0.15);">${typeLabel}</td></tr>
      <tr><td colspan="2" style="padding:0;"><div style="padding:15px;background:rgba(232,93,4,0.08);border-left:3px solid #e85d04;color:#f0ebe0;word-wrap:break-word;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</div></td></tr>
    </table>
  </div>
  <div style="padding:24px 32px;border-top:1px solid rgba(232,93,4,0.3);color:#e85d04;font-size:14px;text-align:center;font-style:italic;">
    Groove on!<br/>The Groove Garden Team
  </div>
</div>
</body>
</html>`

  try {
    // Send to user (receiver)
    await transporter.sendMail({
      from: process.env.GG_MAIL_USER,
      to: email,
      subject: 'Groove Garden – We got your message!',
      html: userHtml,
    })
    // Send to admin
    await transporter.sendMail({
      from: process.env.GG_MAIL_USER,
      to: process.env.GG_MAIL_RECEIVER,
      subject: `Groove Garden Contact: ${type}`,
      html: adminHtml,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}
