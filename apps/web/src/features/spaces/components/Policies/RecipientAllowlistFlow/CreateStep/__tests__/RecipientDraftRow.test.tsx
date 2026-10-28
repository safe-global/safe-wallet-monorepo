import { faker } from '@faker-js/faker'
import { isAddress } from 'ethers'
import { useFormContext } from 'react-hook-form'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import {
  RECIPIENT_DUPLICATE_ERROR,
  RECIPIENT_IS_SAFE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistFormRecipient } from '../../types'
import RecipientDraftRow from '../RecipientDraftRow'

// AddressInput has its own suite; a registered input keeps this row's validity about its own rules.
jest.mock('@/components/common/AddressInput', () => {
  const MockAddressInput = ({
    name,
    validate,
    placeholder,
  }: {
    name: string
    validate?: (value: string) => string | undefined
    placeholder?: string
  }) => {
    const {
      register,
      setValue,
      formState: { errors },
    } = useFormContext()
    const error = errors[name] as { message?: string } | undefined
    return (
      <div>
        <input
          aria-label={placeholder}
          {...register(name, {
            required: true,
            validate: (value: string) => (isAddress(value) ? validate?.(value) : 'Invalid address'),
            // Like the real input, a resolved ENS name is replaced by its address.
            onChange: (event: { target: { value: string } }) => {
              const resolved = mockEnsNames[event.target.value]
              if (resolved) setValue(name, resolved, { shouldValidate: true })
            },
          })}
        />
        {error?.message && <span>{error.message}</span>}
      </div>
    )
  }
  return { __esModule: true, default: MockAddressInput }
})

const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const aliceAddress = faker.finance.ethereumAddress().toLowerCase()
const mockEnsNames: Record<string, string> = { 'alice.eth': aliceAddress, 'safe.eth': safeAddress }

const renderRow = (existing: AllowlistFormRecipient[] = [], autoFocus?: boolean) => {
  const onAdd = jest.fn()
  const onCancel = jest.fn()
  const view = renderWithUserEvent(
    <RecipientDraftRow
      safeAddress={safeAddress}
      existing={existing}
      onAdd={onAdd}
      onCancel={onCancel}
      autoFocus={autoFocus}
    />,
  )
  return { onAdd, onCancel, ...view }
}

const goToAddressStep = async (user: ReturnType<typeof renderRow>['user'], name?: string) => {
  if (name) await user.type(screen.getByLabelText('Name (optional)'), name)
  await user.click(screen.getByRole('button', { name: 'Next' }))
}

describe('RecipientDraftRow', () => {
  it('adds a valid address checksummed and selected, with the typed name', async () => {
    const address = faker.finance.ethereumAddress()
    const { user, onAdd } = renderRow()

    await goToAddressStep(user, 'Alice')
    expect(screen.getByText('Alice')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Address or ENS'), address.toLowerCase())
    await user.click(await screen.findByRole('button', { name: 'Add recipient' }))

    expect(onAdd).toHaveBeenCalledWith({ name: 'Alice', address: checksumAddress(address), selected: true })
  })

  it('leaves the name undefined when none is typed', async () => {
    const address = faker.finance.ethereumAddress()
    const { user, onAdd } = renderRow()

    await goToAddressStep(user)
    expect(screen.getByText('New recipient')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Address or ENS'), address)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add recipient' })).toBeEnabled())
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ name: undefined, address: checksumAddress(address), selected: true }),
    )
  })

  it('rejects a duplicate typed in another case', async () => {
    const address = faker.finance.ethereumAddress()
    const { user, onAdd } = renderRow([{ address: checksumAddress(address), selected: true }])

    await goToAddressStep(user)
    await user.type(screen.getByLabelText('Address or ENS'), address.toLowerCase())

    expect(await screen.findByText(RECIPIENT_DUPLICATE_ERROR)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('rejects the Safe account itself', async () => {
    const { user } = renderRow()

    await goToAddressStep(user)
    await user.type(screen.getByLabelText('Address or ENS'), safeAddress)

    expect(await screen.findByText(RECIPIENT_IS_SAFE_ERROR)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
  })

  it('keeps add disabled while the address is still empty', async () => {
    const { user } = renderRow()

    await goToAddressStep(user, 'Alice')

    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
  })

  it('keeps add disabled for an invalid address', async () => {
    const { user } = renderRow()

    await goToAddressStep(user)
    await user.type(screen.getByLabelText('Address or ENS'), '0x123')

    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
  })

  it('adds the address an ENS name resolves to, checksummed', async () => {
    const { user, onAdd } = renderRow()

    await goToAddressStep(user, 'Alice')
    await user.type(screen.getByLabelText('Address or ENS'), 'alice.eth')
    await user.click(await screen.findByRole('button', { name: 'Add recipient' }))

    expect(onAdd).toHaveBeenCalledWith({ name: 'Alice', address: checksumAddress(aliceAddress), selected: true })
  })

  it('keeps add disabled for an ENS name that does not resolve', async () => {
    const { user } = renderRow()

    await goToAddressStep(user)
    await user.type(screen.getByLabelText('Address or ENS'), 'unknown.eth')

    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
  })

  it('rejects an ENS name that resolves to an existing recipient', async () => {
    const { user, onAdd } = renderRow([{ address: checksumAddress(aliceAddress), selected: true }])

    await goToAddressStep(user)
    await user.type(screen.getByLabelText('Address or ENS'), 'alice.eth')

    expect(await screen.findByText(RECIPIENT_DUPLICATE_ERROR)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('rejects an ENS name that resolves to the Safe account itself', async () => {
    const { user } = renderRow()

    await goToAddressStep(user)
    await user.type(screen.getByLabelText('Address or ENS'), 'safe.eth')

    expect(await screen.findByText(RECIPIENT_IS_SAFE_ERROR)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add recipient' })).toBeDisabled()
  })

  it('focuses the name field only when asked to', () => {
    const { unmount } = renderRow([], true)
    expect(screen.getByLabelText('Name (optional)')).toHaveFocus()
    unmount()

    renderRow()
    expect(screen.getByLabelText('Name (optional)')).not.toHaveFocus()
  })

  it('cancels on Escape and on Remove', async () => {
    const { user, onCancel } = renderRow()

    await user.type(screen.getByLabelText('Name (optional)'), '{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
  })
})
