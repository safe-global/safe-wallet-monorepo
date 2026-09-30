import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSpacePoliciesGetActivePoliciesV1Query } from '../spacePolicies'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const proposerPolicy = (): ActivePolicyDto => ({
  type: 'proposer',
  enforcement: { via: 'offchain', source: 'delegates' },
  enabled: true,
  safe: { chainId: '1', address: '0x8675B754342754A30A2AeF474D114d8460bca19b' },
  data: { proposers: [] },
})

describe('spacePoliciesGetActivePoliciesV1', () => {
  it('should, when asked for a space, request its active policies of the given types', async () => {
    let requestedTypes: string | null = null
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/policies/active`, ({ request }) => {
        requestedTypes = new URL(request.url).searchParams.get('types')
        return HttpResponse.json([proposerPolicy()])
      }),
    )

    const { result } = renderHook(() =>
      useSpacePoliciesGetActivePoliciesV1Query({ spaceId: SPACE_ID, types: ['spending-limit', 'proposer'] }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(requestedTypes).toBe('spending-limit,proposer')
    expect(result.current.data).toEqual([proposerPolicy()])
  })

  it('should, when the gateway cannot answer, report an error rather than an empty list', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/policies/active`, () =>
        HttpResponse.json({ message: 'The policy api is unavailable' }, { status: 503 }),
      ),
    )

    const { result } = renderHook(() =>
      useSpacePoliciesGetActivePoliciesV1Query({ spaceId: SPACE_ID, types: ['proposer'] }),
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})
