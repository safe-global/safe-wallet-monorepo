import type { ReactElement } from 'react'

export type BridgeViewProps = {
  widget: ReactElement
  renderSanctionWrapper: (featureTitle: string, children: ReactElement) => ReactElement
  renderDisclaimerWrapper: (widgetName: string, children: ReactElement) => ReactElement
}

export function BridgeView({ widget, renderSanctionWrapper, renderDisclaimerWrapper }: BridgeViewProps): ReactElement {
  return renderSanctionWrapper('bridge feature with LI.FI', renderDisclaimerWrapper('Bridging Widget by LI.FI', widget))
}
