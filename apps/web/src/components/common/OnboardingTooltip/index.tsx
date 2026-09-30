import type { CSSProperties, ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import InfoIcon from '@/public/images/notifications/info.svg'

type Placement =
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

/**
 * The OnboardingTooltip renders a sticky Tooltip with an arrow pointing towards the wrapped component.
 * This Tooltip contains a button to hide it. This decision will be stored in the local storage such that the OnboardingTooltip will only popup until clicked away once.
 */
export const OnboardingTooltip = ({
  children,
  widgetLocalStorageId,
  text,
  initiallyShown = true,
  iconShown = true,
  titleProps = {},
  className,
  placement = 'bottom',
}: {
  children: ReactElement // NB: this has to be an actual HTML element, otherwise the Tooltip will not work
  widgetLocalStorageId: string
  text: string | ReactElement
  initiallyShown?: boolean
  iconShown?: boolean
  titleProps?: CSSProperties
  className?: string
  placement?: Placement
}): ReactElement => {
  const [widgetHidden = !initiallyShown, setWidgetHidden] = useLocalStorage<boolean>(widgetLocalStorageId)

  if (widgetHidden || !text) {
    return children
  }

  const [sidePart, alignPart] = placement.split('-')
  const side = sidePart as 'top' | 'bottom' | 'left' | 'right'
  const align = alignPart === 'start' ? 'start' : alignPart === 'end' ? 'end' : 'center'

  return (
    <Tooltip open>
      <TooltipTrigger render={children as ReactElement} />
      <TooltipContent side={side} align={align} className={className}>
        <div className="flex items-center gap-2 p-2" style={titleProps}>
          {iconShown && <InfoIcon className="size-5" />}
          <div className="min-w-[150px]">{text}</div>
          <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => setWidgetHidden(true)}>
            Got it
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
