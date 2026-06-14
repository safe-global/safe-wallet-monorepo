import { type ReactElement } from 'react'

import { HypernativeTooltip } from '../HypernativeTooltip'
import SafeShieldIconSvg from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'

import { safeShieldSvgClassName } from './styles'

/**
 * SafeHeaderHnTooltip component
 * Displays the Safe Shield icon with a Hypernative tooltip
 * Only renders when Hypernative Guard is active
 */
export const SafeHeaderHnTooltip = (): ReactElement | null => {
  return (
    <HypernativeTooltip side="right">
      <SafeShieldIconSvg className={safeShieldSvgClassName} />
    </HypernativeTooltip>
  )
}
