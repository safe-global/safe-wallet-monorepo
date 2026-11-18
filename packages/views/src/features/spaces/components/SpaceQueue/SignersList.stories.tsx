import type { Meta, StoryObj } from '@storybook/react'
import SignersList from './SignersList'

const ana = { address: '0x1F2a3b4C5d6E7f8091A2b3C4d5E6f708192A3b4C', name: 'Ana' }
const max = { address: '0x2A3b4C5d6E7f8091A2b3C4d5E6f708192A3b4C5D', name: 'Max' }
const you = { address: '0x3B4c5D6e7F8091a2B3c4D5e6F708192a3B4c5D6E', name: 'You' }
const lena = { address: '0x4C5d6E7f8091A2b3C4d5E6f708192A3b4C5d6E7F', name: 'Lena' }

const meta = {
  title: 'Features/Spaces/Transactions/SignersList',
  component: SignersList,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-fit max-w-sm rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignersList>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { header: '2 of 3 signed · 1 more needed', isLoading: true, signers: [] },
}

export const Pending: Story = {
  args: {
    header: '2 of 3 signed · 1 more from 2 signers',
    isLoading: false,
    signers: [
      { ...ana, signed: true },
      { ...max, signed: true },
      { ...you, signed: false },
      { ...lena, signed: false },
    ],
  },
}

export const ThresholdMet: Story = {
  args: {
    header: '3 of 3 signed · threshold met',
    isLoading: false,
    signers: [
      { ...ana, signed: true },
      { ...max, signed: true },
      { ...you, signed: true },
      { ...lena, signed: false },
    ],
  },
}
