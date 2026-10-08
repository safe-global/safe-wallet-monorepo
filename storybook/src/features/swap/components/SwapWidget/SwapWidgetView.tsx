import type { ReactNode } from 'react'
import css from '../../styles.module.css'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'

export type SwapWidgetViewProps = {
  renderBlockedAddress?: (featureTitle: string) => ReactNode
  isConsentAccepted: boolean
  onAccept: () => void
  widget: ReactNode
}

export const SwapWidgetView = ({ renderBlockedAddress, isConsentAccepted, onAccept, widget }: SwapWidgetViewProps) => {
  if (renderBlockedAddress) {
    return <>{renderBlockedAddress('embedded swaps feature with CoW Swap')}</>
  }

  if (!isConsentAccepted) {
    return (
      <Disclaimer
        title="Note"
        content={<WidgetDisclaimer widgetName="CoW Swap Widget" />}
        onAccept={onAccept}
        buttonText="Continue"
      />
    )
  }

  return (
    <div className={css.swapWidget} id="swapWidget">
      {widget}
    </div>
  )
}
