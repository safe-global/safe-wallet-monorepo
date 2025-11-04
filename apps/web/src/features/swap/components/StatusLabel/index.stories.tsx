import type { Meta, StoryObj } from '@storybook/react'
import StatusLabel from './index'
import { Paper } from '@mui/material'

const meta = {
  component: StatusLabel,
  parameters: {
    componentSubtitle: 'Renders a Status label with icon and text for a swap order',
  },

  decorators: [
    (Story) => {
      return (
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof StatusLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Filled: Story = {
  args: {
    status: 'fulfilled',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37793&mode=design&t=fZkl3tqjIWoYsB9C-4',
    },
  },
}

export const Pending: Story = {
  args: {
    status: 'presignaturePending',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5981-14754&mode=design&t=fZkl3tqjIWoYsB9C-4',
    },
  },
}

export const Open: Story = {
  args: {
    status: 'open',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37842&mode=design&t=fZkl3tqjIWoYsB9C-4',
    },
  },
}

export const Cancelled: Story = {
  args: {
    status: 'cancelled',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-37955&mode=design&t=fZkl3tqjIWoYsB9C-4',
    },
  },
}

export const Expired: Story = {
  args: {
    status: 'expired',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-38019&mode=design&t=fZkl3tqjIWoYsB9C-4',
    },
  },
}

export const PartiallyFilled: Story = {
  args: {
    status: 'partiallyFilled',
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/VyA38zUPbJ2zflzCIYR6Nu/Swap?type=design&node-id=5813-38019&mode=design&t=fZkl3tqjIWoYsB9C-4',
    },
  },
}
