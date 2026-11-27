import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { useSafeVersions } from '../useSafeVersions'

const SEPOLIA = '11155111'
const SAFE_A = faker.finance.ethereumAddress()
const SAFE_B = faker.finance.ethereumAddress()

const account = (address: string) => ({ id: `${SEPOLIA}:${address}`, chainId: SEPOLIA, address })

describe('useSafeVersions', () => {
  it('reads the version of each account', async () => {
    const requested: string[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, ({ params }) => {
        requested.push(params.safeAddress as string)
        return HttpResponse.json({ version: params.safeAddress === SAFE_A ? '1.5.0' : '1.4.1' })
      }),
    )
    const accounts = [account(SAFE_A), account(SAFE_B)]

    const { result } = renderHook(() => useSafeVersions(accounts))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(requested.sort()).toEqual([SAFE_A, SAFE_B].sort())
    expect(result.current.versions).toEqual(
      new Map([
        [`${SEPOLIA}:${SAFE_A}`, '1.5.0'],
        [`${SEPOLIA}:${SAFE_B}`, '1.4.1'],
      ]),
    )
  })

  it('leaves out an account whose read fails', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, ({ params }) =>
        params.safeAddress === SAFE_A
          ? HttpResponse.json({ version: '1.5.0' })
          : HttpResponse.json({ message: 'down' }, { status: 503 }),
      ),
    )
    const accounts = [account(SAFE_A), account(SAFE_B)]

    const { result } = renderHook(() => useSafeVersions(accounts))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.versions).toEqual(new Map([[`${SEPOLIA}:${SAFE_A}`, '1.5.0']]))
  })

  it('requests nothing and is not loading without accounts', async () => {
    const onRequest = jest.fn()
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, () => {
        onRequest()
        return HttpResponse.json({ version: '1.5.0' })
      }),
    )

    const { result } = renderHook(() => useSafeVersions([]))

    expect(result.current).toEqual({ versions: undefined, isLoading: false })
    expect(onRequest).not.toHaveBeenCalled()
  })
})
