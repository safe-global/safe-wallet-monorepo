import type { Meta, StoryObj } from '@storybook/react'
import HnSecurityReportBtn from './HnSecurityReportBtn'

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
        <div className="max-w-[600px] p-4">
          <Story />
        </div>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof HnSecurityReportBtn>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    chainId: '1',
    safe: '0x123',
    tx: '0x456',
  },
}
