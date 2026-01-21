import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Only accept PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })

    // Read file content
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Parse resume with Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf' as const,
                data: base64
              }
            },
            {
              type: 'text',
              text: `Extract the following information from this resume and return it as JSON only, no other text:
{
  "first_name": "",
  "last_name": "",
  "email": "",
  "phone": "",
  "linkedin_url": "",
  "current_title": "",
  "current_company": "",
  "years_experience": null,
  "skills": [],
  "summary": ""
}

For years_experience, estimate based on work history. Return null if cannot determine.
For skills, extract key technical and professional skills as an array.
For summary, write a 2-3 sentence professional summary.
Return ONLY valid JSON, no markdown, no explanation.`
            }
          ]
        }
      ]
    })

    const responseText = (message.content[0] as { type: string; text: string }).text
    
    // Parse JSON response
    let parsed
    try {
      // Clean up response if it has markdown code blocks
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      console.error('Failed to parse response:', responseText)
      return NextResponse.json({ error: 'Failed to parse resume data' }, { status: 500 })
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error('Error parsing resume:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse resume' },
      { status: 500 }
    )
  }
}
