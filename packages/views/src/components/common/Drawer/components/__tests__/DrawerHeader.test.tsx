import { Copy } from 'lucide-react'
import { render, screen, fireEvent } from '@/tests/test-utils'
import { Drawer } from '../../Drawer'
import { DrawerHeader } from '../DrawerHeader'

describe('DrawerHeader', () => {
  it('renders the media, title and subtitle', () => {
    render(<DrawerHeader media={<span>ICON</span>} title="Operations Vault" subtitle="Nonce #42" />)

    expect(screen.getByText('ICON')).toBeInTheDocument()
    expect(screen.getByText('Operations Vault')).toBeInTheDocument()
    expect(screen.getByText('Nonce #42')).toBeInTheDocument()
  })

  it('shows the status in place of the subtitle', () => {
    render(<DrawerHeader title="Allowlist" subtitle="Nonce #42" status={<span>Pending</span>} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByText('Nonce #42')).not.toBeInTheDocument()
  })

  it('has no buttons outside a Drawer when none are passed', () => {
    render(<DrawerHeader title="Allowlist" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('closes the enclosing Drawer from its own close button, replacing the Drawer fallback', () => {
    const onClose = jest.fn()
    render(
      <Drawer open onClose={onClose} ariaLabel="Allowlist">
        <DrawerHeader title="Allowlist" />
      </Drawer>,
    )

    const close = screen.getByRole('button', { name: 'Close' })

    expect(close.closest('[data-slot=drawer-header]')).not.toBeNull()

    fireEvent.click(close)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('steps through items and disables the ends', () => {
    const onPrevious = jest.fn()
    const onNext = jest.fn()
    render(<DrawerHeader title="Transaction" navigation={{ onPrevious, onNext, hasPrevious: false, hasNext: true }} />)

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  it('announces the position in the list', () => {
    render(<DrawerHeader title="Transaction" navigation={{ onNext: jest.fn(), hasNext: true, position: '3 of 12' }} />)

    expect(screen.getByText('3 of 12')).toHaveAttribute('aria-live', 'polite')
  })

  it('renders back and extra actions in the button group', () => {
    const onBack = jest.fn()
    const onCopy = jest.fn()
    render(
      <DrawerHeader
        title="Spending limit"
        onBack={onBack}
        actions={[{ label: 'Copy link', icon: <Copy />, onClick: onCopy }]}
      />,
    )

    const group = screen.getByRole('group', { name: 'Drawer actions' })

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(group).toContainElement(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it('names the drawer with its title as a heading', () => {
    render(
      <Drawer open onClose={jest.fn()}>
        <DrawerHeader title="Allowlist" />
      </Drawer>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Allowlist' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Allowlist' })).toBeInTheDocument()
  })

  it('shows key hints for previous and next only when the page passes them', () => {
    const navigation = { onPrevious: jest.fn(), onNext: jest.fn(), hasPrevious: true, hasNext: true }
    const { rerender } = render(<DrawerHeader title="Transaction" navigation={navigation} />)

    fireEvent.focus(screen.getByRole('button', { name: 'Next' }))

    expect(document.querySelector('[data-slot=tooltip-content]')).toHaveTextContent(/^Next$/)

    rerender(
      <DrawerHeader title="Transaction" navigation={{ ...navigation, shortcuts: { previous: 'K', next: 'J' } }} />,
    )

    expect(document.querySelector('[data-slot=tooltip-content]')).toHaveTextContent('NextJ')
  })
})
