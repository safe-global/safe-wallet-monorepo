import React from 'react'
import { act, render } from '@/src/tests/test-utils'
import { ImportProgressScreen } from '../ImportProgressScreen.container'
import { useDataImportContext } from '../context/DataImportProvider'
import { useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'

jest.mock('../context/DataImportProvider', () => ({
  useDataImportContext: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

jest.mock('@/src/hooks/useSign/useSign', () => ({
  storePrivateKey: jest.fn(),
}))

describe('ImportProgressScreen', () => {
  const pushMock = jest.fn()
  const dispatchMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(useRouter)
      .mockReturnValue({ push: pushMock, back: jest.fn() } as unknown as ReturnType<typeof useRouter>)
    jest.mocked(useAppDispatch).mockReturnValue(dispatchMock)
    jest.mocked(useAppSelector).mockReturnValue('auto')
    jest.mocked(storePrivateKey).mockResolvedValue(undefined)
  })

  it('dispatches actions and navigates on success', async () => {
    jest.mocked(useDataImportContext).mockReturnValue({
      importedData: {
        data: {
          safes: [{ address: '0x1', chain: '1', name: 'Safe' }],
          keys: [{ address: '0x2', name: 'Key', key: 'AAAA' }],
          contacts: [{ address: '0x3', name: 'Contact', chain: '1' }],
        },
      },
    } as unknown as ReturnType<typeof useDataImportContext>)

    render(<ImportProgressScreen />)

    // Not sure why we need to run all timers 3 times, my guess is that
    // since the timers are sequential, we need to run all timers 3 times
    await act(async () => {
      jest.runAllTimers()
    })
    await act(async () => {
      jest.runAllTimers()
    })
    await act(async () => {
      jest.runAllTimers()
    })
    expect(dispatchMock).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/import-data/import-success')
  })
})
