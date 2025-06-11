import React from 'react'
import { fireEvent, render, within } from '@/src/tests/test-utils'
import { ReviewData } from '../ReviewData.container'
import { useDataImportContext } from '../context/DataImportProvider'
import { useRouter } from 'expo-router'

jest.mock('../context/DataImportProvider', () => ({
  useDataImportContext: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

describe('ReviewData', () => {
  const pushMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useRouter).mockReturnValue({ push: pushMock } as unknown as ReturnType<typeof useRouter>)
  })

  it('summarizes imported counts correctly', () => {
    jest.mocked(useDataImportContext).mockReturnValue({
      importedData: {
        data: {
          safes: [
            { address: '0x1', chain: '1', name: 'Safe 1' },
            { address: '0x2', chain: '1', name: 'Safe 2' },
          ],
          contacts: [{ address: '0x3', name: 'Contact', chain: '1' }],
          keys: [
            { address: '0x4', name: 'Key 1', key: 'AAA' },
            { address: '0x4', name: 'Key 1', key: 'BBB' },
          ],
        },
      },
    } as unknown as ReturnType<typeof useDataImportContext>)

    const { getByTestId } = render(<ReviewData />)

    expect(within(getByTestId('safe-accounts-summary')).getByText('2')).toBeTruthy()
    expect(within(getByTestId('signers-summary')).getByText('1')).toBeTruthy()
    expect(within(getByTestId('address-book-summary')).getByText('1')).toBeTruthy()
  })

  it('navigates to progress screen on continue', () => {
    jest.mocked(useDataImportContext).mockReturnValue({
      importedData: { data: {} },
    } as unknown as ReturnType<typeof useDataImportContext>)

    const { getByTestId } = render(<ReviewData />)

    fireEvent.press(getByTestId('continue-button'))

    expect(pushMock).toHaveBeenCalledWith('/import-data/import-progress')
  })
})
