import { render, screen } from '@testing-library/react'
import { List, ListItem, ListItemText } from './list'

describe('List', () => {
  it('renders items with primary and secondary text', () => {
    render(
      <List>
        <ListItem>
          <ListItemText primary="Owner" secondary="0x123" />
        </ListItem>
      </List>,
    )
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('0x123')).toBeInTheDocument()
  })

  it('omits secondary text when not provided', () => {
    render(
      <List>
        <ListItem>
          <ListItemText primary="Only primary" />
        </ListItem>
      </List>,
    )
    expect(screen.getByText('Only primary')).toBeInTheDocument()
    expect(screen.queryByText('0x123')).not.toBeInTheDocument()
  })
})
