import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export const FeatureCheck = ({ isEmphasized }: { isEmphasized?: boolean }) => (
  <span
    aria-hidden
    className={cn(
      'flex size-5 shrink-0 items-center justify-center rounded-full',
      isEmphasized ? 'bg-foreground text-background' : 'bg-muted',
    )}
  >
    <Check className="size-3" strokeWidth={2} />
  </span>
)
