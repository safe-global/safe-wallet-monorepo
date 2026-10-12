import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useSafeMessagesHook from '@/hooks/messages/useSafeMessages'
import * as signerHook from '@/hooks/messages/useSyncSafeMessageSigner'
import useSafeMessage from '../useSafeMessage'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

const HASH = faker.string.hexadecimal({ length: 64 })
const CHAIN_ID = faker.string.numeric({ allowLeadingZeros: false })

describe('useSafeMessage', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    jest.spyOn(useSafeMessagesHook, 'default').mockReturnValue({ page: undefined, error: undefined, loading: false })
    fetchSpy = jest.spyOn(signerHook, 'fetchSafeMessage').mockResolvedValue({ messageHash: HASH } as MessageItem)
  })

  afterEach(() => jest.restoreAllMocks())

  it('does not fetch while the Safe chainId is empty', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: defaultSafeInfo,
      safeAddress: '',
      safeLoaded: false,
      safeLoading: true,
      safeError: undefined,
    })

    const { result } = renderHook(() => useSafeMessage(HASH))

    await waitFor(() => expect(result.current[0]).toBeUndefined())
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches once the Safe chainId is available', async () => {
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: { ...defaultSafeInfo, chainId: CHAIN_ID },
      safeAddress: faker.finance.ethereumAddress(),
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    const { result } = renderHook(() => useSafeMessage(HASH))

    await waitFor(() => expect(result.current[0]?.messageHash).toBe(HASH))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(HASH, CHAIN_ID)
  })
})
