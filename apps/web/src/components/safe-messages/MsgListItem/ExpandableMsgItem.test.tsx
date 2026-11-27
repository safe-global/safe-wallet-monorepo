import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { NESTED_TYPED_DATA_TEXT, nestedTypedData, safeMsgBuilder } from '@/tests/builders/safeMessage'
import * as wallets from '@/utils/wallets'
import ExpandableMsgItem from './ExpandableMsgItem'

const LONG_TEXT = 'Test message 2 off-chain'
const NESTED_STRING_JSON = `"nestedString": "${NESTED_TYPED_DATA_TEXT}"`

const pendingTextMsg = safeMsgBuilder().with({ message: LONG_TEXT }).build()
const pendingTypedMsg = safeMsgBuilder().with({ message: nestedTypedData }).build()
const confirmedMsg = safeMsgBuilder()
  .with({ message: 'Signed', status: 'CONFIRMED', confirmationsSubmitted: 2, confirmationsRequired: 2 })
  .build()

const countOccurrences = (text: string, part: string): number => text.split(part).length - 1

describe('ExpandableMsgItem', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('summary row', () => {
    it.each<{ name: string; msg: MessageItem; title: string; type: string; confirmations: string }>([
      {
        name: 'cuts a long text message to 20 characters',
        msg: pendingTextMsg,
        title: 'Test message 2 off-c…',
        type: 'Signature',
        confirmations: '1/2',
      },
      {
        name: 'shows the first line of a multi-line text message',
        msg: safeMsgBuilder().with({ message: 'First line\nSecond line' }).build(),
        title: 'First line',
        type: 'Signature',
        confirmations: '1/2',
      },
      {
        name: 'shows the domain name and the primary type of a typed message',
        msg: pendingTypedMsg,
        title: 'EIP-1271 Example DApp',
        type: 'Example',
        confirmations: '1/2',
      },
      {
        name: 'shows the name the message was given',
        msg: safeMsgBuilder().with({ name: 'My dApp', message: LONG_TEXT }).build(),
        title: 'My dApp',
        type: 'Signature',
        confirmations: '1/2',
      },
      {
        name: 'shows all confirmations of a confirmed message',
        msg: confirmedMsg,
        title: 'Signed',
        type: 'Signature',
        confirmations: '2/2',
      },
    ])('$name', ({ msg, title, type, confirmations }) => {
      render(<ExpandableMsgItem msg={msg} />)

      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.getByText(type)).toBeInTheDocument()
      expect(screen.getByText(confirmations)).toBeInTheDocument()
    })

    it('offers to sign a message that needs confirmations', () => {
      render(<ExpandableMsgItem msg={pendingTextMsg} />)

      expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument()
    })

    it('shows the status instead of the sign button for a confirmed message', () => {
      render(<ExpandableMsgItem msg={confirmedMsg} />)

      expect(screen.getByText('Confirmed')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument()
    })
  })

  describe('expanded details', () => {
    it('shows the full text of a text message', () => {
      render(<ExpandableMsgItem msg={pendingTextMsg} />)

      fireEvent.click(screen.getByTestId('message-item'))

      expect(screen.getByText(LONG_TEXT)).toBeInTheDocument()
    })

    it('shows the domain and the nested values of a typed message', async () => {
      jest.spyOn(wallets, 'isSmartContract').mockResolvedValue(false)
      const { container } = render(<ExpandableMsgItem msg={pendingTypedMsg} />)

      fireEvent.click(screen.getByTestId('message-item'))

      expect(await screen.findByText('EIP712Domain')).toBeInTheDocument()
      expect(screen.getByText('testNested(Nested)')).toBeInTheDocument()
      expect(countOccurrences(container.textContent ?? '', NESTED_STRING_JSON)).toBe(3)
    })
  })
})
