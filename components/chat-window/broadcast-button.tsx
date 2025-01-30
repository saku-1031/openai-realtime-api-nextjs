import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

interface BroadcastButtonProps {
  isSessionActive: boolean
  onClick: () => void
}

export function BroadcastButton({ isSessionActive, onClick }: BroadcastButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={isSessionActive ? "destructive" : "secondary"}
      size="sm"
      className="h-8 px-3 gap-1.5"
    >
      {isSessionActive ? (
        <>
          <MicOff className="h-3.5 w-3.5" />
          停止
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5" />
          開始
        </>
      )}
    </Button>
  )
}
