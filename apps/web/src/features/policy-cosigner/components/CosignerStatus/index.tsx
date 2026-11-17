import type { ReactElement } from 'react'
import CosignerStatusView, {
  type CosignerStatusTone,
} from '@safe-global/views/features/policy-cosigner/components/CosignerStatusView'
import type { CosignerState } from '../../types'
import { getCosignerStateMessage, isCosignerBlocking, isCosignerWaiting } from '../../services/cosignerState'

const getTone = (state: CosignerState): CosignerStatusTone => {
  if (state.status === 'ready') return 'success'
  if (state.status === 'unsupportedBatch' || state.status === 'gasNotZero' || state.status === 'unavailable')
    return 'warning'
  if (isCosignerBlocking(state)) return 'destructive'
  return 'info'
}

const CosignerStatus = ({ state }: { state?: CosignerState }): ReactElement | null => {
  if (!state || state.status === 'notRequired') {
    return null
  }

  return (
    <CosignerStatusView
      tone={getTone(state)}
      title="Co-signature"
      message={getCosignerStateMessage(state)}
      loading={isCosignerWaiting(state)}
    />
  )
}

export default CosignerStatus
