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
import type { DefiV1Framing, DefiV1Nudge, DefiV1Plan, DefiV1Setup } from './types'

type Page = 'home' | 'earn' | 'partner'
type Args = {
  page: Page
  framing: DefiV1Framing
  nudge: DefiV1Nudge
  plan: DefiV1Plan
  setup: DefiV1Setup
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
  <DefiV1Context.Provider value={{ framing: args.framing, nudge: args.nudge, plan: args.plan, setup: args.setup }}>
    <Story />
  </DefiV1Context.Provider>
)

/**
 * DES-201 prototype: the DeFi story on the production Home and Earn pages, with mock opportunities.
 * Controls switch the variants under review: framing, where the idle-cash prompt sits, how a deposit
 * is signed, Free vs Pro, and operations (separate Safes with their own budget and signers).
 */
const meta = {
  title: 'Prototypes/DeFi V1',
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [setup.decorator, withPrototype],
  beforeEach: () => localItem(EARN_CONSENT_STORAGE_KEY).set(true),
  args: { page: 'earn', framing: 'treasury', nudge: 'home', plan: 'free', setup: 'stepper' },
  argTypes: {
    page: { control: 'inline-radio', options: ['home', 'earn', 'partner'] },
    framing: { control: 'inline-radio', options: ['treasury', 'defi'] },
    nudge: { control: 'inline-radio', options: ['home', 'assets', 'off'] },
    plan: { control: 'inline-radio', options: ['free', 'pro'] },
    setup: { control: 'inline-radio', options: ['dialog', 'drawer', 'stepper'] },
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

export const Treasury: Story = {
  ...at('earn'),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('defi-opportunities')
  },
}

export const DefiList: Story = {
  ...at('earn', { framing: 'defi' }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('opportunity-aave-usdc')
  },
}

export const TreasuryPro: Story = {
  ...at('earn', { plan: 'pro' }),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('invest-button')
  },
}

export const TreasuryProSetupDrawer: Story = at('earn', { plan: 'pro', setup: 'drawer' })

export const TreasuryProSetupStepper: Story = at('earn', { plan: 'pro', setup: 'stepper' })

export const Partner: Story = at('partner')
