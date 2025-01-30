import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface VoiceSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function VoiceSelector({ value, onValueChange }: VoiceSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px] h-8 text-sm">
        <SelectValue placeholder="音声を選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alloy">Alloy</SelectItem>
        <SelectItem value="echo">Echo</SelectItem>
        <SelectItem value="fable">Fable</SelectItem>
        <SelectItem value="onyx">Onyx</SelectItem>
        <SelectItem value="nova">Nova</SelectItem>
        <SelectItem value="shimmer">Shimmer</SelectItem>
      </SelectContent>
    </Select>
  )
}
