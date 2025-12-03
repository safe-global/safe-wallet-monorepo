import type { Meta, StoryObj } from '@storybook/react'
import { ReportFalseResultModal } from './ReportFalseResultModal'
import { fn } from '@storybook/test'
import { Paper } from '@mui/material'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'

const store = makeStore()

const meta: Meta<typeof ReportFalseResultModal> = {
  title: 'features/safe-shield/ReportFalseResultModal',
  component: ReportFalseResultModal,
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: fn(),
    requestId: 'mock-request-id-12345',
  },
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Paper sx={{ p: 2, minHeight: '600px' }}>
          <Story />
        </Paper>
      </Provider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ReportFalseResultModal>

export const Default: Story = {}

export const Closed: Story = {
  args: {
    open: false,
  },
}
