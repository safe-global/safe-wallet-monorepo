import { render, screen } from '@/tests/test-utils'
import { DrawerHeader } from '../DrawerHeader'

describe('DrawerHeader', () => {
  it('renders its children', () => {
    render(
      <DrawerHeader>
        <span>Header content</span>
      </DrawerHeader>,
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('reserves room on the right for the Drawer close button', () => {
    render(
      <DrawerHeader>
        <span>Header content</span>
      </DrawerHeader>,
    )

    expect(screen.getByText('Header content').parentElement).toHaveClass('pr-18')
  })

  it('merges a caller className with its own classes', () => {
    render(
      <DrawerHeader className="items-start">
        <span>Header content</span>
      </DrawerHeader>,
    )

    const header = screen.getByText('Header content').parentElement

    expect(header).toHaveClass('items-start')
    expect(header).toHaveClass('px-6', 'pt-6', 'pr-18')
    expect(header).not.toHaveClass('items-center')
  })
})
