import NameChip from './NameChip'
import useAddressBook from '@/hooks/useAddressBook'
import { useAddressName } from '@/components/common/NamedAddressInfo'
import { txDataBuilder } from '@/tests/builders/safeTx'
import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'

// Theme color values
const COLORS = {
  ERROR_BACKGROUND: '#FFE6EA',
  ERROR_MAIN: '#FF5F72',
  BACKGROUND_MAIN: '#F4F4F4',
} as const

// Mock the hooks
jest.mock('@/hooks/useAddressBook')
jest.mock('@/components/common/NamedAddressInfo')

describe('NameChip', () => {
  const mockUseAddressBook = useAddressBook as jest.MockedFunction<typeof useAddressBook>
  const mockUseAddressName = useAddressName as jest.MockedFunction<typeof useAddressName>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render nothing when no address is provided', () => {
    mockUseAddressName.mockReturnValue({ name: undefined, logoUri: undefined, isUnverifiedContract: false })
    render(<NameChip />)
    expect(screen.queryByTestId('name-chip')).not.toBeInTheDocument()
  })

  it('should render nothing when address is provided but no name or logo', () => {
    const mockAddress = faker.finance.ethereumAddress()
    mockUseAddressName.mockReturnValue({ name: undefined, logoUri: undefined, isUnverifiedContract: false })
    mockUseAddressBook.mockReturnValue({})

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress },
      })
      .build()

    render(<NameChip txData={txData} />)
    expect(screen.queryByTestId('name-chip')).not.toBeInTheDocument()
  })

  it('should render with error color for unverified contracts not in address book', () => {
    const mockAddress = faker.finance.ethereumAddress()
    mockUseAddressName.mockReturnValue({ name: 'Unverified contract', logoUri: undefined, isUnverifiedContract: true })
    mockUseAddressBook.mockReturnValue({})

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress },
      })
      .build()

    render(<NameChip txData={txData} />)
    const chip = screen.getByTestId('name-chip')
    expect(chip).toHaveStyle({ backgroundColor: COLORS.ERROR_BACKGROUND })
    expect(chip).toHaveStyle({ color: COLORS.ERROR_MAIN })
  })

  it('should not render with error color for verified contracts not in address book', () => {
    const mockAddress = faker.finance.ethereumAddress()
    mockUseAddressName.mockReturnValue({ name: 'Test Contract', logoUri: undefined, isUnverifiedContract: false })
    mockUseAddressBook.mockReturnValue({})

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress },
      })
      .build()

    render(<NameChip txData={txData} />)
    const chip = screen.getByTestId('name-chip')
    expect(chip).not.toHaveStyle({ backgroundColor: COLORS.ERROR_BACKGROUND })
    expect(chip).not.toHaveStyle({ color: COLORS.ERROR_MAIN })
  })

  it('should not render with error color for unverified contracts in address book', () => {
    const mockAddress = faker.finance.ethereumAddress()
    mockUseAddressName.mockReturnValue({ name: 'Unverified contract', logoUri: undefined, isUnverifiedContract: true })
    mockUseAddressBook.mockReturnValue({ [mockAddress]: 'Address Book Entry' })

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress },
      })
      .build()

    render(<NameChip txData={txData} />)
    const chip = screen.getByTestId('name-chip')
    expect(chip).not.toHaveStyle({ backgroundColor: COLORS.ERROR_BACKGROUND })
    expect(chip).not.toHaveStyle({ color: COLORS.ERROR_MAIN })
  })

  it('should prioritize address book name over txInfo name', () => {
    const mockAddress = faker.finance.ethereumAddress()
    const addressBookName = 'Address Book Name'
    const txInfoName = 'TxInfo Name'

    mockUseAddressName.mockReturnValue({ name: txInfoName, logoUri: undefined, isUnverifiedContract: false })
    mockUseAddressBook.mockReturnValue({ [mockAddress]: addressBookName })

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress, name: txInfoName },
      })
      .build()

    render(<NameChip txData={txData} />)
    expect(screen.getByText(addressBookName)).toBeInTheDocument()
    expect(screen.queryByText(txInfoName)).not.toBeInTheDocument()
  })

  it('should render with background when withBackground prop is true', () => {
    const mockAddress = faker.finance.ethereumAddress()
    mockUseAddressName.mockReturnValue({ name: 'Test Contract', logoUri: undefined, isUnverifiedContract: false })
    mockUseAddressBook.mockReturnValue({})

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress },
      })
      .build()

    render(<NameChip txData={txData} withBackground />)
    const chip = screen.getByTestId('name-chip')
    expect(chip).toHaveStyle({ backgroundColor: 'rgb(244, 244, 244)' })
  })

  it('should display name and logo when provided', () => {
    const mockAddress = faker.finance.ethereumAddress()
    mockUseAddressName.mockReturnValue({ name: 'Test Contract', logoUri: 'test-logo.png', isUnverifiedContract: false })
    mockUseAddressBook.mockReturnValue({})

    const txData = txDataBuilder()
      .with({
        to: { value: mockAddress },
      })
      .build()

    render(<NameChip txData={txData} />)
    expect(screen.getByText('Test Contract')).toBeInTheDocument()
    expect(screen.getByRole('presentation')).toHaveAttribute('src', 'test-logo.png')
  })
})
