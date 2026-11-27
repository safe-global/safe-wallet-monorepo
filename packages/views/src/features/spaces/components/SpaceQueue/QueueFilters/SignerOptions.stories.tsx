import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from 'storybook/test'
import SignerOptions from './SignerOptions'
import { InOpenMenu } from './storyDecorators'

const meta = {
  title: 'Features/Spaces/Transactions/QueueFilters/SignerOptions',
  component: SignerOptions,
  parameters: { layout: 'centered' },
  decorators: [InOpenMenu],
  args: {
    options: [
      { address: '0x3333333333333333333333333333333333333333', name: 'Alice (you)', count: 10, checked: false },
      { address: '0x4444444444444444444444444444444444444444', name: '0x4444...4444', count: 3, checked: true },
    ],
    onToggle: fn(),
  },
} satisfies Meta<typeof SignerOptions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoSigners: Story = {
  args: { options: [] },
}

const MANY_SIGNERS = Array.from({ length: 20 }, (_, index) => ({
  address: `0x${(index + 1).toString(16).padStart(40, '0')}`,
  name: `Signer ${index + 1}`,
  count: 20 - index,
  checked: index === 2,
}))

/** More signers than fit: the options scroll under the search field */
export const ManySigners: Story = {
  args: { options: MANY_SIGNERS },
}

export const NoMatches: Story = {
  args: { options: MANY_SIGNERS },
  play: async ({ canvasElement }) => {
    const menu = within(canvasElement.ownerDocument.body)
    await userEvent.type(await menu.findByRole('searchbox', { name: 'Search signers' }), 'Bob')
    await expect(await menu.findByRole('status')).toHaveTextContent('No matches')
  },
}
