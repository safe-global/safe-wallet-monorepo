import React from 'react'
import { act, fireEvent, render } from '@/src/tests/test-utils'
import { FileSelection } from '../FileSelection.container'
import { useDataImportContext } from '../context/DataImportProvider'
import { useRouter } from 'expo-router'

jest.mock('../context/DataImportProvider', () => ({
  useDataImportContext: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

describe('FileSelection', () => {
  const pushMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useRouter).mockReturnValue({ push: pushMock } as unknown as ReturnType<typeof useRouter>)
  })

  it('navigates when a file is selected', async () => {
    jest.mocked(useDataImportContext).mockReturnValue({
      pickFile: jest.fn().mockResolvedValue(true),
    } as unknown as ReturnType<typeof useDataImportContext>)

    const { getByTestId } = render(<FileSelection />)

    await act(async () => {
      fireEvent.press(getByTestId('select-file-to-import-button'))
    })

    expect(pushMock).toHaveBeenCalledWith('/import-data/enter-password')
  })

  it('does not navigate when no file is selected', async () => {
    jest.mocked(useDataImportContext).mockReturnValue({
      pickFile: jest.fn().mockResolvedValue(false),
    } as unknown as ReturnType<typeof useDataImportContext>)

    const { getByTestId } = render(<FileSelection />)

    await act(async () => {
      fireEvent.press(getByTestId('select-file-to-import-button'))
    })

    expect(pushMock).not.toHaveBeenCalled()
  })
})
