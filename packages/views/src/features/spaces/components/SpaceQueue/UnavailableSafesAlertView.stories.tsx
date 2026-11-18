import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from 'storybook/test'
import UnavailableSafesAlertView from './UnavailableSafesAlertView'

const ethereum = { chainId: '1', chainName: 'Ethereum', shortName: 'eth', chainLogoUri: null }
const polygon = { chainId: '137', chainName: 'Polygon', shortName: 'matic', chainLogoUri: null }

const meta = {
  title: 'Features/Spaces/Transactions/UnavailableSafesAlert',
  component: UnavailableSafesAlertView,
  parameters: { layout: 'padded' },
  args: {
    title: "2 Safe accounts couldn't be loaded",
    maxSafes: 100,
    isOverLimit: false,
    onRetry: fn(),
    rows: [
      { id: '1:treasury', name: 'Treasury', networkName: 'Ethereum', chain: ethereum },
      { id: '137:0x2222', name: '0x2222...2222', networkName: 'Polygon', chain: polygon },
    ],
  },
} satisfies Meta<typeof UnavailableSafesAlertView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show Safe accounts' }))
    await expect(await canvas.findByText('Treasury')).toBeInTheDocument()
  },
}

export const OverLimit: Story = {
  args: { isOverLimit: true },
}

export const Retrying: Story = {
  args: { isRetrying: true },
}
