import type { Meta, StoryObj } from '@storybook/react'
import HnSecurityReportBtn from './HnSecurityReportBtn'
import { Paper } from '@mui/material'

const meta = {
  component: HnSecurityReportBtn,
  title: 'Features/Hypernative/HnSecurityReportBtn',
  parameters: {
    componentSubtitle:
      'A transaction button component that displays a security report review link with checkmark icon (light theme) and external link icon.',
  },
  decorators: [
    (Story) => {
      return (
        <Paper sx={{ padding: 2, maxWidth: 600, backgroundColor: 'transparent' }}>
          <Story />
        </Paper>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof HnSecurityReportBtn>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
