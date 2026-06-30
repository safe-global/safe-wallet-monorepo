import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddContactDialog from '../AddContactDialog'

const mockDispatch = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(() => true),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      { chainId: '1', chainName: 'Ethereum' },
      { chainId: '137', chainName: 'Polygon' },
    ],
  }),
}))

jest.mock('@/features/address-poisoning', () => ({
  useAddressSimilarityGate: () => ({ match: null, isBlocked: false, acknowledged: false, acknowledge: () => {} }),
  AddressSimilarityWarning: () => null,
  SimilarAddressConfirmDialog: () => null,
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open, dialogTitle }: { children: React.ReactNode; open: boolean; dialogTitle: string }) =>
    open ? (
      <div role="dialog" aria-label={dialogTitle}>
        {children}
      </div>
    ) : null,
}))

jest.mock('@/components/common/NameInput', () => ({
  __esModule: true,
  default: ({ name, label }: { name: string; label: string }) => {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return <input aria-label={label} {...register(name, { required: true })} />
  },
}))

jest.mock('@/components/common/AddressInput', () => ({
  __esModule: true,
  default: ({ name, label, chain }: { name: string; label: string; chain?: { chainId: string } }) => {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return <input aria-label={label} data-ens-chain={chain?.chainId ?? ''} {...register(name, { required: true })} />
  },
}))

jest.mock('@/components/common/NetworkSelector/NetworkMultiSelectorInput', () => ({
  __esModule: true,
  default: () => <div data-testid="network-selector" />,
}))

const baseProps = {
  triggerLabel: 'Add shared contact',
  dialogTitle: 'Add contact',
  successMessage: 'Added contact',
  successGroupKey: 'add-contact-success',
}

const openDialog = () => fireEvent.click(screen.getByRole('button', { name: /add shared contact/i }))

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } })
  fireEvent.change(screen.getByLabelText('Address or ENS'), { target: { value: '0xabc' } })
}

describe('AddContactDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the trigger label and opens the dialog with the given title', () => {
    render(<AddContactDialog {...baseProps} submit={jest.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    openDialog()

    expect(screen.getByRole('dialog', { name: 'Add contact' })).toBeInTheDocument()
  })

  it('renders intro text when provided', () => {
    render(<AddContactDialog {...baseProps} intro="Private to you" submit={jest.fn()} />)
    openDialog()

    expect(screen.getByText('Private to you')).toBeInTheDocument()
  })

  it('omits intro text when not provided', () => {
    render(<AddContactDialog {...baseProps} submit={jest.fn()} />)
    openDialog()

    expect(screen.queryByText('Private to you')).not.toBeInTheDocument()
  })

  it('submits the item with name, address, all chainIds, and the space id', async () => {
    const submit = jest.fn().mockResolvedValue({})
    render(<AddContactDialog {...baseProps} submit={submit} />)
    openDialog()
    fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith({ name: 'Alice', address: '0xabc', chainIds: ['1', '137'] }, '42')
    })
  })

  it('on success dispatches the notification, fires onSuccess, and closes the dialog', async () => {
    const onSuccess = jest.fn()
    const submit = jest.fn().mockResolvedValue({})
    render(<AddContactDialog {...baseProps} submit={submit} onSuccess={onSuccess} />)
    openDialog()
    fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/show',
        payload: {
          message: 'Added contact',
          variant: 'success',
          groupKey: 'add-contact-success',
        },
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('fires onSubmitStart before the submit call', async () => {
    const order: string[] = []
    const onSubmitStart = jest.fn(() => {
      order.push('start')
    })
    const submit = jest.fn(() => {
      order.push('submit')
      return Promise.resolve({})
    })
    render(<AddContactDialog {...baseProps} submit={submit} onSubmitStart={onSubmitStart} />)
    openDialog()
    fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => expect(submit).toHaveBeenCalled())
    expect(order).toEqual(['start', 'submit'])
  })

  it('on result.error shows an alert, dispatches an error toast, keeps the dialog open, and does not fire onSuccess', async () => {
    const onSuccess = jest.fn()
    const submit = jest.fn().mockResolvedValue({ error: { status: 500 } })
    render(<AddContactDialog {...baseProps} submit={submit} onSuccess={onSuccess} />)
    openDialog()
    fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong \(500\)/)).toBeInTheDocument()
    })
    expect(onSuccess).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'notifications/show',
      payload: expect.objectContaining({ variant: 'error' }),
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('bubbles the backend message into both the alert and the error toast', async () => {
    const submit = jest.fn().mockResolvedValue({
      error: { status: 422, data: { message: 'name must contain only valid characters' } },
    })
    render(<AddContactDialog {...baseProps} submit={submit} />)
    openDialog()
    fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('name must contain only valid characters')).toBeInTheDocument()
    })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'notifications/show',
      payload: expect.objectContaining({
        message: 'name must contain only valid characters',
        variant: 'error',
      }),
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('on a thrown error bubbles the message into the alert and the error toast, keeping the dialog open', async () => {
    const onSuccess = jest.fn()
    const submit = jest.fn().mockRejectedValue({ status: 422, data: { message: 'invalid characters in name' } })
    render(<AddContactDialog {...baseProps} submit={submit} onSuccess={onSuccess} />)
    openDialog()
    fillRequiredFields()

    const submitButton = screen.getByRole('button', { name: 'Add contact' })
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('invalid characters in name')).toBeInTheDocument()
    })
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'notifications/show',
      payload: expect.objectContaining({ message: 'invalid characters in name', variant: 'error' }),
    })
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uses a custom submitLabel when provided', async () => {
    render(<AddContactDialog {...baseProps} submitLabel="Save" submit={jest.fn()} />)
    openDialog()

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('resolves ENS on mainnet by passing the mainnet chain to the address input', () => {
    render(<AddContactDialog {...baseProps} submit={jest.fn()} />)
    openDialog()

    expect(screen.getByLabelText('Address or ENS')).toHaveAttribute('data-ens-chain', '1')
  })
})
