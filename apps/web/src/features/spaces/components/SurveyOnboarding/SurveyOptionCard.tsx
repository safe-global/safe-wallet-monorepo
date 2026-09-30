import { Check, type LucideIcon } from 'lucide-react'
import type { SurveyOptionDto } from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

interface SurveyOptionCardProps {
  option: SurveyOptionDto
  Icon: LucideIcon | undefined
  isPressed: boolean
  onToggle: (key: string) => void
}

const SurveyOptionCard = ({ option, Icon, isPressed, onToggle }: SurveyOptionCardProps) => (
  <button
    type="button"
    data-testid="survey-option-card"
    aria-pressed={isPressed}
    onClick={() => onToggle(option.key)}
    className={cn(
      'flex h-full cursor-pointer flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      isPressed ? 'border-foreground' : 'border-border hover:border-ring hover:bg-muted',
    )}
  >
    <div className="flex w-full items-start justify-between">
      <div className="flex size-10 items-center justify-center rounded-md bg-[var(--color-success-main)]/15">
        {Icon && <Icon className="size-5 text-[var(--color-success-main)]" strokeWidth={1.75} />}
      </div>
      <div
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors',
          isPressed ? 'border-foreground bg-foreground' : 'border-muted-foreground/40',
        )}
      >
        {isPressed && <Check className="size-3 text-background" strokeWidth={3} />}
      </div>
    </div>
    <Typography variant="paragraph-small-bold">{option.label}</Typography>
  </button>
)

export default SurveyOptionCard
