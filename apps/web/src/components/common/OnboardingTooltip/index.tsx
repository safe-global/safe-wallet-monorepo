import type { CSSProperties, ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import {
  OnboardingTooltipView,
  type OnboardingTooltipPlacement,
} from '@views/components/common/OnboardingTooltip/OnboardingTooltipView'

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
  placement?: OnboardingTooltipPlacement
}): ReactElement => {
  const [widgetHidden = !initiallyShown, setWidgetHidden] = useLocalStorage<boolean>(widgetLocalStorageId)

  if (widgetHidden || !text) {
    return children
  }

  return (
    <OnboardingTooltipView
      text={text}
      iconShown={iconShown}
      titleProps={titleProps}
      tooltipClassName={className}
      placement={placement}
      onHide={() => setWidgetHidden(true)}
    >
      {children}
    </OnboardingTooltipView>
  )
}
