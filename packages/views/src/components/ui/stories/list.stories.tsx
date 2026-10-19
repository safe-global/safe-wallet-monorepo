import type { Meta, StoryObj } from '@storybook/react'
import { List, ListItem, ListItemText } from '../list'

const meta = {
  title: 'UI/List',
  component: List,
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <List style={{ width: 320 }}>
      <ListItem>
        <ListItemText primary="Alice" secondary="0x1234…abcd" />
      </ListItem>
      <ListItem>
        <ListItemText primary="Bob" secondary="0x5678…ef01" />
      </ListItem>
      <ListItem>
        <ListItemText primary="Carol" />
      </ListItem>
    </List>
  ),
}
