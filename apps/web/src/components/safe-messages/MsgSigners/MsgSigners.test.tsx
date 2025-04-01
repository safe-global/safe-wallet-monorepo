import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { render } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import MsgSigners from '.'

describe('MsgSigners', () => {
  it('Message with more confirmations submitted than required', () => {
    const mockMessage: MessageItem = {
      confirmations: [
        {
          owner: {
            value: toBeHex('0x1', 20),
          },
          signature: '0x123',
        },
        {
          owner: {
            value: toBeHex('0x2', 20),
          },
          signature: '0x456',
        },
      ],
      confirmationsRequired: 1,
      confirmationsSubmitted: 2,
      creationTimestamp: 0,
      message: '',
      logoUri: null,
      messageHash: '',
      modifiedTimestamp: 0,
      name: null,
      proposedBy: {
        value: '',
      },
      status: 'NEEDS_CONFIRMATION',
      type: 'MESSAGE',
    }

    const result = render(<MsgSigners msg={mockMessage} />)

    expect(result.baseElement).toHaveTextContent('0x0000...0001')
    expect(result.baseElement).toHaveTextContent('0x0000...0002')
    expect(result.baseElement).toHaveTextContent('2 of 1')
  })

  it('should show missing signatures if prop is enabled', () => {
    const mockMessage: MessageItem = {
      confirmations: [
        {
          owner: {
            value: toBeHex('0x1', 20),
          },
          signature: '0x123',
        },
      ],
      confirmationsRequired: 5,
      confirmationsSubmitted: 1,
      creationTimestamp: 0,
      message: '',
      logoUri: null,
      messageHash: '',
      modifiedTimestamp: 0,
      name: null,
      proposedBy: {
        value: '',
      },
      status: 'NEEDS_CONFIRMATION',
      type: 'MESSAGE',
    }

    const result = render(<MsgSigners msg={mockMessage} showMissingSignatures />)

    expect(result.baseElement).toHaveTextContent('0x0000...0001')
    expect(result.baseElement).toHaveTextContent('1 of 5')
    expect(result.baseElement).toHaveTextContent('Confirmation #2')
    expect(result.baseElement).toHaveTextContent('Confirmation #3')
    expect(result.baseElement).toHaveTextContent('Confirmation #4')
    expect(result.baseElement).toHaveTextContent('Confirmation #5')
  })
})
