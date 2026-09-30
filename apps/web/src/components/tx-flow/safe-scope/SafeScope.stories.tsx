import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { StoreDecorator } from '@/stories/storeDecorator'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { SafeScopeProvider } from './SafeScopeProvider'
import { useSafeScope, useSafeScopeControls } from './context'
import type { ReactElement } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'

/** Renders what the tx-flow's hooks currently resolve to. Lives in this stories file only — nothing in the app imports it. */
const SafeScopeProbe = (): ReactElement => {
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

// The Safe the URL/Redux would point at on a Safe-level route.
const urlSafe = extendedSafeInfoBuilder().with({ chainId: '11155111' }).build()
// Two Safes a Space-level flow might select.
const safeA = { chainId: '137', safeAddress: extendedSafeInfoBuilder().build().address.value }
const safeB = { chainId: '11155111', safeAddress: extendedSafeInfoBuilder().build().address.value }

const meta = {
  title: 'Components/TxFlow/SafeScope',
  component: SafeScopeProbe,
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{ safeInfo: { data: urlSafe, loaded: true, loading: false, error: undefined } }}>
        <Story />
      </StoreDecorator>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Redux holds the URL Safe (Sepolia). Without a provider the probe shows it; under a SafeScopeProvider it shows the scoped Safe instead. SafeState/SDK rows stay "loading…"/"—" in Storybook because there is no gateway — the point is which Safe and chain the hooks resolve to.',
      },
    },
  },
} satisfies Meta<typeof SafeScopeProbe>

export default meta
type Story = StoryObj<typeof meta>

/** Safe-level baseline: no provider, hooks read Redux/URL. */
export const NoScope: Story = {}

/** Space-level: the probe resolves to the scoped Safe although Redux still holds the URL Safe. */
export const Probe: Story = {
  render: () => (
    <SafeScopeProvider initial={safeA}>
      <SafeScopeProbe />
    </SafeScopeProvider>
  ),
}

const Switcher = () => {
  const { setScope, clearScope } = useSafeScopeControls()
  return (
    <div className="flex gap-2 mb-4">
      <Button size="sm" onClick={() => setScope(safeA.chainId, safeA.safeAddress)}>
        Safe A (Polygon)
      </Button>
      <Button size="sm" onClick={() => setScope(safeB.chainId, safeB.safeAddress)}>
        Safe B (Sepolia)
      </Button>
      <Button size="sm" variant="outline" onClick={clearScope}>
        Clear
      </Button>
    </div>
  )
}

/** Switching mid-flow: every row follows the new Safe; nothing from the previous one lingers. */
export const SwitchScope: Story = {
  render: () => (
    <SafeScopeProvider>
      <Switcher />
      <SafeScopeProbe />
    </SafeScopeProvider>
  ),
}
