import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts'
import {
  ERC20_INTERFACE,
  PSEUDO_APPROVAL_VALUES,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { UNLIMITED_APPROVAL_AMOUNT } from '@safe-global/utils/utils/tokens'
import { TokenType } from '@safe-global/store/gateway/types'
import { renderHook } from '@/src/tests/test-utils'
import type { DraftTx } from '@/src/store/draftTxSlice'
import { useApprovalInfos } from './useApprovalInfos'

const mockUseBalances = jest.fn()
jest.mock('@/src/hooks/useBalances', () => ({
  useBalances: (...args: unknown[]) => mockUseBalances(...args),
}))

const mockUseGetErc20TokenInfosQuery = jest.fn()
jest.mock('@/src/store/signersBalance', () => ({
  ...jest.requireActual('@/src/store/signersBalance'),
  useGetErc20TokenInfosQuery: (...args: unknown[]) => mockUseGetErc20TokenInfosQuery(...args),
}))

const MULTISEND_INTERFACE = Multi_send__factory.createInterface()

const tokenAddress = faker.finance.ethereumAddress()
const spender = faker.finance.ethereumAddress()

const buildDraft = (buildParams: Partial<DraftTx['buildParams']>): DraftTx => {
  const safeTxHash = `0x${faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' })}`
  return {
    chainId: '1',
    safeAddress: faker.finance.ethereumAddress(),
    buildParams: { to: tokenAddress, value: '0', data: '0x', nonce: 0, ...buildParams },
    safeTxHash,
    txDetails: { txId: safeTxHash } as TransactionDetails,
  }
}

const balancesWithToken = (decimals = 6): { balances: Balances } => ({
  balances: {
    fiatTotal: '0',
    items: [
      {
        tokenInfo: {
          type: 'ERC20',
          address: tokenAddress,
          decimals,
          symbol: 'USDC',
          name: 'USD Coin',
          logoUri: faker.internet.url(),
        },
        balance: '100000000',
        fiatBalance: '100',
        fiatConversion: '1',
      },
    ],
  } as unknown as Balances,
})

describe('useApprovalInfos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseBalances.mockReturnValue(balancesWithToken())
    mockUseGetErc20TokenInfosQuery.mockReturnValue({ data: undefined })
  })

  it('returns undefined without a draft', () => {
    const { result } = renderHook(() => useApprovalInfos(undefined))
    expect(result.current).toBeUndefined()
  })

  it('returns undefined for a transaction without approvals', () => {
    const draft = buildDraft({ data: '0xbaddad' })
    const { result } = renderHook(() => useApprovalInfos(draft))
    expect(result.current).toBeUndefined()
  })

  it('detects an approve call and resolves token info from balances', () => {
    const amount = parseUnits('100', 6)
    const draft = buildDraft({ data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, amount]) })

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current).toHaveLength(1)
    expect(result.current?.[0]).toMatchObject({
      amount,
      amountFormatted: '100',
      method: 'approve',
      transactionIndex: 0,
      // equal to the Safe's balance of 100 USDC
      isHighValue: false,
      balance: '100000000',
    })
    expect(result.current?.[0].tokenInfo?.symbol).toEqual('USDC')
    expect(result.current?.[0].spender.toLowerCase()).toEqual(spender.toLowerCase())
    // must request ALL balances (not just trusted), unskipped since approvals exist
    expect(mockUseBalances).toHaveBeenCalledWith(false, undefined, false, false)
  })

  it('flags approvals above the balance as high value, but not those with unknown balance', () => {
    const aboveBalance = parseUnits('101', 6)
    const draft = buildDraft({ data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, aboveBalance]) })
    const { result } = renderHook(() => useApprovalInfos(draft))
    expect(result.current?.[0].isHighValue).toBe(true)

    // Loading, failed, or not-held balances are not verifiably high value
    mockUseBalances.mockReturnValue({ balances: undefined })
    const { result: unknownBalanceResult } = renderHook(() => useApprovalInfos(draft))
    expect(unknownBalanceResult.current?.[0].isHighValue).toBe(false)
  })

  it('formats the unlimited amount as the unlimited pseudo value and flags it high value', () => {
    const draft = buildDraft({
      data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, UNLIMITED_APPROVAL_AMOUNT]),
    })

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current?.[0].amountFormatted).toEqual(PSEUDO_APPROVAL_VALUES.UNLIMITED)
    expect(result.current?.[0].isHighValue).toBe(true)
  })

  it('falls back to the preview tokenInfoIndex for tokens outside the balance list', () => {
    mockUseBalances.mockReturnValue({ balances: undefined })
    const draft = buildDraft({ data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, 42_000_000n]) })
    draft.txDetails = {
      ...draft.txDetails,
      txData: {
        to: { value: tokenAddress },
        operation: 0,
        tokenInfoIndex: {
          [tokenAddress]: {
            address: tokenAddress,
            decimals: 6,
            logoUri: faker.internet.url(),
            name: 'Test USDC',
            symbol: 'tUSDC',
            type: 'ERC20',
          },
        },
      },
    } as TransactionDetails

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current).toHaveLength(1)
    expect(result.current?.[0].tokenInfo?.symbol).toEqual('tUSDC')
    expect(result.current?.[0].amountFormatted).toEqual('42')
  })

  it('falls back to on-chain token info for tokens in neither balances nor the preview', () => {
    mockUseBalances.mockReturnValue({ balances: undefined })
    mockUseGetErc20TokenInfosQuery.mockReturnValue({
      data: {
        [tokenAddress.toLowerCase()]: { address: tokenAddress, decimals: 6, symbol: 'ONCH', type: TokenType.ERC20 },
      },
    })
    const draft = buildDraft({ data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, 42_000_000n]) })

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current).toHaveLength(1)
    expect(result.current?.[0].tokenInfo?.symbol).toEqual('ONCH')
    expect(result.current?.[0].amountFormatted).toEqual('42')
  })

  it('marks tokens resolved as ERC-721 on-chain so the card renders read-only', () => {
    mockUseBalances.mockReturnValue({ balances: undefined })
    mockUseGetErc20TokenInfosQuery.mockReturnValue({
      data: {
        [tokenAddress.toLowerCase()]: { address: tokenAddress, decimals: 0, symbol: 'NFT', type: TokenType.ERC721 },
      },
    })
    const draft = buildDraft({ data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, 5n]) })

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current?.[0].tokenInfo?.type).toEqual(TokenType.ERC721)
  })

  it('leaves tokenInfo undefined for tokens found nowhere', () => {
    mockUseBalances.mockReturnValue({ balances: undefined })
    const draft = buildDraft({ data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, 42n]) })

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current).toHaveLength(1)
    expect(result.current?.[0].tokenInfo).toBeUndefined()
  })

  it('detects approvals inside a multiSend batch with their transaction index', () => {
    const amount = parseUnits('1', 6)
    const multiSendData = encodeMultiSendData([
      { to: faker.finance.ethereumAddress(), value: '0', data: '0xbaddad', operation: OperationType.Call },
      {
        to: tokenAddress,
        value: '0',
        data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, amount]),
        operation: OperationType.Call,
      },
    ])
    const draft = buildDraft({
      to: faker.finance.ethereumAddress(),
      data: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [multiSendData]),
    })

    const { result } = renderHook(() => useApprovalInfos(draft))

    expect(result.current).toHaveLength(1)
    expect(result.current?.[0]).toMatchObject({ amount, method: 'approve', transactionIndex: 1 })
    expect(result.current?.[0].tokenInfo?.symbol).toEqual('USDC')
  })
})
