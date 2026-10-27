import type { Meta, StoryObj } from '@storybook/react'
import type { GuardSetup, GuardSetupTransaction } from '../types'
import { getGuardSetupProgress } from '@/features/spaces/components/Policies/utils/guardSetup'
import GuardSetupProgress from './GuardSetupProgress'

const NOW = 1_800_000_000
const HOUR = 3_600

const tx = (confirmationsSubmitted: number): GuardSetupTransaction => ({
  safeTxHash: '0x1',
  nonce: 4,
  confirmationsSubmitted,
  confirmationsRequired: 2,
  proposedAt: NOW - HOUR,
})

const delayed = (overrides: Partial<Extract<GuardSetup, { flow: 'delayed' }>>): GuardSetup => ({
  flow: 'delayed',
  status: 'pending-application',
  guard: '0x0000000000000000000000000000000000000001',
  root: '0xabc',
  configurations: [],
  readyAt: NOW + 3 * HOUR,
  expiresAt: NOW + 10 * 24 * HOUR,
  transaction: null,
  ...overrides,
})

const stepsOf = (setup: GuardSetup) => getGuardSetupProgress(setup, NOW).steps

const meta = {
  title: 'Features/Spaces/Policies/GuardSetupProgress',
  component: GuardSetupProgress,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-[400px]">{Story()}</div>],
} satisfies Meta<typeof GuardSetupProgress>

export default meta
type Story = StoryObj<typeof GuardSetupProgress>

export const RequestNeedsSignatures: Story = {
  args: {
    steps: stepsOf(delayed({ status: 'configuration-in-signing', readyAt: null, expiresAt: null, transaction: tx(1) })),
  },
}

export const SecurityDelay: Story = { args: { steps: stepsOf(delayed({})) } }

/** The apply transaction can collect signatures while the delay runs. */
export const ApplySignedDuringDelay: Story = {
  args: { steps: stepsOf(delayed({ status: 'application-in-signing', transaction: tx(1) })) },
}

export const ReadyToApply: Story = { args: { steps: stepsOf(delayed({ readyAt: NOW - HOUR })) } }

export const ApplyReadyToExecute: Story = {
  args: { steps: stepsOf(delayed({ status: 'application-ready', readyAt: NOW - HOUR, transaction: tx(2) })) },
}

export const Expired: Story = {
  args: { steps: stepsOf(delayed({ status: 'expired', readyAt: NOW - 20 * HOUR, expiresAt: NOW - HOUR })) },
}

/** Saved in the gateway, but the request transaction was never proposed. */
export const NotRequested: Story = {
  args: { steps: stepsOf(delayed({ status: 'draft', guard: null, readyAt: null, expiresAt: null })) },
}

/** Before the guard is enabled, the policy and the guard go on in one transaction. */
export const Immediate: Story = {
  args: {
    steps: stepsOf({ flow: 'immediate', guard: '0x0000000000000000000000000000000000000001', transaction: tx(1) }),
  },
}
