"use client"

import React, { useEffect, useState } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import { motion, AnimatePresence } from "framer-motion"
import { Welcome } from "@/components/welcome"
import { VoiceSelector } from "@/components/voice-select"
import { BroadcastButton } from "@/components/broadcast-button"
import { TextInput } from "@/components/text-input"
import { ToolsEducation } from "@/components/tools-education"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export default function App() {
  // State for voice selection
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
    // Register all functions by iterating over the object
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
    <main className="min-h-screen bg-background">
      <motion.div
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Welcome />

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
        
        <div className="space-y-8">
          <ToolsEducation />
        </div>
      </motion.div>
    </main>
  )
}