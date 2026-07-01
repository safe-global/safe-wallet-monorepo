import { render, screen } from '@testing-library/react'
import AddressPoisoningGuard from './index'
import * as guardHook from '../../hooks/useAddressPoisoningGuard'
import type { AddressPoisoningGuard as Guard } from '../../hooks/useAddressPoisoningGuard'

jest.mock('../../hooks/useAddressPoisoningGuard')
jest.mock('@/hooks/useAddressResolver', () => ({
  useAddressResolver: () => ({ name: 'Acme Treasury', ens: undefined, resolving: false }),
}))

const mockGuard = guardHook.default as jest.Mock

const baseGuard = (over: Partial<Guard>): Guard => ({
  level: 'none',
  match: null,
  anchorAddress: undefined,
  parts: { front: '0xa1b2', middle: 'ffffffffffffffffffffffffffffffff', back: '5678' },
  isBlocked: false,
  blockedHint: '',
  usingTrusted: false,
  allowTrusted: true,
  ack: false,
  useTrusted: jest.fn(),
  undoTrusted: jest.fn(),
  toggleAck: jest.fn(),
  ...over,
})

describe('AddressPoisoningGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing for a clean address', () => {
    mockGuard.mockReturnValue(baseGuard({ level: 'none' }))
    const { container } = render(<AddressPoisoningGuard address="0xclean" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the critical banner as an alert and reports blocked with the button-side hint', () => {
    const onBlockedChange = jest.fn()
    mockGuard.mockReturnValue(
      baseGuard({
        level: 'critical',
        isBlocked: true,
        blockedHint: 'Verify the recipient to continue',
        anchorAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
      }),
    )
    render(
      <AddressPoisoningGuard address="0xa1b2ffffffffffffffffffffffffffffffff5678" onBlockedChange={onBlockedChange} />,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/address-poisoning attack/i)).toBeInTheDocument()
    // The hint is reported up (rendered next to the host's button), not inside the card.
    expect(onBlockedChange).toHaveBeenCalledWith(true, { text: 'Verify the recipient to continue', tone: 'critical' })
    expect(screen.queryByText(/verify the recipient to continue/i)).not.toBeInTheDocument()
  })

  it('offers the trusted swap and the attestation on the critical banner (recipient context)', () => {
    mockGuard.mockReturnValue(
      baseGuard({
        level: 'critical',
        isBlocked: true,
        allowTrusted: true,
        anchorAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
      }),
    )
    render(<AddressPoisoningGuard address="0xa1b2ffffffffffffffffffffffffffffffff5678" />)
    expect(screen.getByRole('button', { name: /saved address/i })).toBeInTheDocument()
    expect(screen.getByText(/separate, trusted channel/i)).toBeInTheDocument()
  })

  it('hides the trusted swap for add-entity context and reports the address hint', () => {
    const onBlockedChange = jest.fn()
    mockGuard.mockReturnValue(
      baseGuard({
        level: 'critical',
        isBlocked: true,
        allowTrusted: false,
        blockedHint: 'Verify the address to continue',
        anchorAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
      }),
    )
    render(
      <AddressPoisoningGuard
        address="0xa1b2ffffffffffffffffffffffffffffffff5678"
        context="add-entity"
        onBlockedChange={onBlockedChange}
      />,
    )
    expect(screen.queryByRole('button', { name: /saved address/i })).not.toBeInTheDocument()
    expect(onBlockedChange).toHaveBeenCalledWith(true, { text: 'Verify the address to continue', tone: 'critical' })
  })

  it('shows the green trusted-resolved chip with an undo (no alert)', () => {
    mockGuard.mockReturnValue(baseGuard({ level: 'critical', usingTrusted: true }))
    render(<AddressPoisoningGuard address="0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/verified address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
  })
})
