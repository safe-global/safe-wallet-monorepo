import { render, screen } from '@testing-library/react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ContactSource, type ExtendedContact } from '@/hooks/useAllAddressBooks'
import RecipientOption from './RecipientOption'

const mockUseMediaQuery = jest.fn()

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: (query: string) => mockUseMediaQuery(query),
}))

jest.mock('@/components/common/Identicon', () => {
  const Identicon = ({ address }: { address: string }) => <span data-testid="identicon">{address}</span>
  return Identicon
})

jest.mock('@/components/common/InitialsAvatar', () => {
  const InitialsAvatar = ({ name }: { name: string }) => <span data-testid="initials-avatar">{name}</span>
  return InitialsAvatar
})

const contact = (overrides: Partial<ExtendedContact> = {}): ExtendedContact => ({
  name: 'Alice signer',
  address: checksumAddress('0x1234567890123456789012345678901234567890'),
  chainIds: ['1'],
  createdBy: '',
  createdByUserId: 0,
  lastUpdatedBy: '',
  lastUpdatedByUserId: 0,
  createdAt: '',
  updatedAt: '',
  source: ContactSource.local,
  ...overrides,
})

describe('RecipientOption', () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false)
  })

  it('renders a local contact with local provenance', () => {
    render(<RecipientOption contact={contact()} prefix="eth" />)

    expect(screen.getByText('Alice signer')).toBeInTheDocument()
    expect(screen.getByText('Saved on this device')).toBeInTheDocument()
  })

  it('renders space contact provenance with the resolved member name', () => {
    render(
      <RecipientOption
        contact={contact({
          source: ContactSource.space,
          createdBy: checksumAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'),
          createdByUserId: 7,
          createdAt: '2026-01-02T03:04:05.000Z',
        })}
        memberName="Maria admin"
      />,
    )

    expect(screen.getByText('Added by')).toBeInTheDocument()
    expect(screen.getAllByText('Maria admin')).toHaveLength(2)
    expect(screen.getByTestId('initials-avatar')).toHaveTextContent('Maria admin')
  })
})
