import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SafenetStakeButton from './SafenetStakeButton'

const setup = createMockStory({
  scenario: 'safeTokenHolder',
  wallet: 'owner',
  pathname: '/balances',
  features: { safeStaking: true },
  shadcn: true,
})

const meta = {
  title: 'Components/Balances/AssetsTable/SafenetStakeButton',
  component: SafenetStakeButton,
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof SafenetStakeButton>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The staking icon shown next to the SAFE token in the asset list. Hovering reveals a
 * "Go to Safenet staking" tooltip; clicking resolves the Safenet Safe App and opens it.
 */
export const Default: Story = {}
