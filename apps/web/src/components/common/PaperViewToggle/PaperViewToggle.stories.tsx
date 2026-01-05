import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material'
import { PaperViewToggle } from './index'

const meta = {
  component: PaperViewToggle,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 500 }}>
        <Story />
      </Box>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PaperViewToggle>

export default meta
type Story = StoryObj<typeof meta>

const TokensContent = () => (
  <Box px={2}>
    <List dense>
      <ListItem>
        <ListItemText primary="ETH" secondary="1.5 ETH ($4,500)" />
      </ListItem>
      <ListItem>
        <ListItemText primary="USDC" secondary="1,000 USDC ($1,000)" />
      </ListItem>
      <ListItem>
        <ListItemText primary="DAI" secondary="500 DAI ($500)" />
      </ListItem>
    </List>
  </Box>
)

const NFTsContent = () => (
  <Box px={2}>
    <Typography color="text.secondary">No NFTs in this Safe</Typography>
  </Box>
)

export const Default: Story = {
  args: {
    children: [
      { title: 'Tokens', content: <TokensContent /> },
      { title: 'NFTs', content: <NFTsContent /> },
    ],
  },
}

export const SecondViewActive: Story = {
  args: {
    activeView: 1,
    children: [
      { title: 'Tokens', content: <TokensContent /> },
      { title: 'NFTs', content: <NFTsContent /> },
    ],
  },
}

export const LeftAligned: Story = {
  args: {
    leftAlign: true,
    children: [
      { title: 'Tokens', content: <TokensContent /> },
      { title: 'NFTs', content: <NFTsContent /> },
    ],
  },
}

export const ThreeViews: Story = {
  args: {
    children: [
      { title: 'All', content: <Typography px={2}>All assets shown here</Typography> },
      { title: 'Tokens', content: <TokensContent /> },
      { title: 'NFTs', content: <NFTsContent /> },
    ],
  },
}
