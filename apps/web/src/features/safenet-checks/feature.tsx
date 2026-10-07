import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { SafenetChecksContract } from './types'
import SafenetAuditRow from './components/SafenetAuditRow'
import SafenetChecksSection from './components/SafenetChecksSection'
import type { SafenetDevProposeProps } from './components/SafenetDevPropose'
import SafenetQueueStatus from './components/SafenetQueueStatus'

// The inlined env check folds at build time, so production bundles drop the dev tool's import.
const SafenetDevPropose: ComponentType<SafenetDevProposeProps> =
  process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
    ? () => null
    : dynamic(() => import('./components/SafenetDevPropose'))

const feature: SafenetChecksContract = {
  SafenetAuditRow,
  SafenetChecksSection,
  SafenetDevPropose,
  SafenetQueueStatus,
}

export default feature
