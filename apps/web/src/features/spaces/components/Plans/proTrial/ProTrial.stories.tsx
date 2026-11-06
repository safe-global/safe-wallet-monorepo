import { Fragment, type ComponentType } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { getWorker } from 'msw-storybook-addon'
import { MOCK_SPACE_ID, createMockStory } from '@/stories/mocks'
import SpaceDashboard from '@/pages/spaces'
import SpacePlansPage from '@/pages/spaces/plans'
import SpaceSafeAccounts from '@/pages/spaces/safe-accounts'
import { PLAN_STATES, SAFE_COUNTS, scenarioHandlers, type PlanState, type Region } from './scenario'

type Page = 'home' | 'accounts' | 'plans'
type Args = { plan: PlanState; safes: number; region: Region; page: Page }

const PATHNAMES: Record<Page, string> = { home: '/spaces', accounts: '/spaces/safe-accounts', plans: '/spaces/plans' }
const PAGES: Record<Page, ComponentType> = {
  home: SpaceDashboard,
  accounts: SpaceSafeAccounts,
  plans: SpacePlansPage,
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true, safePro: true, myAccounts: true },
  pathname: '/spaces',
  query: { spaceId: MOCK_SPACE_ID },
  layout: 'fullPage',
  shadcn: true,
})

/** Swaps the mocked billing for the picked state; the key remounts the store so every query refetches. */
const withScenario: Decorator<Args> = (Story, { args }) => {
  const scenario = { plan: args.plan, safes: args.safes, region: args.region }
  getWorker().use(...scenarioHandlers(scenario))
  return (
    <Fragment key={JSON.stringify(scenario)}>
      <Story />
    </Fragment>
  )
}

/**
 * The Pro trial rework on the production Workspace: real sidebar, pages and modals, mocked billing.
 * Pick the plan state, Safe count and region in Controls; theme and viewport in the toolbar.
 */
const meta = {
  title: 'Prototypes/Pro trial',
  parameters: { layout: 'fullscreen', ...setup.parameters },
  decorators: [setup.decorator, withScenario],
  args: { plan: 'trial', safes: 4, region: 'eu', page: 'home' },
  argTypes: {
    plan: { control: 'select', options: PLAN_STATES },
    safes: { control: 'inline-radio', options: SAFE_COUNTS },
    region: { control: 'inline-radio', options: ['eu', 'us'] },
    page: { control: 'inline-radio', options: Object.keys(PAGES) },
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
  parameters: { nextjs: { router: { pathname: PATHNAMES[page], query: { spaceId: MOCK_SPACE_ID } } } },
})

export const PreTrial = at('home', { plan: 'pre-trial' })
export const Trial = at('home')
export const TrialThreeDaysLeft = at('home', { plan: 'trial-3' })
export const TrialLastDay = at('home', { plan: 'trial-last' })
export const TrialEnded = at('home', { plan: 'ended' })
export const Paid = at('home', { plan: 'paid' })
export const PlansDuringTrial = at('plans')
export const SafeAccounts = at('accounts')
