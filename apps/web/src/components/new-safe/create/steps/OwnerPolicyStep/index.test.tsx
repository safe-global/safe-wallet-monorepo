import { faker } from '@faker-js/faker'
import { useController } from 'react-hook-form'
import userEvent from '@testing-library/user-event'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeVersion } from '@safe-global/types-kit'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'

import { fakerChecksummedAddress, render, screen, waitFor } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { NewSafeFormData } from '@/components/new-safe/create'
import type { NamedAddress } from '@/components/new-safe/create/types'
import OwnerPolicyStep from '.'

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '100' }))
jest.mock('@/services/analytics')

jest.mock('@/hooks/useAddressResolver', () => ({
  __esModule: true,
  useAddressResolver: () => ({ name: undefined, ens: undefined, resolving: false }),
}))

// A plain input that runs the row's validator, so the signer rules are checked without driving the autocomplete
jest.mock('@/components/common/AddressBookInput', () => {
  const MockAddressBookInput = ({
    name,
    label,
    validate,
  }: {
    name: string
    label: string
    validate?: (address: string) => Promise<string | undefined>
  }) => {
    const { field, fieldState } = useController({ name, rules: { required: true, validate } })
    return (
      <>
        <input aria-label={label} {...field} />
        {fieldState.error?.message && <span>{fieldState.error.message}</span>}
      </>
    )
  }
  return { __esModule: true, default: MockAddressBookInput }
})

const CHAIN_ID = '100'
const WALLET = fakerChecksummedAddress()

const mockChain = { chainId: CHAIN_ID, chainName: 'Gnosis Chain', l2: false } as Chain

const renderStep = ({
  owners = [],
  threshold = 1,
  addressBook = { [CHAIN_ID]: { [WALLET]: 'Alice' } },
}: {
  owners?: NamedAddress[]
  threshold?: number
  addressBook?: Record<string, Record<string, string>>
} = {}) => {
  const data: NewSafeFormData = {
    name: '',
    networks: [mockChain],
    owners,
    threshold,
    safeVersion: LATEST_SAFE_VERSION as SafeVersion,
  }
  const onBack = jest.fn()

  render(
    <OwnerPolicyStep data={data} onSubmit={jest.fn()} onBack={onBack} setStep={jest.fn()} setDynamicHint={jest.fn()} />,
    { initialReduxState: { addressBook } },
  )

  return { onBack }
}

const signerAddressInputs = () => screen.getAllByLabelText('Signer')
const signerNameInputs = () => screen.getAllByRole('textbox', { name: 'Signer name' })
const nextButton = () => screen.getByTestId('next-btn')

const addSigner = () => userEvent.click(screen.getByRole('button', { name: 'Add new signer' }))
const removeSigner = (index: number) => userEvent.click(screen.getAllByRole('button', { name: 'Remove signer' })[index])

const thresholdOptions = async () => {
  await userEvent.click(screen.getByTestId('threshold-selector'))
  return (await screen.findAllByRole('option')).map((option) => option.textContent)
}

describe('OwnerPolicyStep', () => {
  beforeEach(() => {
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useChains, 'useChain').mockReturnValue(mockChain)
    jest.spyOn(useWallet, 'default').mockReturnValue({ address: WALLET, chainId: CHAIN_ID } as ConnectedWallet)
  })

  afterEach(() => jest.restoreAllMocks())

  it('prefills the connected wallet as the first signer with its address book name', () => {
    renderStep()

    expect(signerAddressInputs()[0]).toHaveValue(WALLET)
    expect(signerNameInputs()[0]).toHaveValue('Alice')
  })

  it('does not prefill a name that is only saved on another chain', () => {
    renderStep({ addressBook: { '1': { [WALLET]: 'Alice' } } })

    expect(signerNameInputs()[0]).toHaveValue('')
  })

  it('adds an empty signer row and offers one threshold per signer', async () => {
    renderStep()

    await addSigner()

    expect(signerAddressInputs()).toHaveLength(2)
    expect(signerAddressInputs()[1]).toHaveValue('')
    expect(signerNameInputs()[1]).toHaveValue('')
    expect(screen.getByText('out of 2 signers')).toBeInTheDocument()
    expect(await thresholdOptions()).toEqual(['1', '2'])
  })

  it('does not let the first signer be removed', async () => {
    renderStep()
    expect(screen.queryByRole('button', { name: 'Remove signer' })).not.toBeInTheDocument()

    await addSigner()
    expect(screen.getAllByRole('button', { name: 'Remove signer' })).toHaveLength(1)

    await removeSigner(0)
    expect(signerAddressInputs()).toHaveLength(1)
  })

  it('lowers the threshold when removing signers leaves fewer signers than the threshold', async () => {
    const owners = Array.from({ length: 4 }, () => ({ name: '', address: faker.finance.ethereumAddress() }))
    renderStep({ owners, threshold: 3 })

    await removeSigner(0)
    expect(screen.getByText('out of 3 signers')).toBeInTheDocument()
    expect(screen.getByTestId('threshold-selector')).toHaveTextContent('3')

    await removeSigner(0)
    expect(screen.getByText('out of 2 signers')).toBeInTheDocument()
    expect(screen.getByTestId('threshold-selector')).toHaveTextContent('2')
    expect(await thresholdOptions()).toEqual(['1', '2'])
  })

  it('disables Next while a signer address is empty', async () => {
    renderStep()

    await userEvent.clear(signerAddressInputs()[0])
    await waitFor(() => expect(nextButton()).toBeDisabled())

    await userEvent.type(signerAddressInputs()[0], faker.finance.ethereumAddress())
    await waitFor(() => expect(nextButton()).toBeEnabled())
  })

  it('hands the current signers and threshold back on Back', async () => {
    const secondSigner = faker.finance.ethereumAddress()
    const { onBack } = renderStep()

    await addSigner()
    await userEvent.type(signerAddressInputs()[1], secondSigner)
    await thresholdOptions()
    await userEvent.click(screen.getByRole('option', { name: '2' }))
    await userEvent.click(screen.getByTestId('back-btn'))

    expect(onBack).toHaveBeenCalledWith(
      expect.objectContaining({
        owners: [expect.objectContaining({ address: WALLET }), expect.objectContaining({ address: secondSigner })],
        threshold: 2,
      }),
    )
  })

  it('restores signers and threshold from the step data', () => {
    const [first, second] = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
    renderStep({
      owners: [
        { name: 'David', address: first },
        { name: '', address: second },
      ],
      threshold: 2,
    })

    expect(signerNameInputs()[0]).toHaveValue('David')
    expect(signerAddressInputs().map((input) => (input as HTMLInputElement).value)).toEqual([first, second])
    expect(screen.getByTestId('threshold-selector')).toHaveTextContent('2')
    expect(screen.getByText('out of 2 signers')).toBeInTheDocument()
  })
})
