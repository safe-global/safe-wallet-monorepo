import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { fn } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { SimilarityConfirmDialog } from './SimilarityConfirmDialog'

// A "poisoning" set: the selected address and look-alikes that share the
// same leading/trailing characters but differ in the middle.
const SELECTED_ADDRESS = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
const SIMILAR_ADDRESS_ONE = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709000'
const SIMILAR_ADDRESS_TWO = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeEabcdef'

const setup = createMockStory({
  scenario: 'efSafe',
  shadcn: true,
})

const meta = {
  title: 'Components/NestedSafes/SimilarityConfirmDialog',
  component: SimilarityConfirmDialog,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
  args: {
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof SimilarityConfirmDialog>

export default meta

type Story = StoryObj<typeof meta>

/** Single look-alike address — the label reads "Similar address" (singular). */
export const SingleSimilarAddress: Story = {
  args: {
    address: SELECTED_ADDRESS,
    similarAddresses: [SIMILAR_ADDRESS_ONE],
  },
}

/** Multiple look-alike addresses — the label reads "Similar addresses" (plural). */
export const MultipleSimilarAddresses: Story = {
  args: {
    address: SELECTED_ADDRESS,
    similarAddresses: [SIMILAR_ADDRESS_ONE, SIMILAR_ADDRESS_TWO],
  },
}

/** Flagged with no accompanying matches — only the selected address and the warning show. */
export const NoSimilarAddresses: Story = {
  args: {
    address: SELECTED_ADDRESS,
    similarAddresses: [],
  },
}
