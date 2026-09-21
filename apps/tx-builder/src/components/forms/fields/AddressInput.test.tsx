import { useState } from 'react'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import InputAdornment from '@mui/material/InputAdornment'

import { render } from '../../../test-utils'
import AddressInput from './AddressInput'
import { checksumAddress } from '../../../utils/address'
import { trackSafeAppEvent } from '../../../lib/analytics'
import type { KnownAddress } from '../../../hooks/useKnownAddresses'

const CONTACT_LOWERCASE = '0x680cde08860141f9d223ce4e620b10cd6741037e'
const CONTACT = checksumAddress(CONTACT_LOWERCASE)
const CONTACT_2 = checksumAddress('0x9913b9180c20c6b0f21b6480c84422f6ebc4b808')
const RESOLVED_ENS_ADDRESS = checksumAddress('0x1f9090aae28b8a3dceadf281b0f12828e676c326')

const mockLoadAddressBook = jest.fn()
let mockKnownAddresses: KnownAddress[] = []

jest.mock('../../../hooks/useKnownAddresses', () => ({
  useKnownAddresses: () => ({
    knownAddresses: mockKnownAddresses,
    loadAddressBook: mockLoadAddressBook,
  }),
}))

jest.mock('../../../lib/analytics', () => ({
  trackSafeAppEvent: jest.fn(),
}))

type HarnessProps = {
  initialAddress?: string
  onChangeAddress?: (address: string) => void
  getAddressFromDomain?: (name: string) => Promise<string>
}

const AddressInputHarness = ({ initialAddress = '', onChangeAddress, getAddressFromDomain }: HarnessProps) => {
  const [address, setAddress] = useState(initialAddress)

  return (
    <AddressInput
      name="recipient"
      label="Recipient"
      address={address}
      networkPrefix="eth"
      getAddressFromDomain={getAddressFromDomain}
      customENSThrottleDelay={0}
      onChangeAddress={(value) => {
        setAddress(value)
        onChangeAddress?.(value)
      }}
    />
  )
}

const getInput = () => screen.getByRole('combobox') as HTMLInputElement

describe('<AddressInput>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockKnownAddresses = [
      { address: CONTACT, name: 'Alice' },
      { address: CONTACT_2, name: 'Treasury' },
    ]
  })

  it('loads the address book only once the dropdown opens', () => {
    render(<AddressInputHarness />)

    expect(mockLoadAddressBook).not.toHaveBeenCalled()

    fireEvent.mouseDown(getInput())

    expect(mockLoadAddressBook).toHaveBeenCalled()
  })

  it('renders the known addresses under a local contacts header', () => {
    render(<AddressInputHarness />)

    fireEvent.mouseDown(getInput())

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)

    const header = screen.getByTestId('contact-group-header')
    expect(header).toHaveTextContent('Local contacts')
    expect(header).toHaveTextContent('2')
  })

  it('filters by name substring', () => {
    render(<AddressInputHarness />)

    fireEvent.change(getInput(), { target: { value: 'Ali' } })

    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByTestId('contact-group-header')).toHaveTextContent('1')
  })

  it('filters by address substring', () => {
    render(<AddressInputHarness />)

    fireEvent.change(getInput(), { target: { value: CONTACT_2.slice(2, 10) } })

    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('autofills the checksummed address and the resolved name on selection', async () => {
    const onChangeAddress = jest.fn()
    render(<AddressInputHarness onChangeAddress={onChangeAddress} />)

    const input = getInput()
    fireEvent.change(input, { target: { value: 'Ali' } })
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(() => {
      expect(input).toHaveValue(`eth:${CONTACT}`)
    })
    // The form state keeps the unprefixed, checksummed address
    expect(onChangeAddress).toHaveBeenLastCalledWith(CONTACT)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(trackSafeAppEvent).toHaveBeenCalledWith('Address book entry selected')
  })

  it('checksums a pasted lowercase address and reports it once', async () => {
    const onChangeAddress = jest.fn()
    render(<AddressInputHarness onChangeAddress={onChangeAddress} />)

    const input = getInput()
    fireEvent.change(input, { target: { value: CONTACT_LOWERCASE } })

    expect(onChangeAddress).toHaveBeenCalledWith(CONTACT)
    await waitFor(() => {
      expect(input).toHaveValue(`eth:${CONTACT}`)
    })
    expect(trackSafeAppEvent).toHaveBeenCalledWith('Address manually entered')
    expect(
      (trackSafeAppEvent as jest.Mock).mock.calls.filter(([action]) => action === 'Address manually entered'),
    ).toHaveLength(1)
  })

  it('strips a valid network prefix from a pasted address', () => {
    const onChangeAddress = jest.fn()
    render(<AddressInputHarness onChangeAddress={onChangeAddress} />)

    fireEvent.change(getInput(), { target: { value: `eth:${CONTACT}` } })

    expect(onChangeAddress).toHaveBeenCalledWith(CONTACT)
  })

  it('does not report a prefilled address as a manual entry', () => {
    render(<AddressInputHarness initialAddress={CONTACT} />)

    expect(trackSafeAppEvent).not.toHaveBeenCalled()
    expect(getInput()).toHaveValue(`eth:${CONTACT}`)
  })

  it('updates the displayed value when the address changes from outside', async () => {
    // Simulates a value arriving from a QR scan or a batch-edit prefill
    const ExternallyUpdatedInput = () => {
      const [address, setAddress] = useState('')

      return (
        <>
          <button onClick={() => setAddress(CONTACT_LOWERCASE)}>load</button>
          <AddressInput
            name="recipient"
            label="Recipient"
            address={address}
            networkPrefix="eth"
            onChangeAddress={setAddress}
          />
        </>
      )
    }

    render(<ExternallyUpdatedInput />)
    expect(getInput()).toHaveValue('')

    fireEvent.click(screen.getByRole('button', { name: 'load' }))

    await waitFor(() => {
      expect(getInput()).toHaveValue(`eth:${CONTACT}`)
    })
  })

  it('resolves an ENS name into an address', async () => {
    const getAddressFromDomain = jest.fn().mockResolvedValue(RESOLVED_ENS_ADDRESS)
    const onChangeAddress = jest.fn()
    render(
      <AddressInputHarness
        initialAddress="vitalik.eth"
        getAddressFromDomain={getAddressFromDomain}
        onChangeAddress={onChangeAddress}
      />,
    )

    await waitFor(() => {
      expect(getAddressFromDomain).toHaveBeenCalledWith('vitalik.eth')
    })
    await waitFor(() => {
      expect(onChangeAddress).toHaveBeenCalledWith(RESOLVED_ENS_ADDRESS)
    })
    expect(getInput()).toHaveValue(`eth:${RESOLVED_ENS_ADDRESS}`)
  })

  it('keeps a caller-provided end adornment', () => {
    render(
      <AddressInput
        name="recipient"
        label="Recipient"
        address={CONTACT}
        networkPrefix="eth"
        onChangeAddress={jest.fn()}
        InputProps={{
          endAdornment: <InputAdornment position="end">ABI found</InputAdornment>,
        }}
      />,
    )

    expect(screen.getByText('ABI found')).toBeInTheDocument()
  })
})
