import { http, HttpResponse } from 'msw'
import type { JsonRpcProvider } from 'ethers'
import { fireEvent, render, screen, waitFor, fakerChecksummedAddress } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { safeInfoBuilder } from '@/tests/builders/safe'
import * as ens from '@/services/ens'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import SafeOwnerStep from '.'

const CHAIN_ID = '11155111'
const OTHER_CHAIN_ID = '1'
const ENS_NAME = 'signer.eth'

const mockChain = chainBuilder().with({ chainId: CHAIN_ID, shortName: 'sep' }).build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockChain] }),
  useCurrentChain: () => mockChain,
  useChain: () => mockChain,
  useHasFeature: () => false,
}))

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => CHAIN_ID }))

jest.mock('@/hooks/useEnsHubProvider', () => ({
  useEnsHubProvider: () => ({ hubChain: mockChain, provider: {} as JsonRpcProvider, isDomainLookupEnabled: true }),
}))

const serveSafe = (owners: string[], threshold: number) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, ({ params }) =>
      HttpResponse.json(
        safeInfoBuilder()
          .with({
            address: { value: String(params.safeAddress) },
            owners: owners.map((value) => ({ value })),
            threshold,
          })
          .build(),
      ),
    ),
  )

const renderStep = (initialReduxState?: Parameters<typeof render>[1]) => {
  const onSubmit = jest.fn()
  const data: LoadSafeFormData = { name: 'Treasury', address: fakerChecksummedAddress(), threshold: 1, owners: [] }
  render(<SafeOwnerStep data={data} onSubmit={onSubmit} onBack={jest.fn()} setStep={jest.fn()} />, initialReduxState)
  return { onSubmit }
}

const signerNameInputs = () => screen.findAllByLabelText('Signer name', { exact: false }) as Promise<HTMLInputElement[]>

describe('SafeOwnerStep', () => {
  beforeEach(() => {
    jest.spyOn(ens, 'lookupAddress').mockResolvedValue(undefined)
  })

  it('submits the signers and the threshold of the Safe from CGW', async () => {
    const owners = [fakerChecksummedAddress(), fakerChecksummedAddress()]
    serveSafe(owners, 2)
    const { onSubmit } = renderStep()

    expect(await signerNameInputs()).toHaveLength(2)
    fireEvent.change((await signerNameInputs())[0], { target: { value: 'Alice' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      threshold: 2,
      owners: [
        { address: owners[0], name: 'Alice' },
        { address: owners[1], name: '' },
      ],
    })
  })

  it('names a signer from the address book of the selected chain only', async () => {
    const named = fakerChecksummedAddress()
    const namedOnOtherChain = fakerChecksummedAddress()
    serveSafe([named, namedOnOtherChain], 1)

    renderStep({
      initialReduxState: {
        addressBook: {
          [CHAIN_ID]: { [named]: 'Sepolia signer' },
          [OTHER_CHAIN_ID]: { [namedOnOtherChain]: 'Mainnet signer' },
        },
      },
    })

    await waitFor(async () => expect((await signerNameInputs())[0]).toHaveValue('Sepolia signer'))
    expect((await signerNameInputs())[1]).toHaveValue('')
  })

  it('suggests the ENS name of a signer and passes it on', async () => {
    const owner = fakerChecksummedAddress()
    jest.spyOn(ens, 'lookupAddress').mockResolvedValue(ENS_NAME)
    serveSafe([owner], 1)
    const { onSubmit } = renderStep()

    await waitFor(async () => expect((await signerNameInputs())[0]).toHaveAttribute('placeholder', ENS_NAME))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0].owners).toEqual([{ address: owner, name: '', ens: ENS_NAME }])
  })
})
