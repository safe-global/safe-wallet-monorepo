import type { ComponentType } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import { localItem } from '@/services/local-storage/local'
import Home from '@/pages/home'
import Earn from '@/pages/earn'
import { EARN_CONSENT_STORAGE_KEY } from '../constants'
import { DefiV1Context } from './context'
import { PartnerView } from './components/PartnerView'
import type { DefiV1Framing, DefiV1Model, DefiV1Nudge, DefiV1Plan, DefiV1Signing } from './types'

type Page = 'home' | 'earn' | 'partner'
type Args = {
  page: Page
  framing: DefiV1Framing
  nudge: DefiV1Nudge
  signing: DefiV1Signing
  model: DefiV1Model
  plan: DefiV1Plan
}

const PATHNAMES: Record<Page, string> = { home: '/home', earn: '/earn', partner: '/earn' }
const PAGES: Record<Page, ComponentType> = { home: Home, earn: Earn, partner: PartnerView }

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/home',
  features: { earn: true },
  shadcn: true,
})

const withPrototype: Decorator<Args> = (Story, { args }) => (
  <DefiV1Context.Provider
    value={{ framing: args.framing, nudge: args.nudge, signing: args.signing, model: args.model, plan: args.plan }}
  >
    <Story />
  </DefiV1Context.Provider>
)

/**
 * DES-201 prototype: the DeFi story on the production Home and Earn pages, with mock opportunities.
 * Controls switch the variants under review: framing, where the idle-cash prompt sits, how a deposit
 * is signed, and the Free vs Pro model. Policies are shown as "coming soon".
 */
const meta = {
  title: 'Prototypes/DeFi V1',
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [setup.decorator, withPrototype],
  beforeEach: () => localItem(EARN_CONSENT_STORAGE_KEY).set(true),
  args: { page: 'earn', framing: 'treasury', nudge: 'home', signing: 'threshold', model: 'A', plan: 'free' },
  argTypes: {
    page: { control: 'inline-radio', options: ['home', 'earn', 'partner'] },
    framing: { control: 'inline-radio', options: ['treasury', 'defi'] },
    nudge: { control: 'inline-radio', options: ['home', 'assets', 'off'] },
    signing: { control: 'inline-radio', options: ['threshold', 'policy'] },
    model: { control: 'inline-radio', options: ['A', 'B'] },
    plan: { control: 'inline-radio', options: ['free', 'pro'] },
  },
  render: ({ page }) => {
    const PageComponent = PAGES[page]
    return <PageComponent />
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

const at = (page: Page, args: Partial<Args> = {}): Story => ({
  args: { page, ...args },
  parameters: { nextjs: { router: { ...setup.parameters.nextjs.router, pathname: PATHNAMES[page] } } },
})

export const HomeNudge: Story = {
  ...at('home', { nudge: 'home' }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('idle-cash-nudge')
  },
}

export const AssetsNudge: Story = {
  ...at('home', { nudge: 'assets' }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('idle-cash-nudge-inline')
  },
}

export const TreasuryShelf: Story = {
  ...at('earn'),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('shelf-cash')
  },
}

export const DefiList: Story = {
  ...at('earn', { framing: 'defi' }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('opportunity-aave-usdc')
  },
}

export const ProShelf: Story = at('earn', { plan: 'pro' })

export const ModelBFree: Story = at('earn', { model: 'B' })

export const PolicyDeposit: Story = at('earn', { plan: 'pro', signing: 'policy' })

export const Partner: Story = at('partner')
