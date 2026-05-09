import {
  TransactionInfoType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'
import { render } from '@/tests/test-utils'
import TransferTxInfo from '.'
import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import * as useTransferFiatValueModule from './useTransferFiatValue'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChainId: () => '1',
  useChain: () => chainBuilder().with({ chainId: '1' }).build(),
  useCurrentChain: () => chainBuilder().with({ chainId: '1' }).build(),
  useHasFeature: () => false,
  default: () => ({
    loading: false,
    loaded: true,
    error: undefined,
    configs: [chainBuilder().with({ chainId: '1' }).build()],
  }),
}))

const addr = (): `0x${string}` => faker.finance.ethereumAddress() as `0x${string}`
const useTransferFiatValueSpy = jest.spyOn(useTransferFiatValueModule, 'default')

const renderTransferTxInfo = ({
  direction = TransferDirection.OUTGOING,
  trusted = true,
  imitation = false,
  tokenTrusted = true,
  tokenImitation = false,
  tokenValue = parseUnits('1', 18).toString(),
  txStatus = TransactionStatus.SUCCESS,
}: {
  direction?: TransferDirection
  trusted?: boolean
  imitation?: boolean
  tokenTrusted?: boolean
  tokenImitation?: boolean
  tokenValue?: string
  txStatus?: TransactionStatus
} = {}) => {
  const recipient = addr()
  const sender = addr()
  const tokenAddress = addr()

  return {
    recipient,
    sender,
    ...render(
      <TransferTxInfo
        imitation={imitation}
        trusted={trusted}
        txInfo={{
          direction,
          recipient: { value: recipient },
          sender: { value: sender },
          type: TransactionInfoType.TRANSFER,
          transferInfo: {
            tokenAddress,
            trusted: tokenTrusted,
            type: TransactionTokenType.ERC20,
            decimals: 18,
            value: tokenValue,
            tokenName: 'Test',
            tokenSymbol: 'TST',
            imitation: tokenImitation,
          },
        }}
        txStatus={txStatus}
      />,
    ),
  }
}

describe('TransferTxInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useTransferFiatValueSpy.mockReturnValue(null)
  })

  describe('should render non-malicious', () => {
    it('outgoing tx', () => {
      const { recipient, getByText, queryByText, queryByLabelText } = renderTransferTxInfo()

      expect(getByText('1 TST')).toBeInTheDocument()
      expect(getByText(recipient)).toBeInTheDocument()
      expect(queryByText('malicious', { exact: false })).toBeNull()
      expect(queryByLabelText('This token isn\u2019t verified on major token lists', { exact: false })).toBeNull()
    })

    it('incoming tx', () => {
      const { sender, getByText, queryByText, queryByLabelText } = renderTransferTxInfo({
        direction: TransferDirection.INCOMING,
        tokenValue: parseUnits('12.34', 18).toString(),
      })

      expect(getByText('12.34 TST')).toBeInTheDocument()
      expect(getByText(sender)).toBeInTheDocument()
      expect(queryByText('malicious', { exact: false })).toBeNull()
      expect(queryByLabelText('This token isn\u2019t verified on major token lists', { exact: false })).toBeNull()
    })
  })

  describe('should render untrusted', () => {
    it('outgoing tx', () => {
      const { recipient, getByText, queryByText, getByLabelText } = renderTransferTxInfo({
        trusted: false,
        tokenTrusted: false,
      })

      expect(getByText('1 TST')).toBeInTheDocument()
      expect(getByText(recipient)).toBeInTheDocument()
      expect(queryByText('malicious', { exact: false })).toBeNull()
      expect(
        getByLabelText('This token isn\u2019t verified on major token lists', { exact: false }),
      ).toBeInTheDocument()
    })

    it('incoming tx', () => {
      const { sender, getByText, queryByText, queryByLabelText } = renderTransferTxInfo({
        direction: TransferDirection.INCOMING,
        trusted: false,
        tokenValue: parseUnits('12.34', 18).toString(),
      })

      expect(getByText('12.34 TST')).toBeInTheDocument()
      expect(getByText(sender)).toBeInTheDocument()
      expect(queryByText('malicious', { exact: false })).toBeNull()
      expect(
        queryByLabelText('This token isn\u2019t verified on major token lists', { exact: false }),
      ).toBeInTheDocument()
    })
  })

  describe('should render imitations', () => {
    it('outgoing tx', () => {
      const { recipient, getByText, queryByLabelText } = renderTransferTxInfo({
        imitation: true,
        tokenImitation: true,
      })

      expect(getByText('1 TST')).toBeInTheDocument()
      expect(getByText(recipient)).toBeInTheDocument()
      expect(getByText('malicious', { exact: false })).toBeInTheDocument()
      expect(queryByLabelText('This token isn\u2019t verified on major token lists', { exact: false })).toBeNull()
    })

    it('incoming tx', () => {
      const { sender, getByText, queryByLabelText } = renderTransferTxInfo({
        direction: TransferDirection.INCOMING,
        imitation: true,
        tokenImitation: true,
        tokenValue: parseUnits('12.34', 18).toString(),
      })

      expect(getByText('12.34 TST')).toBeInTheDocument()
      expect(getByText(sender)).toBeInTheDocument()
      expect(getByText('malicious', { exact: false })).toBeInTheDocument()
      expect(queryByLabelText('This token isn\u2019t verified on major token lists', { exact: false })).toBeNull()
    })

    it('untrusted and imitation tx', () => {
      const { sender, getByText, queryByLabelText } = renderTransferTxInfo({
        direction: TransferDirection.INCOMING,
        trusted: false,
        imitation: true,
        tokenImitation: true,
        tokenValue: parseUnits('12.34', 18).toString(),
      })

      expect(getByText('12.34 TST')).toBeInTheDocument()
      expect(getByText(sender)).toBeInTheDocument()
      expect(getByText('malicious', { exact: false })).toBeInTheDocument()
      expect(queryByLabelText("This token isn't verified on major token lists", { exact: false })).toBeNull()
    })
  })

  describe('fiat value display', () => {
    it('should show fiat value when useTransferFiatValue returns a value', () => {
      useTransferFiatValueSpy.mockReturnValue(1000)

      const { getByLabelText } = renderTransferTxInfo()

      expect(getByLabelText('$ 1,000.00')).toBeInTheDocument()
    })

    it('should not show fiat value when useTransferFiatValue returns null', () => {
      const { queryByLabelText } = renderTransferTxInfo()

      expect(queryByLabelText(/^\$/)).not.toBeInTheDocument()
    })

    it('should show a different fiat value when hook returns a different amount', () => {
      useTransferFiatValueSpy.mockReturnValue(500)

      const { getByLabelText } = renderTransferTxInfo({
        tokenValue: parseUnits('5', 18).toString(),
      })

      expect(getByLabelText('$ 500.00')).toBeInTheDocument()
    })
  })
})
