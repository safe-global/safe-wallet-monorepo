import { useCallback, useContext } from 'react'
import { useRouter } from 'next/router'
import type { Address } from 'viem'
import type { PendingPolicy } from '@safe-global/store/gateway/policies/types'
import useChains from '@/hooks/useChains'
import { logError, Errors } from '@/services/exceptions'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import type { SafeRef } from '../safeRefs'
import { encodeApplyConfiguration } from '../shared/guardTx'
import { resolveApplyPlan, type ApplyPlan } from '../shared/applyPlan'
import { usePolicyRequests, type PolicyRequest } from '../policyRequestStore'

export type PendingRow = { pending: PendingPolicy; local?: PolicyRequest }

/** The guard a locally-stored request was made against. */
export const localGuardOf = (local: PolicyRequest | undefined): string | undefined =>
  local?.enforcement.via === 'guard' ? local.enforcement.guards.transactionGuard?.safePolicyGuard : undefined

/** Whether this row can be applied, and with which payload. */
export const applyPlanOf = (row: PendingRow, nowSec: number): ApplyPlan =>
  resolveApplyPlan({
    pending: row.pending,
    local: row.local ? { configurations: row.local.configurations, guard: localGuardOf(row.local) } : undefined,
    nowSec,
  })

/**
 * Proposes the `applyConfiguration` transaction for a pending request.
 *
 * Points the app at the row's Safe first — the tx-flow modal resolves the active Safe
 * from the URL — then hands off the transaction. On submission the local snapshot is
 * dropped and the pending list re-read.
 */
export const useApplyPendingPolicy = (safe: SafeRef, onApplied?: () => void): ((row: PendingRow) => Promise<void>) => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { setTxFlow } = useContext(TxModalContext)
  const { remove } = usePolicyRequests(safe.chainId, safe.address)

  return useCallback(
    async (row: PendingRow) => {
      const plan = applyPlanOf(row, Math.floor(Date.now() / 1000))

      if (!plan.canApply) {
        // The action is disabled in this state; log if it is reached anyway.
        if (plan.reason === 'root-mismatch') logError(Errors._823, `configureRoot ${row.pending.configureRoot}`)
        return
      }

      const tx = encodeApplyConfiguration(plan.guard as Address, plan.configurations)

      const chain = chains.find((c) => c.chainId === safe.chainId)
      if (chain) {
        await router.replace(
          { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safe.address}` } },
          undefined,
          { shallow: true },
        )
      }

      setTxFlow(
        <PolicyBatchFlow
          txs={[tx]}
          subtitle="Apply policy change"
          onSubmit={(args) => {
            if (!args?.txId) return
            if (row.local) remove(row.local.id)
            onApplied?.()
          }}
        />,
      )
    },
    [chains, onApplied, remove, router, safe.address, safe.chainId, setTxFlow],
  )
}
