import type { Meta, StoryObj } from '@storybook/react'
import { Button, IconButton, Typography, Box } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import { CustomTooltip } from './index'

const meta = {
  component: CustomTooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CustomTooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'This is a tooltip',
    children: <Button variant="outlined">Hover me</Button>,
  },
}

export const WithIcon: Story = {
  args: {
    title: 'More information about this feature',
    children: (
      <IconButton size="small">
        <InfoIcon />
      </IconButton>
    ),
  },
}

export const TopPlacement: Story = {
  args: {
    title: 'Tooltip on top',
    placement: 'top',
    children: <Button variant="outlined">Top placement</Button>,
  },
}

export const BottomPlacement: Story = {
  args: {
    title: 'Tooltip on bottom',
    placement: 'bottom',
    children: <Button variant="outlined">Bottom placement</Button>,
  },
}

export const LeftPlacement: Story = {
  args: {
    title: 'Tooltip on left',
    placement: 'left',
    children: <Button variant="outlined">Left placement</Button>,
  },
}

export const RightPlacement: Story = {
  args: {
    title: 'Tooltip on right',
    placement: 'right',
    children: <Button variant="outlined">Right placement</Button>,
  },
}

export const LongContent: Story = {
  args: {
    title:
      'This is a much longer tooltip that contains more detailed information about a particular feature or functionality.',
    children: <Button variant="outlined">Long tooltip</Button>,
  },
}

export const WithComplexContent: Story = {
  args: {
    title: (
      <Box>
        <Typography fontWeight="bold">Important Notice</Typography>
        <Typography variant="body2">This action cannot be undone.</Typography>
      </Box>
    ),
    children: (
      <Button variant="contained" color="error">
        Delete
      </Button>
    ),
  },
}
