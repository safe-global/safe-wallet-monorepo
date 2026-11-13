import { http, HttpResponse } from 'msw'
import { fakerChecksummedAddress, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { chainBuilder } from '@/tests/builders/chains'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import * as useChains from '@/hooks/useChains'
import { InconsistentSignerSetupWarning } from './InconsistentSignerSetupWarning'

jest.mock('@/hooks/safes', () => ({
  useAllSafesGrouped: jest.fn(),
}))
jest.mock('@/hooks/useSafeAddress')

import { useAllSafesGrouped } from '@/hooks/safes'
import useSafeAddress from '@/hooks/useSafeAddress'

const POLYGON = '137'
const SEPOLIA = '11155111'
const TITLE = 'You have different signers across different networks.'

const safeAddress = fakerChecksummedAddress()

const overview = (chainId: string, owner: string) => ({
  address: { value: safeAddress },
  chainId,
  awaitingConfirmation: null,
  fiatTotal: '0',
  owners: [{ value: owner }],
  threshold: 1,
  queued: 0,
})

const serveOverviews = (polygonOwner: string, sepoliaOwner: string) => {
  let requestCount = 0
  server.use(
    http.get(`${GATEWAY_URL}/v2/safes`, () => {
      requestCount += 1
      return HttpResponse.json([overview(POLYGON, polygonOwner), overview(SEPOLIA, sepoliaOwner)])
    }),
  )
  return () => requestCount
}

const renderWarning = () => {
  const push = jest.fn()
  render(<InconsistentSignerSetupWarning />, {
    routerProps: { query: { safe: `matic:${safeAddress}` }, push },
  })
  return push
}

describe('InconsistentSignerSetupWarning', () => {
  beforeEach(() => {
    ;(useAllSafesGrouped as jest.Mock).mockReturnValue({
      allMultiChainSafes: [
        {
          address: safeAddress,
          safes: [POLYGON, SEPOLIA].map((chainId) => safeItemBuilder().with({ address: safeAddress, chainId }).build()),
          isPinned: false,
          lastVisited: 0,
          name: undefined,
        },
      ],
    })
    ;(useSafeAddress as jest.Mock).mockReturnValue(safeAddress)
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainId: POLYGON }).build())
  })

  it('warns about different signers and opens the signer setup when the networks disagree', async () => {
    serveOverviews(fakerChecksummedAddress(), fakerChecksummedAddress())
    const push = renderWarning()

    expect(await screen.findByText(TITLE)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review signers' }))

    expect(push).toHaveBeenCalledWith({
      pathname: AppRoutes.settings.setup,
      query: expect.objectContaining({ safe: `matic:${safeAddress}` }),
    })
  })

  it('shows nothing when every network has the same signers', async () => {
    const owner = fakerChecksummedAddress()
    const requestCount = serveOverviews(owner, owner)
    renderWarning()

    await waitFor(() => expect(requestCount()).toBeGreaterThan(0))

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument()
  })
})
