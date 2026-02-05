import type { Meta, StoryObj } from '@storybook/react'
import { Stack } from '@mui/material'
import { NativeStakingStatus } from '@safe-global/store/gateway/types'
import StakingStatus from '@/components/transactions/TxDetails/TxData/Staking/StakingStatus'

const meta: Meta<typeof StakingStatus> = {
  component: StakingStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const NotStaked: Story = {
  args: {
    status: NativeStakingStatus.NOT_STAKED,
  },
}

export const Activating: Story = {
  tags: ['!chromatic'],
  args: {
    status: NativeStakingStatus.ACTIVATING,
  },
}

export const DepositInProgress: Story = {
  tags: ['!chromatic'],
  args: {
    status: NativeStakingStatus.DEPOSIT_IN_PROGRESS,
  },
}

export const Active: Story = {
  args: {
    status: NativeStakingStatus.ACTIVE,
  },
}

export const ExitRequested: Story = {
  tags: ['!chromatic'],
  args: {
    status: NativeStakingStatus.EXIT_REQUESTED,
  },
}

export const Exiting: Story = {
  tags: ['!chromatic'],
  args: {
    status: NativeStakingStatus.EXITING,
  },
}

export const Exited: Story = {
  tags: ['!chromatic'],
  args: {
    status: NativeStakingStatus.EXITED,
  },
}

export const Slashed: Story = {
  tags: ['!chromatic'],
  args: {
    status: NativeStakingStatus.SLASHED,
  },
}

export const AllStatuses: Story = {
  args: {
    status: NativeStakingStatus.NOT_STAKED,
  },
  render: () => (
    <Stack spacing={2}>
      <StakingStatus status={NativeStakingStatus.NOT_STAKED} />
      <StakingStatus status={NativeStakingStatus.ACTIVATING} />
      <StakingStatus status={NativeStakingStatus.DEPOSIT_IN_PROGRESS} />
      <StakingStatus status={NativeStakingStatus.ACTIVE} />
      <StakingStatus status={NativeStakingStatus.EXIT_REQUESTED} />
      <StakingStatus status={NativeStakingStatus.EXITING} />
      <StakingStatus status={NativeStakingStatus.EXITED} />
      <StakingStatus status={NativeStakingStatus.SLASHED} />
    </Stack>
  ),
}
