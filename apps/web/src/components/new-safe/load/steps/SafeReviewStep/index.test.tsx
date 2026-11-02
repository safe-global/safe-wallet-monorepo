import { fireEvent, render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { getStoreInstance } from '@/store'
import { AppRoutes } from '@/config/routes'
import type { LoadSafeFormData } from '@/components/new-safe/load'
import SafeReviewStep from '.'

const CHAIN_ID = '11155111'

const mockChain = chainBuilder().with({ chainId: CHAIN_ID, shortName: 'sep', chainName: 'Sepolia' }).build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockChain] }),
  useCurrentChain: () => mockChain,
  useChain: () => mockChain,
  useHasFeature: () => false,
}))

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => CHAIN_ID }))

const named = fakerChecksummedAddress()
const withEns = fakerChecksummedAddress()
const unnamed = fakerChecksummedAddress()

const data: LoadSafeFormData = {
  name: 'Treasury',
  address: fakerChecksummedAddress(),
  threshold: 2,
  owners: [
    { address: named, name: 'Alice' },
    { address: withEns, name: '', ens: 'bob.eth' },
    { address: unnamed, name: '' },
  ],
}

const renderStep = () => {
  const push = jest.fn()
  render(<SafeReviewStep data={data} onSubmit={jest.fn()} onBack={jest.fn()} setStep={jest.fn()} />, {
    routerProps: { push },
  })
  return { push }
}

describe('SafeReviewStep', () => {
  it('shows the name, the signers and the threshold before the Safe is added', () => {
    renderStep()

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('bob.eth')).toBeInTheDocument()
    expect(screen.getByText('2 out of 3 signers')).toBeInTheDocument()
  })

  it('adds the Safe with its signers, names it and the named signers, and opens its home page', () => {
    const { push } = renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const state = getStoreInstance().getState()
    expect(state.addedSafes[CHAIN_ID][data.address]).toMatchObject({
      threshold: 2,
      owners: [
        { value: named, name: 'Alice' },
        { value: withEns, name: 'bob.eth' },
        { value: unnamed, name: undefined },
      ],
    })
    expect(state.addressBook[CHAIN_ID]).toEqual({ [data.address]: 'Treasury', [named]: 'Alice', [withEns]: 'bob.eth' })
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.home, query: { safe: `sep:${data.address}` } })
  })
})
