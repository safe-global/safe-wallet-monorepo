import { useContext, type ReactElement } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import CosignerCheckRow from '@safe-global/views/features/policy-cosigner/components/CosignerCheckRow'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel (same as SafenetChecksSection)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useCosignerState } from '../../hooks/useCosignerState'
import { getCosignerCheck } from '../../services/cosignerCheck'

/** Safe Shield's co-signer check: rendered only for a Safe whose policy guard can require a co-signature */
const CosignerShieldRow = ({ safeTx }: { safeTx?: SafeTransaction }): ReactElement | null => {
  const { txId } = useContext(TxFlowContext)
  const { state } = useCosignerState(safeTx, { isProposed: !!txId })

  if (!state) {
    return null
  }

  const { severity, status, description, details } = getCosignerCheck(state)
  const isFinalProblem = state.status === 'rejected' || state.status === 'invalid' || state.status === 'unavailable'

  return (
    <CosignerCheckRow
      icon={<SeverityIcon severity={severity} />}
      status={status}
      description={description}
      details={details}
      state={state.status}
      defaultOpen={isFinalProblem}
    />
  )
}

export default CosignerShieldRow
