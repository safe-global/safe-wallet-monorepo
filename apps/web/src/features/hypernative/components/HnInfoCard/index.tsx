import { type ReactElement } from 'react'
import { HypernativeTooltip } from '../HypernativeTooltip'
import type { HypernativeAuthStatus } from '../../hooks/useHypernativeOAuth'
import { HnInfoCardView } from '@views/features/hypernative/components/HnInfoCard/HnInfoCardView'

export interface HnInfoCardProps {
  hypernativeAuth?: HypernativeAuthStatus
  showActiveStatus?: boolean
}

export const HnInfoCard = ({ hypernativeAuth, showActiveStatus = true }: HnInfoCardProps): ReactElement | null => {
  if (!hypernativeAuth || !showActiveStatus) {
    return null
  }

  return <HnInfoCardView renderTooltip={(props) => <HypernativeTooltip {...props} />} />
}
