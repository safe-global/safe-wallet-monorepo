import type { ReactElement } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { useSafeScope } from './context'

/** Renders what the tx-flow's hooks currently resolve to. Storybook/test aid only — not shipped in any route. */
export const SafeScopeProbe = (): ReactElement => {
  const scope = useSafeScope()
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const sdk = useSafeSDK()
  const provider = useWeb3ReadOnly()

  const rows: Array<[string, string]> = [
    ['scopeKey', scope?.scopeKey ?? '— (no scope: Safe-level behaviour)'],
    ['useChainId()', chainId],
    ['useCurrentChain()', chain?.chainName ?? '—'],
    ['useSafeInfo().safeAddress', safeAddress || '—'],
    ['useSafeInfo().safe.threshold', safeLoaded ? String(safe.threshold) : 'loading…'],
    ['useSafeSDK()', sdk ? 'ready' : '—'],
    ['useWeb3ReadOnly()', provider ? 'ready' : '—'],
  ]

  return (
    <table className="text-sm font-mono">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="pr-4 text-muted-foreground">{label}</td>
            <td data-testid={label}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
