import { faker } from '@faker-js/faker'
import { useController } from 'react-hook-form'
import userEvent from '@testing-library/user-event'

import { render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import { getContractErrorMessage } from '@safe-global/utils/services/exceptions/contractErrors'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SignersStructure } from '../SignersStructure'
import type { ManageSignersForm } from '..'

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  __esModule: true,
  useSafeShieldForAddressPoisoning: () => undefined,
}))

const mockResolvedNames: Record<string, string> = {}

jest.mock('@/hooks/useAddressResolver', () => ({
  __esModule: true,
  useAddressResolver: (address?: string) => ({
    name: address ? mockResolvedNames[address] : undefined,
    ens: undefined,
    resolving: false,
  }),
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

const OWNER = faker.finance.ethereumAddress()
const SAFE_ADDRESS = faker.finance.ethereumAddress()

const renderSignersStructure = () => {
  jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
    safe: {
      ...extendedSafeInfoBuilder().build(),
      owners: [{ value: OWNER }],
      threshold: 1,
      chainId: '1',
    },
    safeAddress: SAFE_ADDRESS,
    safeError: undefined,
    safeLoading: false,
    safeLoaded: true,
  })
  const context: TxFlowContextType<ManageSignersForm> = {
    ...initialContext,
    data: { threshold: 1, owners: [{ address: OWNER, name: '' }] },
    onNext: jest.fn(),
  }
  render(
    <TxFlowContext.Provider value={context as TxFlowContextType}>
      <SignersStructure />
    </TxFlowContext.Provider>,
  )
}

const addSigner = async (address: string) => {
  await userEvent.click(screen.getByRole('button', { name: 'Add new signer' }))
  await userEvent.type(screen.getAllByLabelText('Signer').at(-1)!, address)
}

describe('SignersStructure', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    Object.keys(mockResolvedNames).forEach((address) => delete mockResolvedNames[address])
  })

  it('keeps the threshold and counts the new signer when a signer is added', async () => {
    renderSignersStructure()

    await userEvent.click(screen.getByRole('button', { name: 'Add new signer' }))

    expect(screen.getByTestId('threshold-selector')).toHaveTextContent('1')
    expect(screen.getByText('out of 2 signers')).toBeInTheDocument()
  })

  it('enables Next once the new signer has a valid address', async () => {
    renderSignersStructure()

    await addSigner(faker.finance.ethereumAddress())

    expect(await screen.findByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it.each([
    ['an existing signer', () => OWNER, getContractErrorMessage('GS204')],
    ['the Safe itself', () => SAFE_ADDRESS, 'Cannot use Safe account itself as signer.'],
    ['a reserved address', () => SENTINEL_ADDRESS, getContractErrorMessage('GS203')],
  ])('rejects %s as the new signer', async (_, address, message) => {
    renderSignersStructure()

    await addSigner(address())

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('fills in the name that the new signer has in the address book', async () => {
    const address = faker.finance.ethereumAddress()
    mockResolvedNames[address] = 'Alice'
    renderSignersStructure()

    await addSigner(address)

    expect(await screen.findByDisplayValue('Alice')).toBeInTheDocument()
  })
})
