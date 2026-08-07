import { type ReactElement } from 'react'
import { SvgIcon } from '@mui/material'

import { HypernativeTooltip } from '../HypernativeTooltip'
import SafeShieldIconSvg from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'

import { safeShieldSvgStyles } from './styles'

/**
 * SafeHeaderHnTooltip component
 * Displays the Safe Shield icon with a Hypernative tooltip
 * Only renders when Hypernative Guard is active
 */
export const SafeHeaderHnTooltip = (): ReactElement | null => {
  return (
    <HypernativeTooltip placement="right">
      <SvgIcon component={SafeShieldIconSvg} inheritViewBox sx={safeShieldSvgStyles} />
    </HypernativeTooltip>
  )
}
