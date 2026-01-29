import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      recruiter_email, 
      recruiter_name,
      company_name, 
      name, 
      email, 
      phone, 
      preferred_contact, 
      notes 
    } = body

    if (!recruiter_email || !company_name || !name || !email || !notes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Talent Request</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Hi ${recruiter_name || 'there'},
          </p>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            You have received a new request from someone looking for help finding talent.
          </p>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 0;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Company:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${company_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Name:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">
                  <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">
                  <a href="tel:${phone}" style="color: #2563eb;">${phone}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Preferred Contact:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500; text-transform: capitalize;">${preferred_contact}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px;">
            <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 0;">Their Request</h2>
            <p style="color: #374151; white-space: pre-wrap; margin: 0;">${notes}</p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This request was submitted via your Search Market recruiter page.</p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'Search Market <notifications@search.market>',
      to: recruiter_email,
      replyTo: email,
      subject: `New Talent Request from ${name} at ${company_name}`,
      html: emailHtml
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending contact email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
