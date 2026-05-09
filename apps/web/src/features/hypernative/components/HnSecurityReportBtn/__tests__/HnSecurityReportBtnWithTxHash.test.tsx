import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { HnSecurityReportBtnWithTxHash } from '../HnSecurityReportBtnWithTxHash'
import type {
  TransactionDetails,
  MultisigExecutionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'

jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/useSafeInfo')

const mockUseChainId = useChainIdHook.default as jest.MockedFunction<typeof useChainIdHook.default>
const mockUseSafeInfo = useSafeInfoHook.default as jest.MockedFunction<typeof useSafeInfoHook.default>

describe('HnSecurityReportBtnWithTxHash', () => {
  const mockChainId = faker.string.numeric({ length: { min: 1, max: 5 } })
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockSafeTxHash = faker.string.hexadecimal({ length: 64, prefix: '0x' })

  const createMockTxDetails = (safeTxHash: string): TransactionDetails => {
    const mockDetailedExecutionInfo: MultisigExecutionDetails = {
      type: 'MULTISIG',
      submittedAt: faker.date.past().getTime(),
      nonce: faker.number.int({ min: 0, max: 1000 }),
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: faker.finance.ethereumAddress(),
      refundReceiver: {
        value: faker.finance.ethereumAddress(),
        name: null,
        logoUri: null,
      },
      safeTxHash,
      executor: null,
      signers: [],
      confirmationsRequired: faker.number.int({ min: 1, max: 10 }),
      confirmations: [],
      rejectors: [],
      gasTokenInfo: null,
      trusted: true,
      proposer: null,
      proposedByDelegate: null,
    }

    const toAddress = faker.finance.ethereumAddress()

    return {
      safeAddress: mockSafeAddress,
      txId: `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64, prefix: '0x' })}`,
      executedAt: null,
      txStatus: 'AWAITING_CONFIRMATIONS',
      txInfo: {
        type: 'Custom',
        to: { value: toAddress, name: null, logoUri: null },
        dataSize: '0',
        value: '0',
        isCancellation: false,
      },
      txData: {
        hexData: '0x',
        dataDecoded: null,
        to: { value: toAddress, name: null, logoUri: null },
        value: faker.number.int({ min: 0, max: 1000000 }).toString(),
        operation: 0,
        trustedDelegateCallTarget: null,
        addressInfoIndex: null,
        tokenInfoIndex: null,
      },
      detailedExecutionInfo: mockDetailedExecutionInfo,
      txHash: null,
    } as TransactionDetails
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChainId.mockReturnValue(mockChainId)
    mockUseSafeInfo.mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: {} as any,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  it('should render button with URL containing the correct safeTxHash from transaction details', () => {
    const txDetails = createMockTxDetails(mockSafeTxHash)

    render(<HnSecurityReportBtnWithTxHash txDetails={txDetails} />)

    const link = screen.getByRole('link', { name: /review security report/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', expect.stringContaining(`tx=${mockSafeTxHash}`))
  })

  it('should include chainId, safe address, and referrer in the URL', () => {
    const txDetails = createMockTxDetails(mockSafeTxHash)

    render(<HnSecurityReportBtnWithTxHash txDetails={txDetails} />)

    const link = screen.getByRole('link', { name: /review security report/i })
    const href = link.getAttribute('href')
    const url = new URL(href!)
    expect(url.searchParams.get('chain')).toBe(`evm:${mockChainId}`)
    expect(url.searchParams.get('safe')).toBe(mockSafeAddress)
    expect(url.searchParams.get('tx')).toBe(mockSafeTxHash)
    expect(url.searchParams.get('referrer')).toBe('safe')
  })

  it('should return null when safeTxHash cannot be calculated', () => {
    const txDetails = createMockTxDetails('')

    const { container } = render(<HnSecurityReportBtnWithTxHash txDetails={txDetails} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should return null when chainId is missing', () => {
    mockUseChainId.mockReturnValue(undefined as any)
    const txDetails = createMockTxDetails(mockSafeTxHash)

    const { container } = render(<HnSecurityReportBtnWithTxHash txDetails={txDetails} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should return null when transaction details do not have multisig execution info', () => {
    const txDetails = createMockTxDetails(mockSafeTxHash)
    txDetails.detailedExecutionInfo = {
      type: 'MODULE',
      address: { value: faker.finance.ethereumAddress(), name: null, logoUri: null },
    } as any

    const { container } = render(<HnSecurityReportBtnWithTxHash txDetails={txDetails} />)

    expect(container).toBeEmptyDOMElement()
  })
})
