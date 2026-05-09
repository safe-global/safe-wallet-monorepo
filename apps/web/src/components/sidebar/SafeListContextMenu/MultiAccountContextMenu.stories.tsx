import type { Meta, StoryObj } from '@storybook/react'
import { Paper, Box } from '@mui/material'
import MultiAccountContextMenu from './MultiAccountContextMenu'

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

const meta = {
  title: 'Components/Sidebar/MultiAccountContextMenu',
  component: MultiAccountContextMenu,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>My Safe Account</span>
          <Story />
        </Box>
      </Paper>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the Safe account',
    },
    address: {
      control: 'text',
      description: 'The Safe address',
    },
    chainIds: {
      control: 'object',
      description: 'Array of chain IDs where this Safe is deployed',
    },
    addNetwork: {
      control: 'boolean',
      description: 'Whether to show the "Add another network" option',
    },
  },
} satisfies Meta<typeof MultiAccountContextMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default context menu with rename and add network options.
 */
export const Default: Story = {
  args: {
    name: 'My Safe',
    address: MOCK_SAFE_ADDRESS,
    chainIds: ['1'],
    addNetwork: true,
  },
}

/**
 * Context menu without the "Add another network" option.
 */
export const WithoutAddNetwork: Story = {
  args: {
    name: 'My Safe',
    address: MOCK_SAFE_ADDRESS,
    chainIds: ['1'],
    addNetwork: false,
  },
}

/**
 * Safe deployed on multiple chains.
 */
export const MultipleChains: Story = {
  args: {
    name: 'Multichain Safe',
    address: MOCK_SAFE_ADDRESS,
    chainIds: ['1', '137', '42161', '10'],
    addNetwork: true,
  },
}

/**
 * Safe with a long name.
 */
export const LongName: Story = {
  args: {
    name: 'This is a very long Safe name that might need truncation in the UI',
    address: MOCK_SAFE_ADDRESS,
    chainIds: ['1'],
    addNetwork: true,
  },
}

/**
 * Safe with no custom name (empty string).
 */
export const NoName: Story = {
  args: {
    name: '',
    address: MOCK_SAFE_ADDRESS,
    chainIds: ['1'],
    addNetwork: true,
  },
}

/**
 * Safe deployed only on testnets.
 */
export const TestnetOnly: Story = {
  args: {
    name: 'Testnet Safe',
    address: MOCK_SAFE_ADDRESS,
    chainIds: ['5', '11155111'],
    addNetwork: true,
  },
}
