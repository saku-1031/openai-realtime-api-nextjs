import { NextResponse } from 'next/server'
import { generateResponse, generateSpeech, getEphemeralToken } from './openai'

export async function POST(req: Request) {
  try {
    // セッショントークンのリクエストの場合
    if (req.headers.get('content-type') === 'application/json') {
      const token = await getEphemeralToken()
      return NextResponse.json(token)
    }

    // 通常のチャットリクエストの場合
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
