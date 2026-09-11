import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import CsvTxExportModal from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

/**
 * The transaction CSV export dialog: a preset date range, or two date fields for a custom one.
 */
const meta = {
  title: 'Components/Transactions/CsvTxExportModal',
  component: CsvTxExportModal,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: setup.handlers },
  },
  args: {
    onClose: () => {},
    onExport: () => {},
    hasActiveFilter: false,
  },
} satisfies Meta<typeof CsvTxExportModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActiveFilter: Story = {
  args: {
    hasActiveFilter: true,
  },
}

/** The custom range: two date fields, with the 12-month limit spelled out. */
export const CustomRange: Story = {
  play: async ({ canvasElement }) => {
    const { userEvent, within, screen } = await import('storybook/test')
    await userEvent.click(within(canvasElement).getByLabelText('Date range'))
    await userEvent.click(await screen.findByRole('option', { name: 'Custom' }))
  },
}

/** Typing a full year never grows past four digits, so the range stays enterable. */
export const CustomRangeFilled: Story = {
  play: async ({ canvasElement }) => {
    const { userEvent, within, screen } = await import('storybook/test')
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByLabelText('Date range'))
    await userEvent.click(await screen.findByRole('option', { name: 'Custom' }))
    await userEvent.type(await screen.findByLabelText('From'), '01012025')
    await userEvent.type(await screen.findByLabelText('To'), '31032025')
  },
}
