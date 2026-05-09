import React from 'react'
import { act, fireEvent, render } from '@/src/tests/test-utils'
import { EnterPassword } from '../EnterPassword.container'
import { useDataImportContext } from '../context/DataImportProvider'
import { useRouter } from 'expo-router'

jest.mock('../context/DataImportProvider', () => ({
  useDataImportContext: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

describe('EnterPassword', () => {
  const pushMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useRouter).mockReturnValue({ push: pushMock } as unknown as ReturnType<typeof useRouter>)
  })

  it('shows the selected file name', () => {
    jest.mocked(useDataImportContext).mockReturnValue({
      handlePasswordChange: jest.fn(),
      handleImport: jest.fn(),
      password: '',
      isLoading: false,
      fileName: 'export.json',
    } as unknown as ReturnType<typeof useDataImportContext>)

    const { getByTestId } = render(<EnterPassword />)

    expect(getByTestId('file-name').props.children).toContain('export.json')
  })

  it('navigates to error screen when import fails', async () => {
    const importMock = jest.fn().mockResolvedValue(null)
    jest.mocked(useDataImportContext).mockReturnValue({
      handlePasswordChange: jest.fn(),
      handleImport: importMock,
      password: 'pw',
      isLoading: false,
      fileName: 'export.json',
    } as unknown as ReturnType<typeof useDataImportContext>)

    const { getByTestId } = render(<EnterPassword />)

    await act(async () => {
      fireEvent.press(getByTestId('decrypt-button'))
    })

    expect(importMock).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/import-data/import-error')
  })
})
