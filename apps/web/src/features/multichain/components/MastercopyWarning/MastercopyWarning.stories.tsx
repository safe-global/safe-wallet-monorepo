import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { MastercopyWarning } from './MastercopyWarning'

// Official 1.3.0 L1 singleton — isUnsupportedMastercopyMigratable recognises it via its address fallback.
const OFFICIAL_SINGLETON = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
// Address served as a Gnosis master copy by the Storybook master-copies handler.
const GNOSIS_MASTERCOPY = '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766'
// A third-party fork with no official match.
const THIRD_PARTY_FORK = '0x0000000000000000000000000000000000000dEaD'

const storyFor = (
  data: {
    implementationVersionState: ImplementationVersionState
    version: string
    implementation: { value: string }
  },
  variant?: 'dashboard' | 'settings',
): StoryObj<typeof MastercopyWarning> => {
  const setup = createMockStory({
    wallet: 'owner',
    layout: 'paper',
    store: {
      safeInfo: {
        data: { chainId: '1', ...data },
        loading: false,
        loaded: true,
      },
    },
  })
  return { args: variant ? { variant } : {}, parameters: setup.parameters, decorators: [setup.decorator] }
}

const meta: Meta<typeof MastercopyWarning> = {
  title: 'Components/Multichain/MastercopyWarning',
  component: MastercopyWarning,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Unsupported (UNKNOWN) Safe on an official singleton → offer migration.
export const Migrate: Story = storyFor({
  implementationVersionState: ImplementationVersionState.UNKNOWN,
  version: '1.3.0',
  implementation: { value: OFFICIAL_SINGLETON },
})

// Unsupported (UNKNOWN) third-party fork → point to the CLI.
export const Cli: Story = storyFor({
  implementationVersionState: ImplementationVersionState.UNKNOWN,
  version: '1.3.0',
  implementation: { value: THIRD_PARTY_FORK },
})

// Dashboard: outdated, critical, official Gnosis deployment → compact update ActionCard.
export const Update: Story = storyFor({
  implementationVersionState: ImplementationVersionState.OUTDATED,
  version: '1.1.1',
  implementation: { value: GNOSIS_MASTERCOPY },
})

// Settings: same critical update, rendered as the richer Alert with a changelog link.
export const UpdateSettings: Story = storyFor(
  {
    implementationVersionState: ImplementationVersionState.OUTDATED,
    version: '1.1.1',
    implementation: { value: GNOSIS_MASTERCOPY },
  },
  'settings',
)

// Settings also prompts non-critical (>= 1.3.0) updates, unlike the dashboard.
export const UpdateSettingsNonCritical: Story = storyFor(
  {
    implementationVersionState: ImplementationVersionState.OUTDATED,
    version: '1.3.0',
    implementation: { value: GNOSIS_MASTERCOPY },
  },
  'settings',
)

// Up to date → renders nothing.
export const None: Story = storyFor({
  implementationVersionState: ImplementationVersionState.UP_TO_DATE,
  version: '1.4.1',
  implementation: { value: GNOSIS_MASTERCOPY },
})
