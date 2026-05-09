import React from 'react'
import { render } from '@/src/tests/test-utils'
import { Receiver } from '../Receiver'
import { faker } from '@faker-js/faker'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'

// Mock the store hooks
jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(() => jest.fn()),
}))

// Mock the useTheme hook
jest.mock('@/src/theme/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({ colorScheme: 'light' })),
}))

describe('Receiver', () => {
  const mockAddress = faker.finance.ethereumAddress()

  const mockContact = {
    value: mockAddress,
    name: 'My Custom Safe',
    chainIds: ['1'],
    logoUri: null,
  }

  const mockTo = {
    value: mockAddress,
    name: 'GnosisSafeProxy',
    logoUri: 'https://example.com/logo.png',
  }

  const createMockTxData = (overrides?: Partial<TransactionDetails['txData']>): TransactionDetails['txData'] => ({
    operation: 0,
    to: { ...mockTo, ...overrides?.to },
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display contact name from address book when contact exists', () => {
    jest.mocked(useAppSelector).mockReturnValue(mockContact)

    const txData = createMockTxData()
    const { getByText, queryByText } = render(<Receiver txData={txData} />)

    // Should show contact name from addressbook, not transaction data name
    expect(getByText(mockContact.name)).toBeTruthy()
    expect(queryByText(mockTo.name)).toBeNull()
  })

  it('should fall back to transaction data name when no contact exists in address book', () => {
    jest.mocked(useAppSelector).mockReturnValue(null)

    const txData = createMockTxData()
    const { getByText } = render(<Receiver txData={txData} />)

    // Should show transaction data name as fallback
    expect(getByText(mockTo.name)).toBeTruthy()
  })

  it.each([
    {
      name: 'no contact name and no transaction data name',
      txData: createMockTxData({
        to: {
          value: mockAddress,
          name: null,
          logoUri: null,
        },
      }),
    },
    {
      name: 'txData is null',
      txData: null,
    },
    {
      name: 'txData is undefined',
      txData: undefined,
    },
  ])('should not render when $name', ({ txData }) => {
    jest.mocked(useAppSelector).mockReturnValue(null)

    const { queryByText } = render(<Receiver txData={txData} />)

    // Should not render anything
    expect(queryByText(mockContact.name)).toBeNull()
    expect(queryByText(mockTo.name)).toBeNull()
  })

  it('should handle missing logoUri gracefully', () => {
    jest.mocked(useAppSelector).mockReturnValue(mockContact)

    const txData = createMockTxData({
      to: {
        value: mockAddress,
        name: 'Contract Name',
        logoUri: null,
      },
    })
    const { getByText } = render(<Receiver txData={txData} />)

    // Should still render the component even without logoUri
    expect(getByText(mockContact.name)).toBeTruthy()
  })
})
