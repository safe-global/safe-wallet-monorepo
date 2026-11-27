import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafenetSignerRole } from '@/services/analytics/mixpanel-events'

export const flowSignerRole = ({
  willExecute,
  onlyExecute,
  isCreation,
}: Pick<TxFlowContextType, 'willExecute' | 'onlyExecute' | 'isCreation'>): SafenetSignerRole => {
  if (willExecute || onlyExecute) return SafenetSignerRole.EXECUTOR

  return isCreation ? SafenetSignerRole.FIRST_SIGNER : SafenetSignerRole.CO_SIGNER
}

const confirmationRole = (
  confirmations: MultisigExecutionDetails['confirmations'],
  walletAddress: string,
): SafenetSignerRole | undefined => {
  const inOrder = [...confirmations].sort((a, b) => a.submittedAt - b.submittedAt)
  const position = inOrder.findIndex(({ signer }) => sameAddress(signer.value, walletAddress))
  if (position < 0) return undefined

  return position === 0 ? SafenetSignerRole.FIRST_SIGNER : SafenetSignerRole.CO_SIGNER
}

export const detailsSignerRole = (
  info: MultisigExecutionDetails | undefined,
  walletAddress: string | undefined,
  isQueued?: boolean,
): SafenetSignerRole | undefined => {
  if (!info || !walletAddress) return undefined
  if (sameAddress(info.executor?.value, walletAddress)) return SafenetSignerRole.EXECUTOR

  const confirmed = confirmationRole(info.confirmations, walletAddress)
  if (confirmed) return confirmed

  const canStillSign = isQueued && info.signers.some(({ value }) => sameAddress(value, walletAddress))
  return canStillSign ? SafenetSignerRole.CO_SIGNER : undefined
}
