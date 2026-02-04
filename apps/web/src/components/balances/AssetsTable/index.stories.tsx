import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import AssetsTable from './index'

// Wrapper component to handle showHiddenAssets state
const AssetsTableWithState = ({ showHiddenAssets: initialShowHidden = false }: { showHiddenAssets?: boolean }) => {
  const [showHiddenAssets, setShowHiddenAssets] = React.useState(initialShowHidden)

  React.useEffect(() => {
    setShowHiddenAssets(initialShowHidden)
  }, [initialShowHidden])

  return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',
})

const meta = {
  title: 'Components/Balances/AssetsTable',
  component: AssetsTableWithState,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  argTypes: {
    showHiddenAssets: {
      control: { type: 'boolean' },
      description: 'Whether to show hidden assets',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AssetsTableWithState>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default AssetsTable with EF Safe balance data (~$4.5M, 32 tokens).
 * Data is fetched via MSW from real API fixtures.
 */
export const Default: Story = {
  args: {
    showHiddenAssets: false,
  },
}

/**
 * AssetsTable with Vitalik's whale portfolio (1551 tokens, $675M).
 * Tests rendering performance with large token lists.
 */
export const WhalePortfolio: Story = (() => {
  const setup = createMockStory({
    scenario: 'vitalik',
    wallet: 'owner',
    layout: 'paper',
  })
  return {
    args: {
      showHiddenAssets: false,
    },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * AssetsTable with empty balance (no tokens).
 * Tests empty state UI.
 */
export const EmptyBalance: Story = (() => {
  const setup = createMockStory({
    scenario: 'empty',
    wallet: 'owner',
    layout: 'paper',
  })
  return {
    args: {
      showHiddenAssets: false,
    },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
