"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VoiceSelector } from "./voice-selector"
import { BroadcastButton } from "./broadcast-button"
import { TextInput } from "./text-input"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import useWebRTCAudioSession from "./use-webrtc"
import { tools } from "@/lib/tools"

export function ChatWindow() {
  const [voice, setVoice] = useState("alloy")

  const {
    status,
    isSessionActive,
    startSession,
    stopSession,
    handleStartStopClick,
    registerFunction,
    msgs,
    conversation,
    sendTextMessage
  } = useWebRTCAudioSession(voice, tools)

  useEffect(() => {
    Object.entries(tools).forEach(([name, func]) => {
      const functionNames: Record<string, string> = {
        timeFunction: 'getCurrentTime',
        backgroundFunction: 'changeBackgroundColor',
        weatherFunction: 'getWeather',
        calculatorFunction: 'calculate'
      };
      
      registerFunction(functionNames[name], func);
    });
  }, [registerFunction, tools])

  return (
    <motion.div 
      className="fixed bottom-4 right-4 w-80 bg-card text-card-foreground rounded-xl border shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <VoiceSelector value={voice} onValueChange={setVoice} />
        <BroadcastButton 
          isSessionActive={isSessionActive} 
          onClick={handleStartStopClick}
        />
      </div>
      
      <div className="p-3 space-y-3">
        <AnimatePresence>
          {status && status.includes("Error") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-destructive/10 text-destructive text-sm p-2 rounded-md flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{status}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {conversation.length > 0 && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 rounded-lg text-sm",
                  msg.role === "assistant" 
                    ? "bg-muted" 
                    : "bg-primary/10 ml-auto"
                )}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}

        {status && (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TextInput 
              onSubmit={sendTextMessage}
              disabled={!isSessionActive}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
