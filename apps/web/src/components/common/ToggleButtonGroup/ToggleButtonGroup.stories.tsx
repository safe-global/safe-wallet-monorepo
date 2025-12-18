import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from '@mui/material'
import ListIcon from '@mui/icons-material/List'
import GridViewIcon from '@mui/icons-material/GridView'
import { ToggleButtonGroup } from './index'

const meta = {
  component: ToggleButtonGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: [
      { title: 'Tokens', content: null },
      { title: 'NFTs', content: null },
    ],
    onChange: (value) => console.log('changed', value),
  },
}

export const ThreeOptions: Story = {
  args: {
    children: [
      { title: 'All', content: null },
      { title: 'Pending', content: null },
      { title: 'Completed', content: null },
    ],
    onChange: (value) => console.log('changed', value),
  },
}

export const WithIcons: Story = {
  args: {
    children: [
      { title: <ListIcon />, content: null },
      { title: <GridViewIcon />, content: null },
    ],
    onChange: (value) => console.log('changed', value),
  },
}

export const WithIconsAndText: Story = {
  args: {
    children: [
      {
        title: (
          <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
            <ListIcon fontSize="small" /> List
          </Typography>
        ),
        content: null,
      },
      {
        title: (
          <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
            <GridViewIcon fontSize="small" /> Grid
          </Typography>
        ),
        content: null,
      },
    ],
    onChange: (value) => console.log('changed', value),
  },
}

export const PreselectedValue: Story = {
  args: {
    value: 1,
    children: [
      { title: 'Assets', content: null },
      { title: 'Positions', content: null },
    ],
    onChange: (value) => console.log('changed', value),
  },
}
