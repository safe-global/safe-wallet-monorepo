import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { safeAppsFixtures } from '@safe-global/test/msw/fixtures'
import { createMockStory, safeAppsHandlers } from '@/stories/mocks'
import SafeApps from '@/pages/apps'
import { jobOf, type Job } from './catalogue'
import { DefiV1Context } from '../context'
import { AppsV1Context, type AppsView } from './context'

type Args = { view: AppsView }

const MOCK_TAGS: Record<Job, string[]> = {
  grow: ['DeFi', 'Yield'],
  trade: ['DeFi', 'DEX'],
  pay: ['Payments'],
  govern: ['DAO Tooling', 'Security'],
  build: ['Infrastructure'],
  more: [],
}

const SAFE_APPS: SafeApp[] = safeAppsFixtures.mainnet.map((app) => ({
  ...app,
  tags: [...new Set([...app.tags, ...MOCK_TAGS[jobOf(app)]])],
}))

const CUSTOM_APP = {
  ...SAFE_APPS[0],
  id: -1,
  name: 'Payroll tool',
  description: 'Our own payroll app',
  url: 'https://payroll.example',
  iconUrl: '',
  tags: [],
  features: [],
} as SafeApp

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/apps',
  features: { earn: true },
  shadcn: true,
  store: { safeApps: { '1': { pinned: [24, 1, 58], opened: [24, 1] } } },
})

const withPrototype: Decorator<Args> = (Story, { args }) => (
  <DefiV1Context.Provider value={{ framing: 'treasury', nudge: 'off', plan: 'free', setup: 'stepper' }}>
    <AppsV1Context.Provider value={{ view: args.view, customApps: [CUSTOM_APP] }}>
      <Story />
    </AppsV1Context.Provider>
  </DefiV1Context.Provider>
)

/**
 * DES-201 prototype: the production Apps page on the Treasury table. Apps are grouped by job, with the
 * built-in Treasury, Swap and Bridge listed first. Popularity numbers and one-liners are mock data.
 */
const meta = {
  title: 'Prototypes/Apps V1',
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: [...safeAppsHandlers(SAFE_APPS), ...setup.parameters.msw.handlers] },
  },
  decorators: [setup.decorator, withPrototype],
  args: { view: 'table' },
  argTypes: { view: { control: 'inline-radio', options: ['table', 'grid'] } },
  render: () => <SafeApps />,
} satisfies Meta<Args>

export default meta
type Story = StoryObj<typeof meta>

export const Table: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('app-row-built-in-treasury')
    await canvas.findByText('Grow idle funds')
  },
}

export const SwapOpensHub: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByTestId('open-built-in-swap'))
    const dialog = await within(canvasElement.ownerDocument.body).findByTestId('move-funds-dialog')
    await expect(dialog).toBeVisible()
  },
}

export const Grid: Story = {
  args: { view: 'grid' },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByTestId('app-card-built-in-swap')
  },
}
