import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { useEffect, useState, type ComponentProps } from 'react'
import { fn } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { NestedSafesPopover } from './index'

// The mock harness resolves the current Safe (parent) to the efSafe fixture address.
const PARENT_SAFE_ADDRESS = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'

const nestedSafe = (address: string, overrides: Partial<NestedSafeWithStatus> = {}): NestedSafeWithStatus => ({
  address,
  isValid: true,
  isCurated: true,
  ...overrides,
})

const CURATED_SAFES: NestedSafeWithStatus[] = [
  nestedSafe('0x1111111111111111111111111111111111111111'),
  nestedSafe('0x2222222222222222222222222222222222222222'),
  nestedSafe('0x3333333333333333333333333333333333333333'),
]

// A few extra on-chain safes that were detected but not curated (drives the "+N more found" indicator).
const ALL_SAFES: NestedSafeWithStatus[] = [
  ...CURATED_SAFES,
  nestedSafe('0x4444444444444444444444444444444444444444', { isCurated: false }),
  nestedSafe('0x5555555555555555555555555555555555555555', { isCurated: false, isValid: false }),
]

const RAW_NESTED_SAFES = ALL_SAFES.map((safe) => safe.address)

/**
 * The popover opens when `anchorEl` is truthy. In `centered` mode positioning is pinned to the
 * viewport centre via a virtual anchor, so we only need to hand it any real mounted element to
 * flip `open` on. This wrapper mounts a hidden div and passes its ref as the anchor.
 */
const PopoverHarness = (props: Omit<ComponentProps<typeof NestedSafesPopover>, 'anchorEl'>) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    setAnchorEl(el)
    return () => {
      el.remove()
    }
  }, [])

  return <NestedSafesPopover {...props} anchorEl={anchorEl} centered />
}

const curatedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
  store: {
    settings: {
      curatedNestedSafes: {
        [PARENT_SAFE_ADDRESS.toLowerCase()]: {
          selectedAddresses: CURATED_SAFES.map((safe) => safe.address),
          hasCompletedCuration: true,
          lastModified: 0,
        },
      },
    },
  },
})

const meta = {
  title: 'Components/NestedSafes/NestedSafesPopover',
  component: NestedSafesPopover,
  render: (args) => <PopoverHarness {...args} />,
  loaders: [mswLoader],
  decorators: [curatedSetup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...curatedSetup.parameters,
  },
  args: {
    // The harness supplies its own mounted anchor; this satisfies the required prop for every story.
    anchorEl: null,
    onClose: fn(),
  },
} satisfies Meta<typeof NestedSafesPopover>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Curation complete: the curated nested Safes are listed, an uncurated "+N more found" indicator
 * links to manage mode, and the "Add nested Safe" CTA is shown at the bottom.
 */
export const Populated: Story = {
  args: {
    rawNestedSafes: RAW_NESTED_SAFES,
    allSafesWithStatus: ALL_SAFES,
    visibleSafes: CURATED_SAFES,
    hasCompletedCuration: true,
  },
}

/**
 * No nested Safes exist yet: the popover renders the explanatory empty state plus the
 * "Add nested Safe" CTA.
 */
export const Empty: Story = {
  args: {
    rawNestedSafes: [],
    allSafesWithStatus: [],
    visibleSafes: [],
    hasCompletedCuration: true,
  },
}

/** Validation in progress: the body shows a centered spinner. */
export const Loading: Story = {
  args: {
    rawNestedSafes: RAW_NESTED_SAFES,
    allSafesWithStatus: [],
    visibleSafes: [],
    hasCompletedCuration: false,
    isLoading: true,
  },
}

/**
 * First-time curation: safes were detected on-chain but the user has not curated yet, so the popover
 * opens on the intro screen prompting the user to review and select which Safes to show.
 */
export const FirstTimeCuration: Story = {
  args: {
    rawNestedSafes: RAW_NESTED_SAFES,
    allSafesWithStatus: ALL_SAFES,
    visibleSafes: [],
    hasCompletedCuration: false,
  },
}
