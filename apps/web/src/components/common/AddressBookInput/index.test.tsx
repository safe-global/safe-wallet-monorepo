import { act } from 'react'
import { fireEvent, render, waitFor } from '@/tests/test-utils'
import { FormProvider, useForm } from 'react-hook-form'
import AddressBookInput from '.'
import { AddressBookSourceProvider } from '../AddressBookSourceProvider'
import type { AddressInputProps } from '../AddressInput'
import * as useChains from '@/hooks/useChains'
import { faker } from '@faker-js/faker'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { AddressBook } from '@/store/addressBookSlice'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useGetSpaceAddressBook } from '@/features/spaces'

jest.mock('@/features/spaces/hooks/useGetSpaceAddressBook', () => ({
  __esModule: true,
  default: jest.fn((): SpaceAddressBookItemDto[] => []),
}))

const mockUseGetSpaceAddressBook = useGetSpaceAddressBook as jest.MockedFunction<typeof useGetSpaceAddressBook>

const spaceContactBuilder = (overrides: Partial<SpaceAddressBookItemDto> = {}): SpaceAddressBookItemDto => ({
  name: 'Server Contact',
  address: checksumAddress(faker.finance.ethereumAddress()),
  chainIds: ['4'],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

// We use Rinkeby and chainId 4 here as this is our default url chain (see jest.setup.js)
const mockChain = chainBuilder()
  .with({ features: [FEATURES.DOMAIN_LOOKUP] })
  .with({ chainId: '4' })
  .with({ shortName: 'rin' })
  .build()

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
    // The address book is persisted to localStorage by the store middleware. Clear it
    // so entries added in one test (e.g. via EntryDialog) don't hydrate into the next.
    window.localStorage.clear()
    mockUseGetSpaceAddressBook.mockReturnValue([])
    jest.spyOn(useChains, 'default').mockImplementation(() => ({
      configs: [mockChain],
      error: undefined,
      loading: false,
    }))
    jest.spyOn(useChains, 'useChain').mockImplementation(() => mockChain)
    jest.spyOn(useChains, 'useCurrentChain').mockImplementation(() => mockChain)
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
    // The address is split across elements by the bold 4-byte highlighting
    await waitFor(() => expect(utils.getByTestId('address-book-recipient')).toHaveTextContent(validAddress))
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

  it('should group a server-stored (space) contact under the workspace header in a spaceOnly context', async () => {
    const spaceContact = spaceContactBuilder({ name: 'Server Contact' })
    mockUseGetSpaceAddressBook.mockReturnValue([spaceContact])

    const name = 'recipient'
    const SpaceForm = () => {
      const methods = useForm<{ [name]: string }>({ defaultValues: { [name]: '' }, mode: 'all' })
      return (
        <FormProvider {...methods}>
          <AddressBookSourceProvider source="spaceOnly">
            <AddressBookInput data-testid={testId} name={name} label="Recipient address" />
          </AddressBookSourceProvider>
        </FormProvider>
      )
    }

    const utils = render(<SpaceForm />, {
      initialReduxState: { addressBook: { [mockChain.chainId]: {} } },
    })
    const input = utils.getByLabelText('Recipient address', { exact: false }) as HTMLInputElement

    act(() => {
      fireEvent.mouseDown(input)
      fireEvent.mouseUp(input)
    })

    await waitFor(() => expect(utils.getByText('Server Contact')).toBeDefined())
    const groupHeader = utils.getByTestId('contact-group-header')
    expect(groupHeader).toHaveTextContent('Contacts of your Workspace')
    expect(utils.queryByText('Local contacts')).not.toBeInTheDocument()
  })

  it('should show the "Added by" provenance for a space contact', async () => {
    const creator = checksumAddress(faker.finance.ethereumAddress())
    const spaceContact = spaceContactBuilder({
      name: 'Server Contact',
      createdBy: creator,
      createdAt: new Date().toISOString(),
    })
    mockUseGetSpaceAddressBook.mockReturnValue([spaceContact])

    const name = 'recipient'
    const SpaceForm = () => {
      const methods = useForm<{ [name]: string }>({ defaultValues: { [name]: '' }, mode: 'all' })
      return (
        <FormProvider {...methods}>
          <AddressBookSourceProvider source="spaceOnly">
            <AddressBookInput data-testid={testId} name={name} label="Recipient address" />
          </AddressBookSourceProvider>
        </FormProvider>
      )
    }

    const utils = render(<SpaceForm />, {
      initialReduxState: { addressBook: { [mockChain.chainId]: {} } },
    })
    const input = utils.getByLabelText('Recipient address', { exact: false }) as HTMLInputElement

    act(() => {
      fireEvent.mouseDown(input)
      fireEvent.mouseUp(input)
    })

    await waitFor(() => expect(utils.getByText('Server Contact')).toBeDefined())
    expect(utils.getByText('Added by')).toBeInTheDocument()
    expect(utils.getByText(creator)).toBeInTheDocument()
    expect(utils.queryByText('Saved on this device')).not.toBeInTheDocument()
  })

  it('should group a local contact under the local header with its provenance', async () => {
    const { input, utils } = setup('', {
      [checksumAddress(faker.finance.ethereumAddress())]: 'Browser Contact',
    })

    act(() => {
      fireEvent.mouseDown(input)
      fireEvent.mouseUp(input)
    })

    await waitFor(() => expect(utils.getByText('Browser Contact')).toBeDefined())
    const groupHeader = utils.getByTestId('contact-group-header')
    expect(groupHeader).toHaveTextContent('Local contacts')
    expect(utils.getByText('Saved on this device')).toBeInTheDocument()
    expect(utils.queryByText('Contacts of', { exact: false })).not.toBeInTheDocument()
  })
})
