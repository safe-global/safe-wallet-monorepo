import { userEvent } from '@testing-library/user-event'
import { render, screen, fireEvent } from '@/tests/test-utils'
import { Drawer } from './Drawer'
import { DrawerBody } from '@safe-global/views/components/common/Drawer/components/DrawerBody'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import { DrawerHeader } from '@safe-global/views/components/common/Drawer/components/DrawerHeader'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'

jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: jest.fn(() => false) }))

describe('Drawer', () => {
  it('renders the composed header, body and footer', () => {
    render(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer">
        <DrawerHeader media={<span>ICON</span>} title="Drawer title" subtitle="Drawer subtitle" />
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

  it('drops the fallback close while closing, so it never flashes as a header unmounts', () => {
    const { rerender } = render(
      <Drawer open onClose={jest.fn()}>
        <DrawerHeader title="Allowlist" />
      </Drawer>,
    )

    rerender(<Drawer open={false} onClose={jest.fn()} />)

    expect(screen.queryByRole('button', { name: 'Close', hidden: true })).not.toBeInTheDocument()
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

  describe('full screen', () => {
    const renderExpandable = (props: { open?: boolean; onClose?: () => void; expandable?: boolean } = {}) => {
      const { open = true, onClose = jest.fn(), expandable = true } = props
      return render(
        <Drawer open={open} onClose={onClose} expandable={expandable} ariaLabel="Transaction">
          <DrawerHeader
            title="Send 1,250 USDC"
            navigation={{ onNext: jest.fn(), hasNext: true, position: '3 of 12' }}
          />
        </Drawer>,
      )
    }

    beforeEach(() => {
      jest.mocked(useIsMobile).mockReturnValue(false)
    })

    it('has no expand button unless the drawer is expandable', () => {
      renderExpandable({ expandable: false })

      expect(screen.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    })

    it('fills the screen and shows the position when expanded, keeping the same button', () => {
      renderExpandable()

      const expand = screen.getByRole('button', { name: 'Expand to full screen' })
      fireEvent.click(expand)

      expect(screen.getByLabelText('Transaction')).toHaveAttribute('data-full-screen', 'true')
      expect(screen.getByLabelText('Transaction')).toHaveClass('data-[side=right]:w-screen')
      expect(screen.getByRole('button', { name: 'Exit full screen' })).toBe(expand)
      expect(screen.getByText('3 of 12')).not.toHaveClass('sr-only')
    })

    it('leaves full screen on Escape before closing on the next one', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()
      renderExpandable({ onClose })

      await user.click(screen.getByRole('button', { name: 'Expand to full screen' }))
      await user.keyboard('{Escape}')

      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByLabelText('Transaction')).not.toHaveAttribute('data-full-screen')

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('opens at its normal width again after closing', () => {
      const { rerender } = renderExpandable()

      fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }))

      rerender(
        <Drawer open={false} onClose={jest.fn()} expandable ariaLabel="Transaction">
          <DrawerHeader title="Send 1,250 USDC" />
        </Drawer>,
      )
      rerender(
        <Drawer open onClose={jest.fn()} expandable ariaLabel="Transaction">
          <DrawerHeader title="Send 1,250 USDC" />
        </Drawer>,
      )

      expect(screen.getByLabelText('Transaction')).not.toHaveAttribute('data-full-screen')
    })

    it('is always full screen on phones, with no expand button', () => {
      jest.mocked(useIsMobile).mockReturnValue(true)
      renderExpandable()

      expect(screen.getByLabelText('Transaction')).toHaveAttribute('data-full-screen', 'true')
      expect(screen.queryByRole('button', { name: 'Expand to full screen' })).not.toBeInTheDocument()
    })
  })

  describe('resize', () => {
    const renderResizable = (props: { open?: boolean; resizable?: boolean; expandable?: boolean } = {}) => {
      const { open = true, resizable = true, expandable = false } = props
      return (
        <Drawer open={open} onClose={jest.fn()} resizable={resizable} expandable={expandable} ariaLabel="Transaction">
          <DrawerHeader title="Send 1,250 USDC" />
        </Drawer>
      )
    }

    beforeEach(() => {
      jest.mocked(useIsMobile).mockReturnValue(false)
    })

    it('has no handle unless the drawer is resizable', () => {
      render(renderResizable({ resizable: false }))

      expect(screen.queryByRole('separator', { name: 'Resize panel' })).not.toBeInTheDocument()
    })

    it('widens and narrows with the arrow keys, never below the minimum', () => {
      render(renderResizable())

      const handle = screen.getByRole('separator', { name: 'Resize panel' })

      expect(handle).toHaveAttribute('aria-valuenow', '440')

      fireEvent.keyDown(handle, { key: 'ArrowLeft' })

      expect(handle).toHaveAttribute('aria-valuenow', '480')
      expect(screen.getByLabelText('Transaction')).toHaveStyle({ width: '480px' })

      fireEvent.keyDown(handle, { key: 'ArrowRight' })
      fireEvent.keyDown(handle, { key: 'ArrowRight' })
      fireEvent.keyDown(handle, { key: 'ArrowRight' })
      fireEvent.keyDown(handle, { key: 'ArrowRight' })

      expect(handle).toHaveAttribute('aria-valuenow', '360')
    })

    it('follows a drag of its left edge', () => {
      render(renderResizable())

      const handle = screen.getByRole('separator', { name: 'Resize panel' })

      fireEvent.pointerDown(handle, { button: 0, clientX: 600, pointerId: 1 })
      fireEvent.pointerMove(handle, { clientX: 500, pointerId: 1 })
      fireEvent.pointerUp(handle, { pointerId: 1 })
      fireEvent.pointerMove(handle, { clientX: 300, pointerId: 1 })

      expect(handle).toHaveAttribute('aria-valuenow', '540')
    })

    it('opens at its normal width again after closing', () => {
      const { rerender } = render(renderResizable())

      fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize panel' }), { key: 'ArrowLeft' })

      rerender(renderResizable({ open: false }))
      rerender(renderResizable())

      expect(screen.getByRole('separator', { name: 'Resize panel' })).toHaveAttribute('aria-valuenow', '440')
      expect(screen.getByLabelText('Transaction').style.width).toBe('')
    })

    it('hides the handle while full screen and on phones', () => {
      const { unmount } = render(renderResizable({ expandable: true }))

      fireEvent.click(screen.getByRole('button', { name: 'Expand to full screen' }))

      expect(screen.queryByRole('separator', { name: 'Resize panel' })).not.toBeInTheDocument()

      unmount()
      jest.mocked(useIsMobile).mockReturnValue(true)
      render(renderResizable())

      expect(screen.queryByRole('separator', { name: 'Resize panel' })).not.toBeInTheDocument()
    })
  })
})
