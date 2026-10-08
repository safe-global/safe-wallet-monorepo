import type { ReactElement } from 'react'

import Disclaimer from '@/components/common/Disclaimer'
import WidgetDisclaimer from '@/components/common/WidgetDisclaimer'

export type DisclaimerWrapperViewProps = {
  widgetName: string
  onAccept: () => void
}

export function DisclaimerWrapperView({ widgetName, onAccept }: DisclaimerWrapperViewProps): ReactElement {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <Disclaimer
        title="Note"
        content={<WidgetDisclaimer widgetName={widgetName} />}
        onAccept={onAccept}
        buttonText="Continue"
      />
    </div>
  )
}
