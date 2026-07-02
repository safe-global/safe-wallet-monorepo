import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { useState, type ComponentProps } from 'react'
import { fn } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { NestedSafesList } from './index'

const nestedSafe = (address: string, overrides: Partial<NestedSafeWithStatus> = {}): NestedSafeWithStatus => ({
  address,
  isValid: true,
  isCurated: true,
  ...overrides,
})

// Seven safes so the default (non-manage) view collapses to five and shows the "Show all" row.
const MANY_SAFES: NestedSafeWithStatus[] = [
  nestedSafe('0x1111111111111111111111111111111111111111'),
  nestedSafe('0x2222222222222222222222222222222222222222'),
  nestedSafe('0x3333333333333333333333333333333333333333'),
  nestedSafe('0x4444444444444444444444444444444444444444'),
  nestedSafe('0x5555555555555555555555555555555555555555'),
  nestedSafe('0x6666666666666666666666666666666666666666'),
  nestedSafe('0x7777777777777777777777777777777777777777'),
]

// A mix of valid/invalid safes to exercise the manage-mode warning icon.
const MANAGE_SAFES: NestedSafeWithStatus[] = [
  nestedSafe('0x1111111111111111111111111111111111111111', { isCurated: true }),
  nestedSafe('0x2222222222222222222222222222222222222222', { isCurated: false }),
  nestedSafe('0x3333333333333333333333333333333333333333', { isValid: false, isCurated: false }),
]

// Two near-identical addresses that get bundled into a similarity group, plus one standalone safe.
const GROUP_A = nestedSafe('0xAbC0000000000000000000000000000000000001', { isCurated: false })
const GROUP_B = nestedSafe('0xabc0000000000000000000000000000000000001', { isCurated: false })
const UNGROUPED = nestedSafe('0x9999999999999999999999999999999999999999', { isCurated: true })

const listSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

/**
 * `NestedSafesList` renders the nested Safes belonging to the connected Safe. It resolves the current
 * chain, currency, wallet and per-Safe overviews from the store, so every story runs inside the mock
 * harness with the `efSafe` fixture as the parent.
 *
 * In the default (dropdown) mode it links to each nested Safe and collapses the list to five entries
 * behind a "Show all" row. In manage mode it swaps to selectable checkboxes, surfaces validation
 * warnings, and can bundle look-alike addresses into similarity groups.
 */
const meta = {
  title: 'Components/NestedSafes/NestedSafesList',
  component: NestedSafesList,
  loaders: [mswLoader],
  decorators: [
    listSetup.decorator,
    (Story) => (
      <div style={{ maxWidth: 420, backgroundColor: 'var(--color-background-paper)', padding: '0.5rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    ...listSetup.parameters,
  },
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof NestedSafesList>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Default dropdown mode: each nested Safe links to its account. With more than five safes the list is
 * truncated and a "Show all nested Safes" row is rendered.
 */
export const Default: Story = {
  args: {
    safesWithStatus: MANY_SAFES,
    isManageMode: false,
  },
}

/**
 * Manage mode: safes become selectable checkboxes. The third safe is invalid, so it renders the
 * "not created by the parent Safe" warning icon. Selection state is driven by an interactive wrapper.
 */
export const ManageMode: Story = {
  render: (args) => {
    const ManageHarness = (props: ComponentProps<typeof NestedSafesList>) => {
      const [selected, setSelected] = useState<Record<string, boolean>>({
        '0x1111111111111111111111111111111111111111': true,
      })
      return (
        <NestedSafesList
          {...props}
          isSafeSelected={(address) => selected[address] ?? false}
          onToggleSafe={(address) => setSelected((prev) => ({ ...prev, [address]: !prev[address] }))}
        />
      )
    }
    return <ManageHarness {...args} />
  },
  args: {
    safesWithStatus: MANAGE_SAFES,
    isManageMode: true,
  },
}

/**
 * Manage mode with similarity grouping: two look-alike addresses are wrapped in a warning-styled
 * group, while the remaining safe is rendered ungrouped below it.
 */
export const WithSimilarityGroups: Story = {
  args: {
    isManageMode: true,
    safesWithStatus: [GROUP_A, GROUP_B, UNGROUPED],
    groupedSafes: {
      groups: [{ key: 'group-abc', safes: [GROUP_A, GROUP_B] }],
      ungrouped: [UNGROUPED],
    },
    isFlagged: (address) => address === GROUP_A.address || address === GROUP_B.address,
    isSafeSelected: () => false,
    onToggleSafe: fn(),
  },
}
