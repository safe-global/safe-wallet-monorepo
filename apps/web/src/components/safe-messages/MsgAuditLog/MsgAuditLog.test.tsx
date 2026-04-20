import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { render } from '@/tests/test-utils'
import { screen } from '@testing-library/react'
import { toBeHex } from 'ethers'
import MsgAuditLog from '.'

jest.mock('@/hooks/useAddressBook', () => jest.fn(() => ({})))

const buildMsg = (overrides: Partial<MessageItem> = {}): MessageItem => ({
  confirmations: [],
  confirmationsRequired: 2,
  confirmationsSubmitted: 0,
  creationTimestamp: 1712000000000,
  message: '',
  logoUri: null,
  messageHash: '0xabc123',
  modifiedTimestamp: 1712000060000,
  name: null,
  proposedBy: { value: toBeHex('0x1', 20) },
  status: 'NEEDS_CONFIRMATION',
  type: 'MESSAGE',
  ...overrides,
})

describe('MsgAuditLog', () => {
  it('renders audit log header with confirmation count', () => {
    render(<MsgAuditLog msg={buildMsg({ confirmationsSubmitted: 1, confirmationsRequired: 3 })} />)

    expect(screen.getByText('Audit log')).toBeInTheDocument()
    expect(screen.getByTestId('msg-audit-log')).toBeInTheDocument()
  })

  it('renders Created row with proposer address', () => {
    render(<MsgAuditLog msg={buildMsg()} />)

    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('renders Signed rows for each confirmation', () => {
    const msg = buildMsg({
      confirmations: [
        { owner: { value: toBeHex('0x1', 20) }, signature: '0x111' },
        { owner: { value: toBeHex('0x2', 20) }, signature: '0x222' },
      ],
      confirmationsSubmitted: 2,
      confirmationsRequired: 3,
    })

    render(<MsgAuditLog msg={msg} />)

    expect(screen.getByText('Signed (1/3)')).toBeInTheDocument()
    expect(screen.getByText('Signed (2/3)')).toBeInTheDocument()
  })

  it('renders Confirmed row when message is confirmed', () => {
    const msg = buildMsg({
      status: 'CONFIRMED',
      confirmations: [
        { owner: { value: toBeHex('0x1', 20) }, signature: '0x111' },
        { owner: { value: toBeHex('0x2', 20) }, signature: '0x222' },
      ],
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    render(<MsgAuditLog msg={msg} />)

    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })

  it('shows info banner when not yet confirmed', () => {
    render(<MsgAuditLog msg={buildMsg()} />)

    expect(screen.getByText('Can be confirmed once the threshold is reached.')).toBeInTheDocument()
  })

  it('hides info banner when confirmed', () => {
    const msg = buildMsg({
      status: 'CONFIRMED',
      confirmations: [{ owner: { value: toBeHex('0x1', 20) }, signature: '0x111' }],
      confirmationsSubmitted: 1,
      confirmationsRequired: 1,
    })

    render(<MsgAuditLog msg={msg} />)

    expect(screen.queryByText('Can be confirmed once the threshold is reached.')).not.toBeInTheDocument()
  })
})
