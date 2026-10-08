import { type ReactElement, type ReactNode, type TransitionEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Typography } from '@/components/ui/typography'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '@views/features/safe-shield/components/SeverityIcon'

export interface AnalysisGroupCardViewProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  'data-testid'?: string
  onTransitionEnd: (e: TransitionEvent<HTMLDivElement>) => void
  revealed: boolean
  isVisible: boolean
  delay: number
  severity: Severity
  muted: boolean
  title: string
  items: ReactNode
  footer?: ReactNode
}

export const AnalysisGroupCardView = ({
  isOpen,
  onOpenChange,
  'data-testid': dataTestId,
  onTransitionEnd,
  revealed,
  isVisible,
  delay,
  severity,
  muted,
  title,
  items,
  footer,
}: AnalysisGroupCardViewProps): ReactElement => {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      data-testid={dataTestId}
      onTransitionEnd={onTransitionEnd}
      style={{
        // Capped during the reveal (animatable), uncapped after so tall content isn't clipped.
        overflow: revealed ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
        maxHeight: revealed ? 'none' : isVisible ? 1000 : 0,
        transition: `opacity 0.6s ease-in-out, max-height 0.6s ease-in-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Card header - always visible */}
      <CollapsibleTrigger
        nativeButton={false}
        render={<div className="flex cursor-pointer flex-row items-center justify-between p-3" />}
      >
        <div className="flex flex-row items-center gap-2">
          <SeverityIcon severity={severity} muted={muted} />
          <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
            {title}
          </Typography>
        </div>

        <ChevronDown
          className={`size-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>

      {/* Expanded content */}
      <CollapsibleContent keepMounted>
        <div className="px-3 pt-1 pb-4">
          <div className="flex flex-col gap-2">
            {items}

            {footer}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
