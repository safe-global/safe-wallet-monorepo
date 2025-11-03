import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import ChangeThreshold from './index'

const meta = {
  component: ChangeThreshold,
  args: {
    txInfo: {
      type: TransactionInfoType.SETTINGS_CHANGE,
      settingsInfo: {
        type: SettingsInfoType.CHANGE_THRESHOLD,
        threshold: 1,
      },
    } as TransactionInfo,
  },
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],

  tags: ['autodocs'],
} satisfies Meta<typeof ChangeThreshold>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
