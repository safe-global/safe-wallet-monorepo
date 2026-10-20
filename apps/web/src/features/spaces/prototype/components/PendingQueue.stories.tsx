import type { Meta, StoryObj } from '@storybook/react'
import PendingQueue from './PendingQueue'

const meta = {
  title: 'Features/Spaces/Pending queue prototype',
  component: PendingQueue,
  parameters: {
    layout: 'fullscreen',
    nextjs: { router: { pathname: '/prototypes/pending-queue', query: { option: 'queues' } } },
  },
} satisfies Meta<typeof PendingQueue>
export default meta
type Story = StoryObj<typeof meta>
export const TransactionTable: Story = {}
export const SafeQueues: Story = { parameters: { nextjs: { router: { query: { groupBy: 'safe' } } } } }
export const StatusGroups: Story = { parameters: { nextjs: { router: { query: { groupBy: 'status' } } } } }
export const MobileTable: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const ActionInbox: Story = { parameters: { nextjs: { router: { query: { option: 'inbox' } } } } }
export const CompetingProposals: Story = { parameters: { nextjs: { router: { query: { scenario: 'conflict' } } } } }
export const NextSteps: Story = { parameters: { nextjs: { router: { query: { option: 'steps' } } } } }
export const ManySafes: Story = {
  parameters: { nextjs: { router: { query: { option: 'steps', scenario: 'many-safes' } } } },
}
