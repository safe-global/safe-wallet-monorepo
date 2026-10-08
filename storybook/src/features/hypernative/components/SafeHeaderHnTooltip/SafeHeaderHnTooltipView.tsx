import type { ReactElement, ReactNode } from 'react'
import SafeShieldIconSvg from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import { safeShieldSvgClassName } from './styles'

export type SafeHeaderHnTooltipViewProps = {
  renderTooltip: (props: { side: 'right'; children: ReactNode }) => ReactNode
}

export const SafeHeaderHnTooltipView = ({ renderTooltip }: SafeHeaderHnTooltipViewProps): ReactElement => {
  return <>{renderTooltip({ side: 'right', children: <SafeShieldIconSvg className={safeShieldSvgClassName} /> })}</>
}
