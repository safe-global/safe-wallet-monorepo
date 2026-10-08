import { type ReactElement } from 'react'

import { HypernativeTooltip } from '../HypernativeTooltip'
import { SafeHeaderHnTooltipView } from '@views/features/hypernative/components/SafeHeaderHnTooltip/SafeHeaderHnTooltipView'

/**
 * SafeHeaderHnTooltip component
 * Displays the Safe Shield icon with a Hypernative tooltip
 * Only renders when Hypernative Guard is active
 */
export const SafeHeaderHnTooltip = (): ReactElement | null => {
  return <SafeHeaderHnTooltipView renderTooltip={(props) => <HypernativeTooltip {...props} />} />
}
