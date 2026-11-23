import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { useGetTokenApprovalsQuery, type TokenApprovals } from '../tokenApprovals'

const CHAIN_ID = '11155111'
const SAFE = checksumAddress(faker.finance.ethereumAddress())
const APPROVALS_URL = `${GATEWAY_URL}/v1/chains/${CHAIN_ID}/safes/${SAFE}/token-approvals`

describe('getTokenApprovals', () => {
  it('should, when the gateway lists the approvals of the Safe, return them with whether the list is complete', async () => {
    const approvals: TokenApprovals = {
      approvals: [
        {
          tokenAddress: checksumAddress(faker.finance.ethereumAddress()),
          tokenMetadata: null,
          spender: checksumAddress(faker.finance.ethereumAddress()),
          allowance: '1000000',
        },
      ],
      isComplete: false,
    }
    server.use(http.get(APPROVALS_URL, () => HttpResponse.json(approvals)))

    const { result } = renderHook(() => useGetTokenApprovalsQuery({ chainId: CHAIN_ID, safeAddress: SAFE }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(approvals)
  })

  it('should, when the gateway cannot answer, report an error rather than an empty list', async () => {
    server.use(http.get(APPROVALS_URL, () => HttpResponse.json({ message: 'Unavailable' }, { status: 503 })))

    const { result } = renderHook(() => useGetTokenApprovalsQuery({ chainId: CHAIN_ID, safeAddress: SAFE }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('should, when an allowance is not a number of base units, report an error', async () => {
    server.use(
      http.get(APPROVALS_URL, () =>
        HttpResponse.json({
          approvals: [
            {
              tokenAddress: checksumAddress(faker.finance.ethereumAddress()),
              tokenMetadata: null,
              spender: checksumAddress(faker.finance.ethereumAddress()),
              allowance: '1.5',
            },
          ],
          isComplete: true,
        }),
      ),
    )

    const { result } = renderHook(() => useGetTokenApprovalsQuery({ chainId: CHAIN_ID, safeAddress: SAFE }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
