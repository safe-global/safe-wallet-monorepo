import { render, screen, fireEvent } from '@/tests/test-utils'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  it('renders the icon, title, subtitle, children and action slots', () => {
    render(
      <Drawer
        open
        onClose={jest.fn()}
        ariaLabel="Test drawer"
        icon={<span>ICON</span>}
        title="Drawer title"
        subtitle="Drawer subtitle"
        action={<button>Footer action</button>}
      >
        Body content
      </Drawer>,
    )

    expect(screen.getByText('ICON')).toBeInTheDocument()
    expect(screen.getByText('Drawer title')).toBeInTheDocument()
    expect(screen.getByText('Drawer subtitle')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Footer action' })).toBeInTheDocument()
    expect(screen.getByLabelText('Test drawer')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Drawer open={false} onClose={jest.fn()} title="Drawer title">
        Body content
      </Drawer>,
    )

    expect(screen.queryByText('Drawer title')).not.toBeInTheDocument()
    expect(screen.queryByText('Body content')).not.toBeInTheDocument()
  })

  it('keeps the close button when no header slot is provided', () => {
    render(
      <Drawer open onClose={jest.fn()}>
        Body content
      </Drawer>,
    )

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <Drawer open onClose={onClose} title="Drawer title">
        Body content
      </Drawer>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the action outside the scrollable body so it stays pinned', () => {
    render(
      <Drawer open onClose={jest.fn()} action={<button>Footer action</button>}>
        <p>Body content</p>
      </Drawer>,
    )

    const body = screen.getByText('Body content').parentElement

    expect(body).not.toContainElement(screen.getByRole('button', { name: 'Footer action' }))
  })

  it('defaults to the md width and applies the lg width on request', () => {
    const { rerender } = render(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer">
        Body content
      </Drawer>,
    )

    expect(screen.getByLabelText('Test drawer')).toHaveClass('data-[side=right]:w-[440px]')

    rerender(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer" size="lg">
        Body content
      </Drawer>,
    )

    expect(screen.getByLabelText('Test drawer')).toHaveClass('data-[side=right]:w-[700px]')
  })
})
