import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { getScenario, getScenarioAccounts } from '../../services/model'
import { getSignerLoad } from '../../services/fleet'
import { getMemberProfile } from '../../services/members'
import { FleetPulse, type FleetCardKey } from './FleetPulse'
import { SafeListTable } from './SafeListTable'
import { SafeDrawer } from './SafeDrawer'
import { MemberDrawer } from './MemberDrawer'
import { SignerLoadTable } from './SignerLoadTable'

const accounts = getScenarioAccounts('20-safes')
const items = getScenario('20-safes')
const noop = () => {}

function CardsPreview() {
  const [active, setActive] = useState<FleetCardKey | null>(null)
  const counts: Record<FleetCardKey, number> = {
    safes: 20,
    signers: 11,
    conflicting: 6,
    blocked: 22,
    stale: 5,
  }
  return (
    <div className="bg-secondary p-6">
      <FleetPulse
        counts={counts}
        isActive={(key) => key === active}
        onSelect={(key) => setActive(active === key ? null : key)}
      />
    </div>
  )
}

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Stat cards',
  component: CardsPreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CardsPreview>
export default meta
type Story = StoryObj<typeof meta>

export const Cards: Story = {}

export const SafesList: Story = {
  render: () => (
    <div className="bg-secondary p-6">
      <SafeListTable
        accounts={accounts}
        scope={accounts}
        items={items}
        persona="owner"
        label="Safes in this workspace"
        onOpen={noop}
        onShow={noop}
      />
    </div>
  ),
}

export const SignersList: Story = {
  render: () => (
    <div className="bg-secondary p-6">
      <SignerLoadTable
        load={getSignerLoad(items, accounts, 'owner')}
        persona="owner"
        onShow={noop}
        onOpen={noop}
        onRemind={noop}
        onInvite={noop}
      />
    </div>
  ),
}

// Payroll Base: a missing attestation and settings that differ from Gnosis.
export const SafeDetails: Story = {
  render: () => (
    <SafeDrawer
      account={accounts.find((account) => account.id === 'fleet-payroll-base')!}
      scope={accounts}
      items={items}
      onClose={noop}
      onOpenSafe={noop}
      onOpenMember={noop}
      onOpenTx={noop}
      onShowInQueue={noop}
      onAddPolicy={noop}
    />
  ),
}

export const SignerDetails: Story = {
  render: () => (
    <MemberDrawer
      member={getMemberProfile('Sam', accounts, items, 'owner')}
      persona="owner"
      onClose={noop}
      onOpenTx={noop}
      onOpenSafe={noop}
      onShowInQueue={noop}
      onRemind={noop}
      onInvite={noop}
    />
  ),
}
