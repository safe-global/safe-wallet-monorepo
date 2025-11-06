import type { Meta, StoryObj } from '@storybook/react'
import PendingBanner from './PendingBanner'
import { Paper } from '@mui/material'

const meta = {
    component: PendingBanner,
    title: 'Features/Hypernative/PendingBanner',
    parameters: {
        componentSubtitle: 'A banner component that displays a pending guardian setup status with an icon and close button.',
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
} satisfies Meta<typeof PendingBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        onDismiss: () => { },
    },
}

