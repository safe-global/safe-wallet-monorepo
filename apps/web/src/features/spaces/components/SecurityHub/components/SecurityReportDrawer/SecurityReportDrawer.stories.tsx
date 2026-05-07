import type { Meta, StoryObj } from '@storybook/react'
import SecurityReportDrawer from './SecurityReportDrawer'
import { createMockStory } from '@/stories/mocks'
import { createMockContext } from '@/features/security/testing'
import type { SpaceSafeEntry } from '../../types'

const SAFE_A = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'

const safeEntry: SpaceSafeEntry = {
  address: SAFE_A,
  chainId: '1',
  name: 'Operations Vault',
  isMultichain: false,
  chainEntries: [{ chainId: '1', isDeployed: true }],
}

const setup = createMockStory({ features: { spaces: true } })

const meta = {
  title: 'Features/SecurityHub/SecurityReportDrawer',
  component: SecurityReportDrawer,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
    layout: 'fullscreen',
    // Drawer is open on the right side; the main content area is intentionally empty.
    chromatic: { disableSnapshot: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SecurityReportDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const OpenWithContext: Story = {
  args: {
    selectedSafe: { address: SAFE_A, chainId: '1' },
    selectedEntry: safeEntry,
    scanContext: createMockContext({ safeAddress: SAFE_A }),
    onClose: () => {},
    onScanComplete: () => {},
  },
}

export const Closed: Story = {
  args: {
    selectedSafe: null,
    selectedEntry: undefined,
    scanContext: null,
    onClose: () => {},
    onScanComplete: () => {},
  },
}
