import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { mockErc20TransferDto, mockNativeTransferDto, mockUsdcMetadata } from '../../mocks/activePolicies'
import { MOCK_SAFES, MOCK_TOKENS } from '../../mocks/policies'
import { useAllowlistTokenResolver } from '../useAllowlistTokenResolver'

const TOKENS_URL = `${GATEWAY_URL}/v1/chains/:chainId/tokens`
const { chainId } = MOCK_SAFES.treasury
const usdc = MOCK_TOKENS.usdc.address

const erc20Dto = (tokenAddress: string, safe: ActivePolicyDto['safe'] = MOCK_SAFES.treasury) =>
  mockErc20TransferDto({ safe, data: { tokenAddress, recipients: [] } })

const listenForRequests = (respond: () => HttpResponse) => {
  const requests: string[] = []
  server.use(
    http.get(TOKENS_URL, ({ params, request }) => {
      requests.push(`${params.chainId}?${new URL(request.url).searchParams.get('addresses')}`)
      return respond()
    }),
  )
  return requests
}

describe('useAllowlistTokenResolver', () => {
  it('names the tokens from the tokens endpoint, asking once per chain with distinct addresses', async () => {
    const requests = listenForRequests(() => HttpResponse.json([mockUsdcMetadata()]))
    const dtos = [erc20Dto(usdc), erc20Dto(usdc.toLowerCase()), erc20Dto(usdc, MOCK_SAFES.payroll)]

    const { result } = renderHook(() => useAllowlistTokenResolver(dtos))

    expect(result.current(chainId, usdc)).toBeUndefined()
    await waitFor(() => expect(result.current(chainId, usdc)).toEqual(MOCK_TOKENS.usdc))
    expect(result.current(MOCK_SAFES.payroll.chainId, usdc.toLowerCase())).toEqual(MOCK_TOKENS.usdc)
    expect(requests.sort()).toEqual(
      [`${chainId}?${usdc.toLowerCase()}`, `${MOCK_SAFES.payroll.chainId}?${usdc.toLowerCase()}`].sort(),
    )
  })

  it('splits more than 20 tokens on one chain into several requests', async () => {
    const requests = listenForRequests(() => HttpResponse.json([]))
    const dtos = Array.from({ length: 21 }, () => erc20Dto(faker.finance.ethereumAddress()))

    renderHook(() => useAllowlistTokenResolver(dtos))

    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests.map((request) => request.split('?')[1].split(',').length).sort()).toEqual([1, 20])
  })

  it('keeps a token unresolved when its request fails', async () => {
    const requests = listenForRequests(() => HttpResponse.json({ message: 'down' }, { status: 503 }))
    const dtos = [erc20Dto(usdc)]

    const { result } = renderHook(() => useAllowlistTokenResolver(dtos))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(result.current(chainId, usdc)).toBeUndefined()
  })

  it('requests nothing when no policy names an ERC-20 token', () => {
    const requests = listenForRequests(() => HttpResponse.json([]))
    const dtos = [mockNativeTransferDto()]

    const { result } = renderHook(() => useAllowlistTokenResolver(dtos))

    expect(requests).toEqual([])
    expect(result.current(chainId, usdc)).toBeUndefined()
  })
})
