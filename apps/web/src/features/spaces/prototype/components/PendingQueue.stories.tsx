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
