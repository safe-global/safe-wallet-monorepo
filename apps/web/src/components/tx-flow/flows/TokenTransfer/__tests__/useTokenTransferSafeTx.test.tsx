import { renderHook, waitFor } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useTokenTransferSafeTx } from '../useTokenTransferSafeTx'
import * as txSender from '@/services/tx/tx-sender'
import * as balancesHook from '@/hooks/loadables/useTrustedTokenBalances'
import type { TokenTransferParams } from '../types'

const mockBalances = () =>
  jest
    .spyOn(balancesHook, 'useTrustedTokenBalances')
    .mockReturnValue([
      { items: [{ tokenInfo: { address: ZERO_ADDRESS, decimals: 18 } }], fiatTotal: '0' } as any,
      undefined,
      false,
    ])

describe('useTokenTransferSafeTx', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds a safeTx once a valid recipient + amount is present', async () => {
    mockBalances()
    const createSpy = jest.spyOn(txSender, 'createMultiSendCallOnlyTx').mockResolvedValue({ data: {} } as any)

    const recipients: TokenTransferParams[] = [
      { recipient: faker.finance.ethereumAddress(), tokenAddress: ZERO_ADDRESS, amount: '1' },
    ]
    renderHook(() => useTokenTransferSafeTx(recipients))

    await waitFor(() => expect(createSpy).toHaveBeenCalled())
  })

  it('does not build a safeTx while the recipient or amount is missing', async () => {
    mockBalances()
    const createSpy = jest.spyOn(txSender, 'createMultiSendCallOnlyTx').mockResolvedValue({ data: {} } as any)

    const recipients: TokenTransferParams[] = [{ recipient: '', tokenAddress: ZERO_ADDRESS, amount: '' }]
    renderHook(() => useTokenTransferSafeTx(recipients))

    // Give the debounce time to settle, then assert nothing was built
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(createSpy).not.toHaveBeenCalled()
  })
})
