import type { Meta, StoryObj } from '@storybook/react'
import PendingQueue from './PendingQueue'

const meta = {
  title: 'Features/Spaces/Pending queue prototype',
  component: PendingQueue,
  parameters: {
    layout: 'fullscreen',
    nextjs: { router: { pathname: '/prototypes/pending-queue', query: { option: 'cards', scenario: '5-safes' } } },
  },
} satisfies Meta<typeof PendingQueue>
export default meta
type Story = StoryObj<typeof meta>
export const GroupCards: Story = {}
export const MobileGroupCards: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const CompetingProposals: Story = { parameters: { nextjs: { router: { query: { scenario: 'conflict' } } } } }
export const OneSafe: Story = { parameters: { nextjs: { router: { query: { scenario: '1-safe' } } } } }
export const TwentySafes: Story = {
  parameters: { nextjs: { router: { query: { option: 'cards', scenario: '20-safes' } } } },
}
export const FlatTable: Story = {
  parameters: { nextjs: { router: { query: { option: 'flat', scenario: '20-safes' } } } },
}
export const Executing: Story = { parameters: { nextjs: { router: { query: { state: 'executing' } } } } }
export const PartialLoading: Story = { parameters: { nextjs: { router: { query: { state: 'partial' } } } } }
export const SecurityLead: Story = {
  parameters: { nextjs: { router: { query: { option: 'cards', scenario: '20-safes', persona: 'security' } } } },
}

// Design QA: milestone 2 in layout B, the states the QA tickets point to.
const designQa = (query: Record<string, string> = {}, viewport?: string): Story => ({
  parameters: {
    nextjs: { router: { query: { m: '2', align: 'titled', state: 'normal', scenario: '8-safes', ...query } } },
    ...(viewport ? { viewport: { defaultViewport: viewport } } : {}),
  },
})
export const DesignQa = designQa()
export const DesignQaExecuting = designQa({ state: 'executing' })
export const DesignQaTablet = designQa({}, 'tablet')
export const DesignQaMobile = designQa({}, 'mobile1')
