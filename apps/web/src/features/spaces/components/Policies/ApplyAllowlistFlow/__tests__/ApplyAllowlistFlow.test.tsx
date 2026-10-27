import { http, HttpResponse } from 'msw'
import type { PreviewTransactionDto } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { GATEWAY_URL } from '@/config/gateway'
import useWallet from '@/hooks/wallets/useWallet'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, render, waitFor } from '@/tests/test-utils'
import {
  buildAllowlistWorkspace,
  decodeApplyConfiguration,
  erc20TransferConfiguration,
  serveAllowlistRpc,
  serveAllowlistWorkspace,
  signedInState,
  type AllowlistWorkspace,
} from '../../mocks/allowlistWorkspace'
import ApplyAllowlistFlow from '..'

// The connected wallet comes from web3-onboard, which has no network equivalent.
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: () => null,
  useWalletContext: () => null,
}))

type PreviewRequest = { chainId: string; safeAddress: string; body: PreviewTransactionDto }

const recordPreviews = () => {
  const previews: PreviewRequest[] = []
  server.use(
    http.post<{ chainId: string; safeAddress: string }, PreviewTransactionDto>(
      `${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeAddress/preview`,
      async ({ params, request }) => {
        previews.push({ chainId: params.chainId, safeAddress: params.safeAddress, body: await request.json() })
        return HttpResponse.json({ message: 'Not under test' }, { status: 500 })
      },
    ),
  )
  return previews
}

describe('ApplyAllowlistFlow', () => {
  let workspace: AllowlistWorkspace

  beforeEach(() => {
    workspace = buildAllowlistWorkspace()
    jest.mocked(useWallet).mockReturnValue(workspace.wallet)
    serveAllowlistWorkspace(workspace)
    serveAllowlistRpc(workspace)
  })

  it('previews one applyConfiguration call to the guard carrying exactly the stored configurations', async () => {
    const previews = recordPreviews()
    const configurations = [
      erc20TransferConfiguration(fakerChecksummedAddress(), [fakerChecksummedAddress(), fakerChecksummedAddress()]),
      erc20TransferConfiguration(fakerChecksummedAddress(), [fakerChecksummedAddress()]),
    ]

    render(
      <ApplyAllowlistFlow
        chainId={workspace.safe.chainId}
        safeAddress={workspace.safe.address.value}
        guardAddress={workspace.guardAddress}
        configurations={configurations}
      />,
      { initialReduxState: signedInState() },
    )

    await waitFor(() => expect(previews).toHaveLength(1), { timeout: 5_000 })
    const [{ chainId, safeAddress, body }] = previews
    expect({ chainId, safeAddress }).toEqual({
      chainId: workspace.safe.chainId,
      safeAddress: workspace.safe.address.value,
    })
    expect(body).toMatchObject({ to: workspace.guardAddress, value: '0', operation: 0 })
    expect(decodeApplyConfiguration(body.data ?? '')).toEqual(configurations)
  })
})
