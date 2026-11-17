import { http, HttpResponse } from 'msw'
import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'

import { server } from '@/tests/server'
import { act, renderHook } from '@/tests/test-utils'
import { safeMsgBuilder } from '@/tests/builders/safeMessage'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore, setStoreInstance } from '@/store'
import useSyncSafeMessageSigner, { fetchSafeMessage } from '../useSyncSafeMessageSigner'
import { getCgwErrorInfo } from '@/utils/cgw-errors'
import { CGW_ERROR_FALLBACK } from '@safe-global/utils/services/exceptions/gatewayErrors'
import { Errors, logError } from '@/services/exceptions'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as useSafeSignerAddressHook from '@/hooks/wallets/useSafeSignerAddress'
import * as sender from '@/services/safe-messages/safeMsgSender'
import * as notifications from '@/services/safe-messages/safeMsgNotifications'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const HASH = '0x0123'
const CHAIN_ID = '5'

/** Answers each message read with the next status, repeating the last one; returns the read counter. */
const mockMessageReads = (...statuses: number[]) => {
  let reads = 0
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => {
      const status = statuses[Math.min(reads, statuses.length - 1)]
      reads++
      return status === 200
        ? HttpResponse.json({ ...safeMsgBuilder().build(), messageHash: HASH })
        : HttpResponse.json({ message: 'Example error' }, { status })
    }),
  )
  return () => reads
}

describe('fetchSafeMessage', () => {
  beforeEach(() => {
    setStoreInstance(makeStore())
    jest.mocked(logError).mockClear()
  })

  const mockResponse = (status: number) =>
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () =>
        HttpResponse.json({ message: 'Example error' }, { status }),
      ),
    )

  it('preserves the CGW status so the failure can be classified', async () => {
    mockResponse(502)

    await expect(fetchSafeMessage('0x0123', '5')).rejects.toMatchObject({ status: 502 })
  })

  it('resolves to the agreed copy instead of a stringified error object', async () => {
    mockResponse(502)

    let thrown: Error | undefined
    try {
      await fetchSafeMessage('0x0123', '5')
    } catch (error) {
      thrown = error as Error
    }

    expect(getCgwErrorInfo(thrown)?.message).toBe(CGW_ERROR_FALLBACK)
    expect(thrown?.message).not.toContain('[object Object]')
  })

  it('does not retry a message that is not found yet', async () => {
    const reads = mockMessageReads(404, 200)

    await expect(fetchSafeMessage(HASH, CHAIN_ID)).rejects.toMatchObject({ status: 404 })

    expect(reads()).toBe(1)
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(Errors._613, expect.objectContaining({ status: 404 }))
  })
})

describe('useSyncSafeMessageSigner', () => {
  const pendingMessage = { ...safeMsgBuilder().build(), messageHash: HASH }

  const mockSafeInfo = (threshold: number) =>
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: { ...defaultSafeInfo, chainId: CHAIN_ID, threshold },
      safeAddress: defaultSafeInfo.address.value,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

  beforeAll(() => jest.useFakeTimers())

  afterAll(() => jest.useRealTimers())

  beforeEach(() => {
    jest.mocked(logError).mockClear()
    jest.spyOn(useWalletHook, 'default').mockReturnValue({ provider: {} } as unknown as ConnectedWallet)
    jest.spyOn(useSafeSignerAddressHook, 'default').mockReturnValue(undefined)
    mockSafeInfo(2)
    jest.spyOn(sender, 'dispatchSafeMsgProposal').mockResolvedValue()
    jest.spyOn(sender, 'dispatchSafeMsgConfirmation').mockResolvedValue()
  })

  afterEach(() => jest.restoreAllMocks())

  const startSigning = (
    message: MessageItem | undefined,
    onClose: () => void = jest.fn(),
    requestId: string | null = 'request-id',
  ) => {
    const { result, unmount } = renderHook(() =>
      useSyncSafeMessageSigner(message, 'Hello world!', HASH, requestId ?? undefined, undefined, onClose),
    )
    let signed: Promise<MessageItem | undefined> = Promise.resolve(undefined)
    act(() => {
      signed = result.current.onSign()
    })
    return { result, unmount, signed }
  }

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms))

  it.each([
    ['proposes', undefined],
    ['confirms', pendingMessage],
  ])('returns the message when it %s and the read is not found at first', async (_, message) => {
    const reads = mockMessageReads(404, 404, 200)

    const { result, signed } = startSigning(message)
    await elapse(5_000)

    await expect(signed).resolves.toMatchObject({ messageHash: HASH })
    expect(reads()).toBe(3)
    expect(result.current.submitError).toBeUndefined()
    expect(logError).not.toHaveBeenCalled()
  })

  it('shows the error once the message is still not found after the last attempt', async () => {
    const reads = mockMessageReads(404)

    const { result } = startSigning(undefined)
    await elapse(31_000)

    expect(reads()).toBe(8)
    expect(result.current.submitError).toBeUndefined()

    await elapse(5_000)

    expect(reads()).toBe(9)
    expect(result.current.submitError).toMatchObject({ status: 404 })
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError).toHaveBeenCalledWith(Errors._613, expect.objectContaining({ status: 404 }))
  })

  it('stops retrying once the hook unmounts', async () => {
    const reads = mockMessageReads(404)

    const { unmount, signed } = startSigning(undefined)
    await elapse(0)

    expect(reads()).toBe(1)

    unmount()
    await elapse(40_000)

    await expect(signed).resolves.toBeUndefined()
    // backOff decides to retry before its delay, so the attempt scheduled before the unmount still runs
    expect(reads()).toBe(2)
    expect(logError).toHaveBeenCalledTimes(1)
  })

  it('shows any other read failure at once', async () => {
    const reads = mockMessageReads(500, 200)

    const { result } = startSigning(pendingMessage)
    await elapse(0)

    expect(reads()).toBe(1)
    expect(result.current.submitError).toMatchObject({ status: 500 })
    expect(logError).toHaveBeenCalledTimes(1)

    await elapse(40_000)

    expect(reads()).toBe(1)
  })

  describe('at threshold 1', () => {
    const signedMessage = {
      ...safeMsgBuilder().build(),
      messageHash: HASH,
      confirmationsSubmitted: 1,
      confirmationsRequired: 1,
      preparedSignature: '0x0456',
    }

    beforeEach(() => {
      mockSafeInfo(1)
    })

    it('closes the flow once after the signed message is read', async () => {
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, () => HttpResponse.json(signedMessage)),
      )
      const onClose = jest.fn()

      startSigning(undefined, onClose)
      await elapse(5_000)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it.each([
      ['proposes', undefined],
      ['confirms', pendingMessage],
    ])(
      'sends the signature but does not close the flow when it %s and a read in flight at unmount succeeds',
      async (_, message) => {
        let releaseRead: () => void = () => {}
        const heldRead = new Promise<void>((resolve) => {
          releaseRead = resolve
        })
        let reads = 0
        server.use(
          http.get(`${GATEWAY_URL}/v1/chains/:chainId/messages/:messageHash`, async () => {
            reads++
            if (reads === 1) return HttpResponse.json({ message: 'Example error' }, { status: 404 })
            await heldRead
            return HttpResponse.json(signedMessage)
          }),
        )
        const dispatchSpy = jest.spyOn(notifications, 'dispatchPreparedSignature')
        const onClose = jest.fn()

        const { unmount, signed } = startSigning(message, onClose)
        await elapse(2_000)

        expect(reads).toBe(2)

        unmount()
        releaseRead()
        await elapse(5_000)

        await expect(signed).resolves.toMatchObject({ messageHash: HASH })
        expect(dispatchSpy).toHaveBeenCalledTimes(1)
        expect(onClose).not.toHaveBeenCalled()
      },
    )
  })

  describe('without a request id', () => {
    it('closes the flow once the confirmation is sent', async () => {
      const onClose = jest.fn()

      const { signed } = startSigning(pendingMessage, onClose, null)

      await expect(signed).resolves.toBeUndefined()
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not close the flow when the hook unmounts before the confirmation is sent', async () => {
      let releaseConfirmation: () => void = () => {}
      jest.spyOn(sender, 'dispatchSafeMsgConfirmation').mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            releaseConfirmation = resolve
          }),
      )
      const onClose = jest.fn()

      const { unmount, signed } = startSigning(pendingMessage, onClose, null)
      unmount()
      releaseConfirmation()

      await expect(signed).resolves.toBeUndefined()
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
