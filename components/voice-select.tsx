import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "@/components/translations-context"

interface VoiceSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function VoiceSelector({ value, onValueChange }: VoiceSelectorProps) {
  const { t } = useTranslations()
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px] h-8 text-sm">
        <SelectValue placeholder={t('voice.select')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="alloy">{t('voice.alloy')}</SelectItem>
        <SelectItem value="echo">{t('voice.echo')}</SelectItem>
        <SelectItem value="fable">{t('voice.fable')}</SelectItem>
        <SelectItem value="onyx">{t('voice.onyx')}</SelectItem>
        <SelectItem value="nova">{t('voice.nova')}</SelectItem>
        <SelectItem value="shimmer">{t('voice.shimmer')}</SelectItem>
      </SelectContent>
    </Select>
  )
}