import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { SPENDING_LIMIT_TOKEN_HINT } from './constants'
import SpendingLimitTokenMark from './SpendingLimitTokenMark'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/SpendingLimitTokenMark',
  component: SpendingLimitTokenMark,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SpendingLimitTokenMark>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Hovered: the hint that the token should be added. */
export const Hovered: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByLabelText(SPENDING_LIMIT_TOKEN_HINT))
    await expect(await within(document.body).findByText(SPENDING_LIMIT_TOKEN_HINT)).toBeInTheDocument()
  },
}
