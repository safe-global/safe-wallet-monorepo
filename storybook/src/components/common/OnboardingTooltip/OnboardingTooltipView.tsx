import type { CSSProperties, ReactElement } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import InfoIcon from '@/public/images/notifications/info.svg'

export type OnboardingTooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type OnboardingTooltipViewProps = {
  children: ReactElement
  text: string | ReactElement
  iconShown: boolean
  titleProps: CSSProperties
  tooltipClassName?: string
  placement: OnboardingTooltipPlacement
  onHide: () => void
}

export function OnboardingTooltipView({
  children,
  text,
  iconShown,
  titleProps,
  tooltipClassName,
  placement,
  onHide,
}: OnboardingTooltipViewProps): ReactElement {
  const [sidePart, alignPart] = placement.split('-')
  const side = sidePart as 'top' | 'bottom' | 'left' | 'right'
  const align = alignPart === 'start' ? 'start' : alignPart === 'end' ? 'end' : 'center'

  return (
    <Tooltip open>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} align={align} className={tooltipClassName}>
        <div className="flex items-center gap-2 p-2" style={titleProps}>
          {iconShown && <InfoIcon className="size-5" />}
          <div className="min-w-[150px]">{text}</div>
          <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={onHide}>
            Got it
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
