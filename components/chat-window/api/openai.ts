import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateResponse(message: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは親切なAIアシスタントです。簡潔で分かりやすい日本語で応答してください。"
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error generating response:', error)
    throw error
  }
}

export async function generateSpeech(text: string) {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimizu",
      input: text,
    })

    // Convert the response to a Blob
    const blob = new Blob([await mp3.arrayBuffer()], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error generating speech:', error)
    throw error
  }
}

export async function getEphemeralToken() {
  const token = process.env.OPENAI_API_KEY
  if (!token) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return { client_secret: { value: token } }
}
