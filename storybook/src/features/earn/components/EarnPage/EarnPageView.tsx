import type { ReactNode } from 'react'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'

export type EarnPageViewProps = {
  renderBlockedAddress?: (featureTitle: string) => ReactNode
  isConsentAccepted?: boolean
  earnView: ReactNode
  onAccept: () => void
}

export const EarnPageView = ({ renderBlockedAddress, isConsentAccepted, earnView, onAccept }: EarnPageViewProps) => {
  if (renderBlockedAddress) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        {renderBlockedAddress('Earn feature with Kiln')}
      </div>
    )
  }

  return (
    <>
      {isConsentAccepted ? (
        earnView
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Disclaimer
            title="Note"
            content={<WidgetDisclaimer widgetName="Earn Widget by Kiln" />}
            onAccept={onAccept}
            buttonText="Continue"
          />
        </div>
      )}
    </>
  )
}
