import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { expect, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { spaceWithSafesHandler } from '@/stories/mocks/handlers'
import { localItem } from '@/services/local-storage/local'
import Home from '@/pages/home'
import Earn from '@/pages/earn'
import { EARN_CONSENT_STORAGE_KEY } from '../public/constants'
import { DefiV1Context } from './context'
import type { DefiV1Nudge, DefiV1Plan, DefiV1Scope } from './types'

type Page = 'home' | 'earn'
type Args = {
  page: Page
  nudge: DefiV1Nudge
  plan: DefiV1Plan
  scope: DefiV1Scope
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/home',
  features: { earn: true },
  shadcn: true,
})

const workspaceSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/spaces',
  query: { spaceId: '1' },
  authenticated: true,
  features: { earn: true },
  shadcn: true,
})

const withLayout: Decorator<Args> = (Story, context) =>
  (context.args.scope === 'workspace' ? workspaceSetup : setup).decorator(Story, context)

const withPrototype: Decorator<Args> = (Story, { args }) => (
  <DefiV1Context.Provider value={{ framing: 'treasury', nudge: args.nudge, plan: args.plan, scope: args.scope }}>
    <Story />
  </DefiV1Context.Provider>
)

/**
 * DES-201 prototype on the production Home and Earn pages, with mock opportunities. Three views to demo:
 * Pro workspace (every Safe), Pro workspace Safe (one Safe in a Pro workspace) and Free Safe.
 */
const meta = {
  title: 'Prototypes/DeFi V1',
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [withLayout, withPrototype],
  beforeEach: () => localItem(EARN_CONSENT_STORAGE_KEY).set(true),
  args: { page: 'earn', nudge: 'home', plan: 'free', scope: 'safe' },
  argTypes: {
    page: { control: 'inline-radio', options: ['home', 'earn'] },
    nudge: { control: 'inline-radio', options: ['home', 'assets', 'off'] },
    plan: { control: 'inline-radio', options: ['free', 'pro'] },
    scope: { control: 'inline-radio', options: ['safe', 'workspace'] },
  },
  render: ({ page }) => (page === 'home' ? <Home /> : <Earn />),
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

const onPage = (pathname: string) => ({
  nextjs: { router: { ...setup.parameters.nextjs.router, pathname } },
})

const describe = (story: string) => ({ docs: { description: { story } } })

export const HomeNudge: Story = {
  args: { page: 'home', nudge: 'home' },
  parameters: onPage('/home'),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('idle-cash-nudge')
  },
}

export const AssetsNudge: Story = {
  args: { page: 'home', nudge: 'assets' },
  parameters: onPage('/home'),
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('idle-cash-nudge-inline')
  },
}

export const ProWorkspace: Story = {
  name: 'Pro workspace',
  args: { plan: 'pro', scope: 'workspace' },
  parameters: {
    ...workspaceSetup.parameters,
    msw: { handlers: [spaceWithSafesHandler, ...workspaceSetup.handlers] },
    ...describe(
      'Treasury in the workspace sidebar. Every Safe in one place: filter by Safe, stat cards across all Safes, and the deposit modal asks which Safe to deposit from.',
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('safe-filter')
    await canvas.findByTestId('treasury-summary')
  },
}

export const ProWorkspaceSafe: Story = {
  name: 'Pro workspace · Safe',
  args: { plan: 'pro', scope: 'safe' },
  parameters: {
    ...onPage('/earn'),
    ...describe(
      'Deposits in the Safe sidebar, for a Safe in a Pro workspace. This Safe only, with stat cards and a link back to Treasury. Deposits can run in a nested Safe with its own signers and budget.',
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('workspace-link')
    await canvas.findByTestId('treasury-summary')
  },
}

export const FreeSafe: Story = {
  name: 'Free · Safe',
  args: { plan: 'free', scope: 'safe' },
  parameters: {
    ...onPage('/earn'),
    ...describe(
      'Deposits in the Safe sidebar on the free plan. One summary line instead of stat cards, Pro-only options locked, and deposits come straight from this Safe in two steps.',
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('summary-line')
    await expect(canvas.queryByTestId('treasury-summary')).toBeNull()
  },
}
