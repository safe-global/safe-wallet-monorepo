import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import listCss from '@/components/safe-apps/SafeAppList/styles.module.css'
import NativeSwapsCardCell from './NativeSwapsCardCell'

const PlaceholderApp = ({ name }: { name: string }) => (
  <li>
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-border bg-card p-4 text-center text-sm text-[var(--color-text-secondary)]">
      {name}
    </div>
  </li>
)

// The real apps grid, so a hidden cell visibly reflows its neighbours.
const withAppsGrid: Decorator = (Story) => (
  <ul className={listCss.safeAppsContainer}>
    <Story />
    <PlaceholderApp name="Transaction Builder" />
    <PlaceholderApp name="WalletConnect" />
  </ul>
)

const meta = {
  title: 'Components/SafeApps/NativeSwapsCardCell',
  component: NativeSwapsCardCell,
  loaders: [mswLoader],
  parameters: {
    componentSubtitle: 'Gates the native swaps promo card and owns its grid cell',
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NativeSwapsCardCell>

export default meta
type Story = StoryObj<typeof meta>

// "Don't show" dismisses for real — clear the `showSwapsAppCard` localStorage
// key to bring the card back.
/** Swaps enabled and not dismissed: the card is the first of three grid items. */
export const InAppsGrid: Story = (() => {
  const setup = createMockStory({ scenario: 'efSafe', shadcn: true })
  return {
    parameters: { ...setup.parameters },
    decorators: [withAppsGrid, setup.decorator],
  }
})()

/** Swaps disabled on the current chain: no card and no `li`, so the grid holds two items. */
export const SwapsFeatureDisabled: Story = (() => {
  const setup = createMockStory({ scenario: 'efSafe', shadcn: true, features: { swaps: false } })
  return {
    parameters: { ...setup.parameters },
    decorators: [withAppsGrid, setup.decorator],
  }
})()
