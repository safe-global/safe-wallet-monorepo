import { act } from 'react'
import { fireEvent, render, waitFor } from '@/tests/test-utils'
import { FormProvider, useForm } from 'react-hook-form'
import AddressBookInput from '.'
import type { AddressInputProps } from '../AddressInput'
import { useCurrentChain } from '@/hooks/useChains'
import { faker } from '@faker-js/faker'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/safe-gateway-typescript-sdk'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { AddressBook } from '@/store/addressBookSlice'

// We use Rinkeby and chainId 4 here as this is our default url chain (see jest.setup.js)
const mockChain = chainBuilder()
  .with({ features: [FEATURES.DOMAIN_LOOKUP] })
  .with({ chainId: '4' })
  .with({ shortName: 'rin' })
  .build()

// mock useCurrentChain
jest.mock('@/hooks/useChains', () => ({
  ...jest.requireActual('@/hooks/useChains'),
  useCurrentChain: jest.fn(() => mockChain),
  __esModule: true,
}))

// mock useNameResolver
jest.mock('@/components/common/AddressInput/useNameResolver', () => ({
  __esModule: true,
  default: jest.fn((val: string) => ({
    address: val === 'zero.eth' ? '0x0000000000000000000000000000000000000000' : undefined,
    resolverError: val === 'bogus.eth' ? new Error('Failed to resolve') : undefined,
    resolving: false,
  })),
}))

const testId = 'recipientAutocomplete'
const TestForm = ({
  address,
  validate,
  canAdd,
}: {
  address: string
  validate?: AddressInputProps['validate']
  canAdd?: boolean
}) => {
  const name = 'recipient'

  const methods = useForm<{
    [name]: string
  }>({
    defaultValues: {
      [name]: address,
    },
    mode: 'all',
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => null)}>
        <AddressBookInput
          data-testid={testId}
          name={name}
          label="Recipient address"
          validate={validate}
          canAdd={canAdd}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  )
}

const setup = (
  address: string,
  initialAddressBook: AddressBook,
  validate?: AddressInputProps['validate'],
  canAdd?: boolean,
) => {
  const utils = render(<TestForm address={address} validate={validate} canAdd={canAdd} />, {
    initialReduxState: {
      addressBook: {
        [mockChain.chainId]: initialAddressBook,
      },
      chains: { data: [mockChain], loading: false },
    },
  })
  const input = utils.getByLabelText('Recipient address', { exact: false })

  return {
    input: input as HTMLInputElement,
    utils,
  }
}

describe('AddressBookInput', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useCurrentChain as jest.Mock).mockImplementation(() => mockChain)
  })

  it('should not open autocomplete without entries', () => {
    const { input } = setup('', {})

    expect(input).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      fireEvent.mouseDown(input)
    })

    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('should open autocomplete with entries', () => {
    const { input } = setup('', {
      [checksumAddress(faker.finance.ethereumAddress())]: 'Tim Testermann',
    })

    expect(input).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      fireEvent.mouseDown(input)
    })

    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('should allow to input and validate an address by typing an address', async () => {
    const invalidAddress = checksumAddress(faker.finance.ethereumAddress())
    const validationError = 'You cannot use this address'
    const validation = (value: string) => (value === invalidAddress ? validationError : undefined)

    const { input, utils } = setup(
      '',
      {
        [checksumAddress(faker.finance.ethereumAddress())]: 'Tim Testermann',
      },
      validation,
    )

    expect(input).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      fireEvent.mouseDown(input)
      fireEvent.mouseUp(input)
    })

    act(() => {
      fireEvent.change(input, { target: { value: invalidAddress } })
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => expect(utils.getByLabelText(validationError, { exact: false })).toBeDefined())

    const address = checksumAddress(faker.finance.ethereumAddress())

    act(() => {
      fireEvent.change(input, { target: { value: address } })
      jest.advanceTimersByTime(1000)
    })

    expect(input.value).toBe(address)
    await waitFor(() => expect(utils.queryByLabelText(validationError, { exact: false })).toBeNull())
  })

  it('should allow to input an address from addressbook suggestions', async () => {
    const invalidAddress = checksumAddress(faker.finance.ethereumAddress())
    const validAddress = checksumAddress(faker.finance.ethereumAddress())

    const validationError = 'You cannot use this address'
    const validation = (value: string) => (value === invalidAddress ? validationError : undefined)

    const { input, utils } = setup(
      '',
      {
        [invalidAddress]: 'InvalidAddress',
        [validAddress]: 'ValidAddress',
      },
      validation,
    )

    expect(input).toHaveAttribute('aria-expanded', 'false')

    act(() => {
      fireEvent.mouseDown(input)
      fireEvent.mouseUp(input)
    })

    expect(input).toHaveAttribute('aria-expanded', 'true')

    act(() => {
      fireEvent.click(utils.getByText('InvalidAddress'))
      fireEvent.blur(input)
      jest.advanceTimersByTime(1000)
    })

    // Should close auto completion and hide validation error
    await waitFor(() => {
      expect(utils.getByLabelText(validationError, { exact: false })).toBeDefined()
    })

    // Clear the input by clicking on the readonly input
    act(() => {
      // first click clears input
      fireEvent.click(utils.getByLabelText(validationError, { exact: false }))
    })

    await waitFor(() => expect(utils.getByLabelText(validationError, { exact: false })).toHaveValue(''))
    const newInput = utils.getByLabelText(validationError, { exact: false })
    expect(newInput).toBeVisible()

    act(() => {
      // mousedown opens autocompletion again
      fireEvent.mouseDown(newInput)
      fireEvent.mouseUp(newInput)
    })

    act(() => {
      fireEvent.click(utils.getByText('ValidAddress'))
      fireEvent.blur(newInput)

      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => expect(utils.queryByLabelText(validationError, { exact: false })).toBeNull())

    // should display name of address as well as address
    await waitFor(() => expect(utils.getByText('ValidAddress', { exact: false })).toBeDefined())
    await waitFor(() => expect(utils.getByText(validAddress, { exact: false })).toBeDefined())
  })

  it('should offer to add unknown addresses if canAdd is true', async () => {
    const { input, utils } = setup('', {}, undefined, true)

    const newAddress = checksumAddress(faker.finance.ethereumAddress())
    act(() => {
      fireEvent.change(input, { target: { value: newAddress } })
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => expect(utils.getByText('add it to your address book', { exact: false })).toBeDefined())

    await act(async () => {
      fireEvent.click(utils.getByText('add it to your address book', { exact: false }))
      // Wait for dialog to pop up to have it wrapped in the act
      await Promise.resolve()
    })

    const nameInput = utils.getByLabelText('Name', { exact: false })
    act(() => {
      fireEvent.change(nameInput, { target: { value: 'Tim Testermann' } })
      fireEvent.submit(nameInput)
    })

    await waitFor(() => expect(utils.getByText('Tim Testermann', { exact: false })).toBeDefined())
  })

  it('should not offer to add unknown addresses if canAdd is false', async () => {
    const { input, utils } = setup('', {}, undefined, false)

    const newAddress = checksumAddress(faker.finance.ethereumAddress())
    act(() => {
      fireEvent.change(input, { target: { value: newAddress } })
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => expect(utils.queryByText('add it to your address book', { exact: false })).toBeNull())
  })
})
