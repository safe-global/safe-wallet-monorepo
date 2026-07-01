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
  resolved: null,
  usingTrusted: false,
  allowTrusted: true,
  expanded: false,
  path: null,
  mid: '',
  ack: false,
  midMatch: false,
  expand: jest.fn(),
  useTrusted: jest.fn(),
  chooseDifferent: jest.fn(),
  setMid: jest.fn(),
  toggleAck: jest.fn(),
  compareAgain: jest.fn(),
  ...over,
})

describe('AddressPoisoningGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders nothing for a clean address', () => {
    mockGuard.mockReturnValue(baseGuard({ level: 'none' }))
    const { container } = render(<AddressPoisoningGuard address="0xclean" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the critical banner as an alert and reports blocked', () => {
    const onBlockedChange = jest.fn()
    mockGuard.mockReturnValue(
      baseGuard({ level: 'critical', isBlocked: true, anchorAddress: '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678' }),
    )
    render(
      <AddressPoisoningGuard address="0xa1b2ffffffffffffffffffffffffffffffff5678" onBlockedChange={onBlockedChange} />,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/address-poisoning attack/i)).toBeInTheDocument()
    expect(onBlockedChange).toHaveBeenCalledWith(true)
  })

  it('shows the green trusted-resolved chip (no alert)', () => {
    mockGuard.mockReturnValue(baseGuard({ level: 'none', resolved: { kind: 'trusted' } }))
    render(<AddressPoisoningGuard address="0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/verified address/i)).toBeInTheDocument()
  })
})
