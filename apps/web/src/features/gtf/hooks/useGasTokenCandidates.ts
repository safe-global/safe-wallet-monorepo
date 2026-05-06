import { useEffect, useMemo, useState } from 'react'

import { useAppDispatch } from '@/store'
import { gatewayApi } from '@/store/api/gateway'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { IS_PRODUCTION } from '@/config/constants'
import type { FeePreviewTx } from './useResolvedGasToken'

// Staging CGW rate-limits /fees/preview at 5 rps; firing N probes in parallel for a Safe with
// >5 held tokens triggers 429s. Production has a higher limit, so we only stagger off-prod.
const PROBE_STAGGER_MS = IS_PRODUCTION ? 0 : 600

export type GasTokenCandidate = {
  address: string
  symbol: string
  logoUri: string
  decimals: number
  fiatBalance: string
}

export type GasTokenCandidatesResult = {
  candidates: GasTokenCandidate[]
  probing: boolean
  defaultAddress?: string
}

type ProbeStatus = 'usable' | 'rejected'

/**
 * Probes every non-spam token the Safe holds with a balance against `/fees/preview`.
 * A token is "usable" iff the endpoint returns 200 — which per backend means the token
 * has a Coingecko price. Native first, then remaining tokens by fiat balance descending.
 */
export const useGasTokenCandidates = (tx: FeePreviewTx | undefined): GasTokenCandidatesResult => {
  const [balances] = useTrustedTokenBalances()
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()

  const rankedItems = useMemo(() => {
    if (!balances?.items) return []
    const held = balances.items.filter((b) => BigInt(b.balance) > 0n)
    const native = held.find((b) => b.tokenInfo.type === 'NATIVE_TOKEN')
    const others = held
      .filter((b) => b.tokenInfo.type !== 'NATIVE_TOKEN')
      .sort((a, z) => Number(z.fiatBalance) - Number(a.fiatBalance))
    return native ? [native, ...others] : others
  }, [balances])

  const candidatesKey = rankedItems.map((i) => i.tokenInfo.address).join(',')
  const txKey = tx ? `${tx.to}|${tx.value}|${tx.data}|${tx.operation}` : ''

  const [statuses, setStatuses] = useState<Record<string, ProbeStatus>>({})

  useEffect(() => {
    setStatuses({})

    if (!tx || !rankedItems.length || !chain?.chainId || !safeAddress || safe.threshold <= 0) return

    let cancelled = false
    const subs: Array<{ unsubscribe: () => void }> = []
    const timers: ReturnType<typeof setTimeout>[] = []

    // Stagger the probes so the burst stays within CGW's 5 rps budget on /fees/preview.
    // Without this, a Safe holding >5 supported tokens would 429 itself on every fire.
    rankedItems.forEach((item, index) => {
      const timer = setTimeout(() => {
        if (cancelled) return

        const address = item.tokenInfo.address
        const thunk = dispatch(
          gatewayApi.endpoints.getGtfFeePreview.initiate({
            chainId: chain.chainId,
            safeAddress,
            tx: { ...tx, gasToken: address, numberSignatures: safe.threshold },
          }),
        )
        subs.push(thunk)

        thunk
          .unwrap()
          .then(() => {
            if (cancelled) return
            setStatuses((prev) => ({ ...prev, [address]: 'usable' }))
          })
          .catch(() => {
            if (cancelled) return
            setStatuses((prev) => ({ ...prev, [address]: 'rejected' }))
          })
      }, index * PROBE_STAGGER_MS)
      timers.push(timer)
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      subs.forEach((sub) => sub.unsubscribe())
    }
    // `rankedItems` is represented by `candidatesKey`; `tx` by `txKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatesKey, txKey, chain?.chainId, safeAddress, safe.threshold, dispatch])

  const candidates = useMemo<GasTokenCandidate[]>(() => {
    return rankedItems
      .filter((i) => statuses[i.tokenInfo.address] === 'usable')
      .map((i) => ({
        address: i.tokenInfo.address,
        symbol: i.tokenInfo.symbol,
        logoUri: i.tokenInfo.logoUri,
        decimals: i.tokenInfo.decimals,
        fiatBalance: i.fiatBalance,
      }))
  }, [rankedItems, statuses])

  const probing = Boolean(tx) && rankedItems.some((i) => !statuses[i.tokenInfo.address])

  return { candidates, probing, defaultAddress: probing ? undefined : candidates[0]?.address }
}
