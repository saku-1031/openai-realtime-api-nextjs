import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { useState } from "react"

interface TextInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function TextInput({ onSubmit, disabled }: TextInputProps) {
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text)
      setText("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="メッセージを入力..."
        disabled={disabled}
        className="text-sm"
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={disabled || !text.trim()}
        className="h-9 w-9"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
