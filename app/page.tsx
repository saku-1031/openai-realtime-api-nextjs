"use client"

import React from "react"
import { motion } from "framer-motion"
import { Welcome } from "@/components/welcome"
import { ToolsEducation } from "@/components/tools-education"
import { ChatWindow } from "@/components/chat-window"

export default function App() {
  return (
    <main className="min-h-screen bg-background">
      <motion.div
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Welcome />
        <ChatWindow />
        <div className="space-y-8">
          <ToolsEducation />
        </div>
      </motion.div>
    </main>
  )
}