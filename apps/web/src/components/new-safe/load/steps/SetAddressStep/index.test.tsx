import { http, HttpResponse } from 'msw'
import { fireEvent, render, screen, waitFor, fakerChecksummedAddress } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { FEATURES } from '@safe-global/store/gateway/types'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import SetAddressStep from '.'

const CHAIN_ID = '11155111'
const GENERATED_NAME = 'Brave Sepolia Safe'
const ENS_NAME = 'treasury.eth'
const ensAddress = fakerChecksummedAddress()

const mockChain = chainBuilder()
  .with({ chainId: CHAIN_ID, shortName: 'sep', features: [FEATURES.DOMAIN_LOOKUP] })
  .build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockChain] }),
  useCurrentChain: () => mockChain,
  useChain: () => mockChain,
  useHasFeature: () => false,
}))

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => CHAIN_ID }))

jest.mock('@/components/common/NetworkSelector', () => ({ __esModule: true, default: () => null }))

jest.mock('@/hooks/useMnemonicName', () => ({ useMnemonicSafeName: () => GENERATED_NAME }))

jest.mock('@/components/common/AddressInput/useNameResolver', () => ({
  __esModule: true,
  getEnsNotAvailableError: () => 'ENS name not available',
  default: (value: string) => ({
    address: value === ENS_NAME ? ensAddress : undefined,
    name: value === ENS_NAME ? ENS_NAME : undefined,
    resolverError: undefined,
    resolving: false,
  }),
}))

const EMPTY_DATA: LoadSafeFormData = { name: '', address: '', threshold: 1, owners: [] }

const serveSafe = (isSafe: boolean) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`, ({ params }) =>
      isSafe
        ? HttpResponse.json(
            safeInfoBuilder()
              .with({ address: { value: String(params.safeAddress) } })
              .build(),
          )
        : HttpResponse.json({ code: 404, message: 'Not found' }, { status: 404 }),
    ),
  )

const renderStep = (initialReduxState?: Parameters<typeof render>[1]) => {
  const utils = render(
    <SetAddressStep data={EMPTY_DATA} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />,
    initialReduxState,
  )
  const addressInput = screen.getByLabelText('Safe account', { exact: false }) as HTMLInputElement
  return { ...utils, addressInput }
}

const nextButton = () => screen.getByTestId('load-safe-next-btn')

describe('SetAddressStep', () => {
  it('enables Next once the address is a Safe on the selected chain', async () => {
    serveSafe(true)
    const { addressInput } = renderStep()

    fireEvent.change(addressInput, { target: { value: fakerChecksummedAddress() } })

    await waitFor(() => expect(nextButton()).toBeEnabled())
  })

  it('rejects an address that CGW does not know as a Safe', async () => {
    serveSafe(false)
    const { addressInput } = renderStep()

    fireEvent.change(addressInput, { target: { value: fakerChecksummedAddress() } })

    expect(
      await screen.findByLabelText('Address given is not a valid Safe account address', { exact: false }),
    ).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
  })

  it('loads the Safe that an ENS name resolves to', async () => {
    serveSafe(true)
    const { addressInput } = renderStep()

    fireEvent.change(addressInput, { target: { value: ENS_NAME } })

    await waitFor(() => expect(addressInput).toHaveValue(ensAddress))
    await waitFor(() => expect(nextButton()).toBeEnabled())
  })

  it('rejects a Safe that is already in the account list of this chain', async () => {
    serveSafe(true)
    const address = fakerChecksummedAddress()
    const { addressInput } = renderStep({
      initialReduxState: { addedSafes: { [CHAIN_ID]: { [address]: { owners: [], threshold: 1 } } } },
    })

    fireEvent.change(addressInput, { target: { value: address } })

    expect(await screen.findByLabelText('Safe account is already added', { exact: false })).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
  })

  it('suggests a generated name while the Safe has none', () => {
    renderStep()

    expect(screen.getByLabelText('Name', { exact: false })).toHaveAttribute('placeholder', GENERATED_NAME)
  })
})
