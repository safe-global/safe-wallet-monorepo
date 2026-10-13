import { render, renderWithUserEvent, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { Drawer } from './Drawer'
import { useState } from 'react'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'

jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: jest.fn(() => false) }))

beforeEach(() => jest.mocked(useIsMobile).mockReturnValue(false))
import {
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerSubtitle,
  DrawerTitle,
} from '@/components/common/Drawer/components'

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
  it('does not show resize controls unless opted in', () => {
    render(
      <Drawer open onClose={jest.fn()}>
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    expect(screen.queryByRole('separator', { name: 'Resize panel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
  })
  it('resizes with arrow keys and restores the chosen width after full screen and close', () => {
    const onClose = jest.fn()
    render(
      <Drawer open resizable onClose={onClose} ariaLabel="Resize drawer">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    const handle = screen.getByRole('separator', { name: 'Resize panel' })
    fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    expect(handle).toHaveAttribute('aria-valuenow', '480')
    fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }))
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Restore panel' }))
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '480')
    fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Expand to full screen' })).toBeInTheDocument()
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '480')
  })
  it('clamps dragged width to the viewport and minimum and stops resizing on pointer up', () => {
    render(
      <Drawer open resizable onClose={jest.fn()}>
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    const handle = screen.getByRole('separator', { name: 'Resize panel' })
    const capture = jest.fn()
    Object.defineProperty(handle, 'setPointerCapture', { configurable: true, value: capture })
    const pointer = (type: string, x: number) => {
      const event = new Event(type, { bubbles: true })
      Object.defineProperties(event, { button: { value: 0 }, clientX: { value: x }, pointerId: { value: 1 } })
      fireEvent(handle, event)
    }
    pointer('pointerdown', 500)
    pointer('pointermove', -2000)
    expect(handle).toHaveAttribute('aria-valuenow', String(window.innerWidth - 24))
    pointer('pointermove', 3000)
    expect(handle).toHaveAttribute('aria-valuenow', '360')
    pointer('pointerup', 3000)
    pointer('pointermove', 0)
    expect(handle).toHaveAttribute('aria-valuenow', '360')
    expect(capture).toHaveBeenCalledWith(1)
  })
  it('switches opted-in panels to mobile full screen and restores the desktop width', () => {
    const content = (
      <Drawer open resizable mobileFullScreen onClose={jest.fn()} ariaLabel="Responsive drawer">
        <DrawerBody>Body</DrawerBody>
      </Drawer>
    )
    const { rerender } = render(content)
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize panel' }), { key: 'ArrowLeft' })
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '480')
    jest.mocked(useIsMobile).mockReturnValue(true)
    rerender(
      <Drawer open resizable mobileFullScreen onClose={jest.fn()} ariaLabel="Responsive drawer">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('data-mobile-full-screen', 'true')
    expect(screen.queryByRole('separator', { name: 'Resize panel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible()
    jest.mocked(useIsMobile).mockReturnValue(false)
    rerender(
      <Drawer open resizable mobileFullScreen onClose={jest.fn()} ariaLabel="Responsive drawer">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '480')
    expect(screen.getByRole('button', { name: 'Expand to full screen' })).toBeVisible()
  })

  it('preserves existing floating panels on mobile unless opted in', () => {
    jest.mocked(useIsMobile).mockReturnValue(true)
    render(
      <Drawer open onClose={jest.fn()} ariaLabel="Existing drawer">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-mobile-full-screen')
    expect(screen.getByRole('dialog')).toHaveClass('rounded-3xl')
  })

  it('closes with Escape and restores focus to the opener', async () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Open details</button>
          <Drawer open={open} mobileFullScreen onClose={() => setOpen(false)} ariaLabel="Details">
            <DrawerBody>Body</DrawerBody>
          </Drawer>
        </>
      )
    }
    jest.mocked(useIsMobile).mockReturnValue(true)
    const { user } = renderWithUserEvent(<Example />)
    const opener = screen.getByRole('button', { name: 'Open details' })
    await user.click(opener)
    expect(screen.getByRole('dialog')).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })
  it('restores the chosen width after the parent closes a full-screen panel', () => {
    const onClose = jest.fn()
    const { rerender } = render(
      <Drawer open resizable onClose={onClose} ariaLabel="Externally controlled">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize panel' }), { key: 'ArrowLeft' })
    fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }))
    rerender(
      <Drawer open={false} resizable onClose={onClose} ariaLabel="Externally controlled">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    rerender(
      <Drawer open resizable onClose={onClose} ariaLabel="Externally controlled">
        <DrawerBody>Body</DrawerBody>
      </Drawer>,
    )
    expect(screen.getByRole('button', { name: 'Expand to full screen' })).toBeVisible()
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '480')
  })
})
