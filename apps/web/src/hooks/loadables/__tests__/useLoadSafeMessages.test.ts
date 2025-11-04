import { renderHook, waitFor } from '@/tests/test-utils'
import useLoadSafeMessages from '@/hooks/loadables/useLoadSafeMessages'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { MessagePage, MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { faker } from '@faker-js/faker'

const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'
const CHAIN_ID = '1'

describe('useLoadSafeMessages hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: {
        chainId: CHAIN_ID,
        deployed: true,
        messagesTag: '0',
      },
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    } as ReturnType<typeof useSafeInfo.default>)
  })

  it('should fetch safe messages successfully', async () => {
    const mockMessages: MessageItem[] = [
      {
        type: 'MESSAGE',
        messageHash: faker.string.hexadecimal({ length: 66, prefix: '0x' }),
        status: 'NEEDS_CONFIRMATION',
        logoUri: null,
        name: null,
        message: 'Test message 1',
        creationTimestamp: Date.now(),
        modifiedTimestamp: Date.now(),
        confirmationsSubmitted: 1,
        confirmationsRequired: 2,
        proposedBy: {
          value: faker.string.hexadecimal({ length: 40, prefix: '0x' }),
          name: null,
          logoUri: null,
        },
        confirmations: [],
        preparedSignature: null,
        origin: null,
      },
      {
        type: 'MESSAGE',
        messageHash: faker.string.hexadecimal({ length: 66, prefix: '0x' }),
        status: 'CONFIRMED',
        logoUri: null,
        name: null,
        message: 'Test message 2',
        creationTimestamp: Date.now() - 10000,
        modifiedTimestamp: Date.now() - 10000,
        confirmationsSubmitted: 2,
        confirmationsRequired: 2,
        proposedBy: {
          value: faker.string.hexadecimal({ length: 40, prefix: '0x' }),
          name: null,
          logoUri: null,
        },
        confirmations: [],
        preparedSignature: null,
        origin: null,
      },
    ]

    const mockMessagePage: MessagePage = {
      count: 2,
      next: null,
      previous: null,
      results: mockMessages,
    }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, ({ params }) => {
        if (params.chainId === CHAIN_ID && params.safeAddress === SAFE_ADDRESS) {
          return HttpResponse.json(mockMessagePage)
        }
        return HttpResponse.json({ results: [] }, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useLoadSafeMessages())

    // Initially should be loading
    expect(result.current[2]).toBe(true) // isLoading

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current[2]).toBe(false) // isLoading should be false
    })

    const [messages, error] = result.current

    // Verify data was fetched
    expect(messages).toBeDefined()
    expect(messages?.results).toHaveLength(2)
    expect(messages?.results[0]).toMatchObject({
      type: 'MESSAGE',
      status: 'NEEDS_CONFIRMATION',
    })
    expect(error).toBeUndefined()
  })

  it('should return empty results when safe is not deployed', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: {
        chainId: CHAIN_ID,
        deployed: false,
        messagesTag: '0',
      },
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    } as ReturnType<typeof useSafeInfo.default>)

    const { result } = renderHook(() => useLoadSafeMessages())

    // Should return empty results without loading
    expect(result.current[2]).toBe(false) // isLoading should be false
    expect(result.current[0]).toEqual({ results: [] })
    expect(result.current[1]).toBeUndefined() // no error
  })

  it('should skip query when safe is not loaded', () => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: {
        chainId: CHAIN_ID,
        deployed: true,
        messagesTag: '0',
      },
      safeAddress: SAFE_ADDRESS,
      safeLoaded: false,
      safeLoading: true,
      safeError: undefined,
    } as ReturnType<typeof useSafeInfo.default>)

    const { result } = renderHook(() => useLoadSafeMessages())

    // Should not fetch data
    expect(result.current[2]).toBe(false) // isLoading should be false
    expect(result.current[0]).toBeUndefined() // data should be undefined
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, () => {
        return HttpResponse.error()
      }),
    )

    const { result } = renderHook(() => useLoadSafeMessages())

    await waitFor(() => {
      expect(result.current[2]).toBe(false) // isLoading should be false
    })

    const [messages, error] = result.current

    // Data should be undefined on error
    expect(messages).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should return data in tuple format compatible with destructuring', async () => {
    const mockMessagePage: MessagePage = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          type: 'MESSAGE',
          messageHash: faker.string.hexadecimal({ length: 66, prefix: '0x' }),
          status: 'CONFIRMED',
          logoUri: null,
          name: null,
          message: 'Test message',
          creationTimestamp: Date.now(),
          modifiedTimestamp: Date.now(),
          confirmationsSubmitted: 2,
          confirmationsRequired: 2,
          proposedBy: {
            value: faker.string.hexadecimal({ length: 40, prefix: '0x' }),
            name: null,
            logoUri: null,
          },
          confirmations: [],
          preparedSignature: null,
          origin: null,
        },
      ],
    }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, () => {
        return HttpResponse.json(mockMessagePage)
      }),
    )

    const { result } = renderHook(() => useLoadSafeMessages())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    // Should be destructurable as [data, error, isLoading]
    const [data, error, isLoading] = result.current

    expect(data).toBeDefined()
    expect(data?.results).toHaveLength(1)
    expect(error).toBeUndefined()
    expect(isLoading).toBe(false)
  })

  it('should handle messages with date labels', async () => {
    const mockMessagePage: MessagePage = {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          type: 'DATE_LABEL',
          timestamp: Date.now(),
        },
        {
          type: 'MESSAGE',
          messageHash: faker.string.hexadecimal({ length: 66, prefix: '0x' }),
          status: 'NEEDS_CONFIRMATION',
          logoUri: null,
          name: null,
          message: 'Test message',
          creationTimestamp: Date.now(),
          modifiedTimestamp: Date.now(),
          confirmationsSubmitted: 0,
          confirmationsRequired: 2,
          proposedBy: {
            value: faker.string.hexadecimal({ length: 40, prefix: '0x' }),
            name: null,
            logoUri: null,
          },
          confirmations: [],
          preparedSignature: null,
          origin: null,
        },
      ],
    }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/messages`, () => {
        return HttpResponse.json(mockMessagePage)
      }),
    )

    const { result } = renderHook(() => useLoadSafeMessages())

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const [messages] = result.current

    expect(messages?.results).toHaveLength(2)
    expect(messages?.results[0]).toMatchObject({ type: 'DATE_LABEL' })
    expect(messages?.results[1]).toMatchObject({ type: 'MESSAGE' })
  })
})
