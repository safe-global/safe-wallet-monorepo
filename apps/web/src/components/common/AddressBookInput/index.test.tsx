import { act } from 'react'
import { fireEvent, render, waitFor, within } from '@/tests/test-utils'
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

  it('should group a server-stored (space) contact under the workspace header with the workspace icon', async () => {
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

    // Scope to the space contact's own group. Persisted local contacts from other
    // tests can leak into the listbox via localStorage, so assert on this group.
    const option = await waitFor(() => utils.getByText('Server Contact', { exact: false }))
    const groupEl = option.closest('.groupList')!.closest('li') as HTMLElement
    const group = within(groupEl)

    // Workspace source: "Contacts of …" header with the building (workspace) icon,
    // not the local hard-drive icon.
    expect(group.getByText('Contacts of', { exact: false })).toBeInTheDocument()
    expect(groupEl.querySelector('.lucide-building-2')).toBeInTheDocument()
    expect(groupEl.querySelector('.lucide-hard-drive')).not.toBeInTheDocument()
  })

  it('should group a local contact under the local contacts header with the local icon', async () => {
    const { input, utils } = setup('', {
      [checksumAddress(faker.finance.ethereumAddress())]: 'Local Contact',
    })

    act(() => {
      fireEvent.mouseDown(input)
      fireEvent.mouseUp(input)
    })

    // Scope to the contact's own group (see note above).
    const option = await waitFor(() => utils.getByText('Local Contact', { exact: true }))
    const groupEl = option.closest('.groupList')!.closest('li') as HTMLElement
    const group = within(groupEl)

    // Local source: "Local contacts" header with the hard-drive icon, not the
    // building (workspace) icon.
    expect(group.getByText('Local contacts')).toBeInTheDocument()
    expect(groupEl.querySelector('.lucide-hard-drive')).toBeInTheDocument()
    expect(groupEl.querySelector('.lucide-building-2')).not.toBeInTheDocument()
  })

  /**
   * MUI's Autocomplete dismissed the suggestion list on Escape, on an outside click and when focus
   * left the field. The hand-rolled replacement dropped all three, leaving the list open over the
   * rest of the form — where a click meant for the next field instead selects a contact as the
   * recipient.
   */
  describe('dismissing the suggestion list', () => {
    const openList = async (utils: ReturnType<typeof setup>['utils'], input: HTMLInputElement) => {
      act(() => {
        fireEvent.mouseDown(input)
        fireEvent.mouseUp(input)
      })
      await waitFor(() => expect(utils.getByRole('listbox')).toBeInTheDocument())
    }

    it('closes on Escape', async () => {
      const { input, utils } = setup('', {
        [checksumAddress(faker.finance.ethereumAddress())]: 'Alice',
      })
      await openList(utils, input)

      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })

      await waitFor(() => expect(utils.queryByRole('listbox')).not.toBeInTheDocument())
      expect(input).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes when pointing down outside the field', async () => {
      const { input, utils } = setup('', {
        [checksumAddress(faker.finance.ethereumAddress())]: 'Alice',
      })
      await openList(utils, input)

      act(() => {
        fireEvent.pointerDown(utils.getByText('Submit'))
      })

      await waitFor(() => expect(utils.queryByRole('listbox')).not.toBeInTheDocument())
    })

    it('closes when focus leaves the field, without selecting a contact', async () => {
      const address = checksumAddress(faker.finance.ethereumAddress())
      const { input, utils } = setup('', { [address]: 'Alice' })
      await openList(utils, input)

      const submit = utils.getByText('Submit')
      act(() => {
        fireEvent.focusOut(input, { relatedTarget: submit })
      })

      await waitFor(() => expect(utils.queryByRole('listbox')).not.toBeInTheDocument())
      // The recipient must not have been silently populated by the dismissal.
      expect(input).toHaveValue('')
    })
  })

  /**
   * MUI's Autocomplete traversed the suggestions with the arrow keys and selected with Enter. Without
   * that, a keyboard-only user can only reach a contact with a mouse — and otherwise has to hand-type
   * the recipient address, which is exactly what the address book exists to avoid.
   */
  describe('keyboard navigation', () => {
    const twoContacts = () => {
      const alice = checksumAddress(faker.finance.ethereumAddress())
      const bob = checksumAddress(faker.finance.ethereumAddress())
      return { alice, bob, addressBook: { [alice]: 'Alice', [bob]: 'Bob' } }
    }

    const openListWithMouse = async (utils: ReturnType<typeof setup>['utils'], input: HTMLInputElement) => {
      act(() => {
        fireEvent.mouseDown(input)
        fireEvent.mouseUp(input)
      })
      await waitFor(() => expect(utils.getByRole('listbox')).toBeInTheDocument())
    }

    // Contacts persisted by other tests leak in via localStorage, so assert on the rendered option
    // order rather than on which contact happens to land where.
    const activeOption = (input: HTMLInputElement) => {
      const activeId = input.getAttribute('aria-activedescendant')
      return activeId ? document.getElementById(activeId) : null
    }

    it('opens the list and activates the first option on ArrowDown', async () => {
      const { addressBook } = twoContacts()
      const { input, utils } = setup('', addressBook)

      expect(input).toHaveAttribute('aria-expanded', 'false')

      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      })

      await waitFor(() => expect(utils.getByRole('listbox')).toBeInTheDocument())
      const firstOption = utils.getAllByRole('option')[0]
      expect(activeOption(input)).toBe(firstOption)
      expect(utils.getByRole('option', { selected: true })).toBe(firstOption)
    })

    it('moves through the options with ArrowDown/ArrowUp/Home/End', async () => {
      const { addressBook } = twoContacts()
      const { input, utils } = setup('', addressBook)

      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      })
      await waitFor(() => expect(utils.getByRole('listbox')).toBeInTheDocument())

      const options = utils.getAllByRole('option')
      expect(options.length).toBeGreaterThan(1)
      expect(activeOption(input)).toBe(options[0])

      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      })
      expect(activeOption(input)).toBe(options[1])

      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowUp' })
      })
      expect(activeOption(input)).toBe(options[0])

      act(() => {
        fireEvent.keyDown(input, { key: 'End' })
      })
      expect(activeOption(input)).toBe(options[options.length - 1])

      act(() => {
        fireEvent.keyDown(input, { key: 'Home' })
      })
      expect(activeOption(input)).toBe(options[0])
    })

    it('writes the active contact into the field on Enter', async () => {
      const { addressBook } = twoContacts()
      const { input, utils } = setup('', addressBook)

      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      })
      await waitFor(() => expect(utils.getByRole('listbox')).toBeInTheDocument())

      const activeAddress = activeOption(input)?.textContent?.match(/0x[a-fA-F0-9]{40}/)?.[0]
      expect(activeAddress).toBeDefined()

      act(() => {
        fireEvent.keyDown(input, { key: 'Enter' })
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => expect(utils.queryByRole('listbox')).not.toBeInTheDocument())
      expect(utils.getByLabelText('Recipient address', { exact: false })).toHaveValue(activeAddress)
    })

    it('does not submit the form when Enter selects a contact', async () => {
      const onSubmit = jest.fn()
      const { addressBook } = twoContacts()
      const { input, utils } = setup('', addressBook)
      utils.getByText('Submit').closest('form')?.addEventListener('submit', onSubmit)

      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown' })
      })
      await waitFor(() => expect(utils.getByRole('listbox')).toBeInTheDocument())

      act(() => {
        fireEvent.keyDown(input, { key: 'Enter' })
      })

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('leaves Enter alone when no option is active', async () => {
      const { addressBook } = twoContacts()
      const { input, utils } = setup('', addressBook)
      await openListWithMouse(utils, input)

      expect(input).not.toHaveAttribute('aria-activedescendant')

      act(() => {
        fireEvent.keyDown(input, { key: 'Enter' })
      })

      expect(input).toHaveValue('')
    })
  })
})
