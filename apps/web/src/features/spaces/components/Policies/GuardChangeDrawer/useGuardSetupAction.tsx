import { useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { AppRoutes } from '@/config/routes'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import { useChain } from '@/hooks/useChains'
import { useUrlSpaceId, withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import type {
  GuardSetupProgress,
  PendingGuardChange,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { PolicyDrawerActionsProps } from '../components/PolicyDrawerActions'
import { buildGuardSetupTx } from './buildGuardSetupTx'

export type GuardSetupActionProps = Pick<
  PolicyDrawerActionsProps,
  'actionLabel' | 'onClick' | 'href' | 'hint' | 'disabled'
>

const MISSING_DETAILS_HINT = "This change's details aren't available, so it can't be continued from here."

/** The drawer's next step for a guard change, or undefined while only time has to pass. */
export const useGuardSetupAction = (
  policy: PendingGuardChange,
  { action, status }: Pick<GuardSetupProgress, 'action' | 'status'>,
): GuardSetupActionProps | undefined => {
  const router = useRouter()
  const { setTxFlow } = useContext(TxModalContext)
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  const { safe, setup } = policy

  const propose = useCallback(
    async (tx: MetaTransactionData, subtitle: string) => {
      // The tx-flow modal resolves the Safe from the URL.
      if (chain) {
        await router.replace(
          { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safe.address}` } },
          undefined,
          { shallow: true },
        )
      }
      setTxFlow(<PolicyBatchFlow txs={[tx]} subtitle={subtitle} />)
    },
    [chain, router, safe.address, setTxFlow],
  )

  if (action === 'review-transaction') {
    if (!setup.transaction || !chain) return undefined
    const txId = `multisig_${safe.address}_${setup.transaction.safeTxHash}`
    const txPath = `${AppRoutes.transactions.tx}?safe=${chain.shortName}:${safe.address}&id=${txId}`
    return { actionLabel: 'Review transaction', href: withSpaceIdInUrl(txPath, spaceId) }
  }

  if (action === 'apply' || action === 'request') {
    const tx = buildGuardSetupTx(setup, safe.chainId, action)
    const actionLabel = action === 'apply' ? 'Apply change' : status === 'expired' ? 'Request again' : 'Request change'
    if (!tx) return { actionLabel, disabled: true, hint: MISSING_DETAILS_HINT }

    return {
      actionLabel,
      onClick: () => void propose(tx, action === 'apply' ? 'Apply policy change' : 'Request policy change'),
    }
  }

  return undefined
}
