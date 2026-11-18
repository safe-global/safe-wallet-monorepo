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

  it('brings the close button back when the header goes away while open', () => {
    const { rerender } = render(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer">
        <DrawerHeader title="Drawer title" />
      </Drawer>,
    )

    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1)

    rerender(
      <Drawer open onClose={jest.fn()} ariaLabel="Test drawer">
        <DrawerBody>Body content</DrawerBody>
      </Drawer>,
    )

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.queryByText('Drawer title')).not.toBeInTheDocument()
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
})
