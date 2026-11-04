import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import SpaceAddressBookPage from '../Page'

jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))
jest.mock('../../AuthState', () => {
  const AuthState = ({ children }: { children: ReactNode }) => <>{children}</>
  return AuthState
})
jest.mock('@/components/common/AddressBookSourceProvider', () => ({
  AddressBookSourceProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('../index', () => {
  const SpaceAddressBook = () => <div>Address book v1</div>
  return SpaceAddressBook
})
jest.mock('../../SpaceAddressBookV2', () => {
  const SpaceAddressBookV2 = () => <div>Address book v2</div>
  return SpaceAddressBookV2
})

const mockV2Flag = (enabled: boolean | undefined) =>
  (useHasFeature as jest.Mock).mockImplementation((feature: FEATURES) =>
    feature === FEATURES.WORKSPACES_ADDRESS_BOOK_V2 ? enabled : false,
  )

describe('SpaceAddressBookPage', () => {
  it('keeps the current address book while the v2 flag is off', () => {
    mockV2Flag(false)

    render(<SpaceAddressBookPage spaceId="1" />)

    expect(screen.getByText('Address book v1')).toBeInTheDocument()
    expect(screen.queryByText('Address book v2')).not.toBeInTheDocument()
  })

  it('renders the v2 address book when the flag is on', () => {
    mockV2Flag(true)

    render(<SpaceAddressBookPage spaceId="1" />)

    expect(screen.getByText('Address book v2')).toBeInTheDocument()
    expect(screen.queryByText('Address book v1')).not.toBeInTheDocument()
  })

  it('keeps the current address book while the chain config is unknown', () => {
    mockV2Flag(undefined)

    render(<SpaceAddressBookPage spaceId="1" />)

    expect(screen.getByText('Address book v1')).toBeInTheDocument()
    expect(screen.queryByText('Address book v2')).not.toBeInTheDocument()
  })
})
