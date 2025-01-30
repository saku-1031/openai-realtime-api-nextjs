import { NextResponse } from 'next/server'
import { generateResponse, generateSpeech } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    
    // テキスト応答を生成
    const textResponse = await generateResponse(message)
    
    // 音声を生成
    const audioUrl = await generateSpeech(textResponse || '')
    
    return NextResponse.json({ 
      text: textResponse,
      audio: audioUrl
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
