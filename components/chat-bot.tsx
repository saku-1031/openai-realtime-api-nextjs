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
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { 
    status,
    isSessionActive,
    handleStartStopClick,
    conversation
  } = useWebRTCAudioSession("alloy", tools)

  useEffect(() => {
    setIsListening(isSessionActive)
  }, [isSessionActive])

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const toggleListening = async () => {
    try {
      setIsConnecting(true)
      handleStartStopClick()
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

  return (
    <Card className={`fixed bottom-4 right-4 w-80 overflow-hidden transition-all duration-300 ${isMinimized ? 'h-12' : 'h-[500px]'}`}>
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
        <h2 className="text-sm font-medium">AI Assistant</h2>
        <div className="flex gap-2">
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Button
              variant={isListening ? "destructive" : "secondary"}
              size="icon"
              className="h-6 w-6"
              onClick={toggleListening}
              disabled={isConnecting}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleMinimize}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(500px-48px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 text-sm ${
                    msg.role === 'assistant'
                      ? 'bg-muted'
                      : 'bg-primary/10 ml-auto'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </Card>
  )
}
