import type { Meta, StoryObj } from '@storybook/react'
import PendingQueue from './PendingQueue'

const meta = {
  title: 'Features/Spaces/Pending queue prototype',
  component: PendingQueue,
  parameters: {
    layout: 'fullscreen',
    nextjs: { router: { pathname: '/prototypes/pending-queue', query: { option: 'table', scenario: '5-safes' } } },
  },
} satisfies Meta<typeof PendingQueue>
export default meta
type Story = StoryObj<typeof meta>
export const OneTable: Story = {}
export const MobileTable: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const CompetingProposals: Story = { parameters: { nextjs: { router: { query: { scenario: 'conflict' } } } } }
export const OneSafe: Story = { parameters: { nextjs: { router: { query: { scenario: '1-safe' } } } } }
export const TwentySafes: Story = {
  parameters: { nextjs: { router: { query: { option: 'table', scenario: '20-safes' } } } },
}
export const Executing: Story = { parameters: { nextjs: { router: { query: { state: 'executing' } } } } }
export const PartialLoading: Story = { parameters: { nextjs: { router: { query: { state: 'partial' } } } } }
export const FleetAdmin: Story = {
  parameters: { nextjs: { router: { query: { option: 'fleet', scenario: '20-safes' } } } },
}
export const FleetAdminProtocolTeam: Story = {
  parameters: { nextjs: { router: { query: { option: 'fleet', scenario: '50-safes' } } } },
}
export const FleetAdminSecurityLead: Story = {
  parameters: { nextjs: { router: { query: { option: 'fleet', scenario: '20-safes', persona: 'security' } } } },
}
