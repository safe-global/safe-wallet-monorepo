import type { ReactNode } from 'react'
import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'

export type StakePageViewProps = {
  renderBlockedAddress?: (featureTitle: string) => ReactNode
  isConsentAccepted?: boolean
  stakingWidget: ReactNode
  onAccept: () => void
}

export const StakePageView = ({
  renderBlockedAddress,
  isConsentAccepted,
  stakingWidget,
  onAccept,
}: StakePageViewProps) => {
  if (renderBlockedAddress) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        {renderBlockedAddress('stake feature with Kiln')}
      </div>
    )
  }

  return (
    <>
      {isConsentAccepted === undefined ? null : isConsentAccepted ? (
        stakingWidget
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Disclaimer
            title="Note"
            content={<WidgetDisclaimer widgetName="Stake Widget by Kiln" />}
            onAccept={onAccept}
            buttonText="Continue"
          />
        </div>
      )}
    </>
  )
}
