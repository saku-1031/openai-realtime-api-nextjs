"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Minimize2, Maximize2, Loader2 } from "lucide-react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { Toast } from "@/components/ui/toast"
import { tools } from "@/lib/tools"

export const ChatBot = () => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { 
    status,
    isSessionActive,
    handleStartStopClick,
    registerFunction,
    conversation,
    sendTextMessage
  } = useWebRTCAudioSession("alloy", tools)

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const toggleListening = async () => {
    try {
      handleStartStopClick()
      setIsListening(isSessionActive)
    } catch (error) {
      console.error('Error:', error)
      Toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: status || "マイクの接続に失敗しました。",
      })
      // エラー時は状態をリセット
      setIsListening(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return

    try {
      setIsLoading(true)
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: inputText }])
      setInputText('')

      // Call API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()
      
      if (data.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
        
        // Play audio response
        if (audioRef.current && data.audio) {
          audioRef.current.src = data.audio
          audioRef.current.play()
        }
      }
    } catch (error) {
      console.error('Error:', error)
      Toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: "応答の生成中にエラーが発生しました。",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 新しいメッセージが追加されたら自動スクロール
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      <Card className={`fixed bottom-4 right-4 w-[400px] ${isMinimized ? 'h-[60px]' : 'h-[500px]'} transition-all duration-300 overflow-hidden shadow-lg z-50`}>
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-3 bg-primary text-primary-foreground">
          <h3 className="font-semibold">AI アシスタント</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isConnecting}
              className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMinimize}
              className="h-8 w-8 text-primary-foreground hover:text-primary-foreground/80"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex flex-col h-[calc(100%-120px)] p-4 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "送信中..." : "送信"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
