import type { Meta, StoryObj } from '@storybook/react'
import PendingQueue from './PendingQueue'

const meta = {
  title: 'Features/Spaces/Pending queue prototype',
  component: PendingQueue,
  parameters: {
    layout: 'fullscreen',
    nextjs: { router: { pathname: '/prototypes/pending-queue', query: { option: 'table', scenario: 'everyday' } } },
  },
} satisfies Meta<typeof PendingQueue>
export default meta
type Story = StoryObj<typeof meta>
export const OneTable: Story = {}
export const MobileTable: Story = { parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const CompetingProposals: Story = { parameters: { nextjs: { router: { query: { scenario: 'conflict' } } } } }
export const OneTableManySafes: Story = {
  parameters: { nextjs: { router: { query: { option: 'table', scenario: 'many-safes' } } } },
}
export const FleetAdmin: Story = {
  parameters: { nextjs: { router: { query: { option: 'fleet', scenario: 'fleet' } } } },
}
export const FleetAdminProtocolTeam: Story = {
  parameters: { nextjs: { router: { query: { option: 'fleet', scenario: 'protocol' } } } },
}
export const FleetAdminSecurityLead: Story = {
  parameters: { nextjs: { router: { query: { option: 'fleet', scenario: 'fleet', persona: 'security' } } } },
}
