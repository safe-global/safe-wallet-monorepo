import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, createChainData } from '@/stories/mocks'
import { chainFixtures } from '../../../../../../../config/test/msw/fixtures'
import AssetsList from './index'

/**
 * AssetsList - Space dashboard widget that surfaces the connected Safe's top
 * assets (max 3 non-zero balances) inside a `SafeWidget` shell.
 *
 * The component reads live app context (balances, visible assets, display
 * currency, router), so every state is driven through `createMockStory`
 * scenarios rather than props.
 */
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'none',
  shadcn: true,
})

const meta = {
  title: 'Features/Assets/AssetsList',
  component: AssetsList,
  loaders: [mswLoader],
  decorators: [
    defaultSetup.decorator,
    (Story) => (
      <div style={{ maxWidth: '560px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof AssetsList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Populated widget showing the top 3 assets from the EF Safe, with a footer
 * linking to the full assets page.
 */
export const Default: Story = {}

/**
 * Whale portfolio (Vitalik) — exercises rendering of large balances and fiat
 * values while still capping the list at 3 items.
 */
export const WhalePortfolio: Story = (() => {
  const setup = createMockStory({
    scenario: 'vitalik',
    wallet: 'owner',
    layout: 'none',
    shadcn: true,
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Empty state when the Safe holds no assets — renders the "No assets" message
 * with no footer.
 */
export const NoAssets: Story = (() => {
  const setup = createMockStory({
    scenario: 'empty',
    wallet: 'owner',
    layout: 'none',
    shadcn: true,
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Loading state — the balances request never resolves, so the widget shows
 * skeleton item placeholders.
 */
export const Loading: Story = (() => {
  const chainData = createChainData()
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'none',
    shadcn: true,
    handlers: [
      http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
      http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
      http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, async () => {
        await new Promise(() => {})
        return HttpResponse.json({})
      }),
    ],
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()
