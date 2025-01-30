"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VoiceSelector } from "./voice-selector"
import { BroadcastButton } from "./broadcast-button"
import { TextInput } from "./text-input"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import useWebRTCAudioSession, { Tool } from "./use-webrtc"
import { tools as libTools } from "@/lib/tools"

export function ChatWindow() {
  const [voice, setVoice] = useState("alloy")

  // Convert tool definitions to Tool type
  const tools: Tool[] = Object.entries(libTools).map(([name, tool]) => ({
    type: 'function',
    name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters || {}
    }
  }))

  const {
    status,
    isSessionActive,
    handleStartStopClick,
    registerFunction,
    conversation,
    sendTextMessage
  } = useWebRTCAudioSession(voice, tools)

  useEffect(() => {
    const functionNames: Record<string, string> = {
      timeFunction: 'getCurrentTime',
      backgroundFunction: 'changeBackgroundColor',
      weatherFunction: 'getWeather',
      calculatorFunction: 'calculate'
    };
    
    // Register tool implementations
    const toolImplementations: Record<string, (...args: unknown[]) => unknown> = {
      getCurrentTime: () => new Date().toLocaleTimeString(),
      changeBackgroundColor: (...args: unknown[]) => {
        const color = args[0] as string;
        document.body.style.backgroundColor = color;
        return `Background color changed to ${color}`;
      },
      getWeather: () => "It's sunny today!",
      calculate: (...args: unknown[]) => {
        const expression = args[0] as string;
        return eval(expression).toString();
      }
    };

    // Get only the values (function names) from functionNames
    Object.values(functionNames).forEach(name => {
      const implementation = toolImplementations[name];
      if (implementation) {
        registerFunction(name, implementation);
      }
    });
  }, [registerFunction]);

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
