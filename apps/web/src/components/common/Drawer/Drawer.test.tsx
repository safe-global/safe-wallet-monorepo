import { render, screen, fireEvent } from '@/tests/test-utils'
import { Drawer } from './Drawer'
import { DrawerBody, DrawerFooter, DrawerHeader, DrawerSubtitle, DrawerTitle } from './components'

describe('Drawer', () => {
  it('renders the composed header, body and footer', () => {
    render(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer">
        <DrawerHeader>
          <span>ICON</span>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerSubtitle>Drawer subtitle</DrawerSubtitle>
        </DrawerHeader>
        <DrawerBody>Body content</DrawerBody>
        <DrawerFooter>
          <button>Footer action</button>
        </DrawerFooter>
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
      <Drawer open={false} onClose={jest.fn()}>
        <DrawerBody>Body content</DrawerBody>
      </Drawer>,
    )

    expect(screen.queryByText('Body content')).not.toBeInTheDocument()
  })

  it('keeps the close button when no header is composed', () => {
    render(
      <Drawer open onClose={jest.fn()}>
        <DrawerBody>Body content</DrawerBody>
      </Drawer>,
    )

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <Drawer open onClose={onClose}>
        <DrawerBody>Body content</DrawerBody>
      </Drawer>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the footer outside the body so it stays pinned', () => {
    render(
      <Drawer open onClose={jest.fn()}>
        <DrawerBody>
          <p>Body content</p>
        </DrawerBody>
        <DrawerFooter>
          <button>Footer action</button>
        </DrawerFooter>
      </Drawer>,
    )

    const body = screen.getByText('Body content').parentElement

    expect(body).not.toContainElement(screen.getByRole('button', { name: 'Footer action' }))
  })

  it('leaves the body as the last child only when no footer follows, which is what drops its padding', () => {
    const { rerender } = render(
      <Drawer open onClose={jest.fn()}>
        <DrawerBody>
          <p>Body content</p>
        </DrawerBody>
      </Drawer>,
    )

    const body = screen.getByText('Body content').parentElement

    expect(body).toHaveClass('last:pb-6')
    expect(body?.nextElementSibling).toBeNull()

    rerender(
      <Drawer open onClose={jest.fn()}>
        <DrawerBody>
          <p>Body content</p>
        </DrawerBody>
        <DrawerFooter>
          <button>Footer action</button>
        </DrawerFooter>
      </Drawer>,
    )

    expect(screen.getByText('Body content').parentElement?.nextElementSibling).not.toBeNull()
  })

  it('defaults to the md width and applies the lg width on request', () => {
    const { rerender } = render(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer">
        <DrawerBody>Body content</DrawerBody>
      </Drawer>,
    )

    expect(screen.getByLabelText('Test drawer')).toHaveClass('data-[side=right]:w-[440px]')

    rerender(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer" size="lg">
        <DrawerBody>Body content</DrawerBody>
      </Drawer>,
    )

    expect(screen.getByLabelText('Test drawer')).toHaveClass('data-[side=right]:w-[700px]')
  })
})
