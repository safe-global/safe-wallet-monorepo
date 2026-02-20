import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://sourcify.dev/server/v2/contract/:chainId/:address', ({ params }) => {
    return HttpResponse.json({
      abi: [],
      matchId: '1',
      creationMatch: 'exact_match',
      runtimeMatch: 'exact_match',
      match: 'exact_match',
      verifiedAt: '2024-01-01T00:00:00Z',
      chainId: params.chainId,
      address: params.address,
    })
  }),

  http.get('*/v1/chains/:chainId/contracts/:address', ({ params }) => {
    return HttpResponse.json({
      address: params.address,
      name: 'Mock Contract',
      displayName: 'Mock Contract',
      logoUri: '',
      contractAbi: {
        abi: [],
        description: 'Mock ABI',
      },
      trustedForDelegateCall: false,
    })
  }),

  http.post('*/api/v1/account/*/project/*/simulate', () => {
    return HttpResponse.json({
      simulation: {
        id: 'mock-simulation-id',
        status: true,
        gas_used: 21000,
        method: 'transfer',
        block_number: 12345678,
      },
      transaction: {
        hash: '0x' + '0'.repeat(64),
        transaction_info: {
          call_trace: [],
          logs: [],
          state_diff: [],
        },
      },
    })
  }),

  http.get('https://api.etherscan.io/api', ({ request }) => {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'getabi') {
      return HttpResponse.json({
        status: '1',
        message: 'OK',
        result: '[]',
      })
    }

    return HttpResponse.json({ status: '0', message: 'Not found', result: '' })
  }),
]
