import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { StoreDecorator } from '@/stories/storeDecorator'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { SafeScopeProvider } from './SafeScopeProvider'
import { useSafeScopeControls } from './context'
import { SafeScopeProbe } from './SafeScopeProbe'

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

/** Space-level: the probe resolves to the scoped Safe although Redux still holds the URL Safe (C17c). */
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

/** Switching mid-flow: every row follows the new Safe; nothing from the previous one lingers (C17e). */
export const SwitchScope: Story = {
  render: () => (
    <SafeScopeProvider>
      <Switcher />
      <SafeScopeProbe />
    </SafeScopeProvider>
  ),
}
