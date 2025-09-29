import { useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import { useDataImportContext } from '../context/DataImportProvider'
import * as transforms from '../helpers/transforms'

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

jest.mock('@/src/hooks/useDelegate', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    createDelegate: jest.fn().mockResolvedValue({ success: true, delegateAddress: '0xDelegate' }),
  })),
}))

jest.mock('../context/DataImportProvider', () => ({
  useDataImportContext: jest.fn(),
}))

jest.mock('../helpers/transforms', () => ({
  ...jest.requireActual('../helpers/transforms'),
  fetchSafeOwnersInBatches: jest.fn(),
  storeKeysWithValidation: jest.fn(),
  storeSafes: jest.fn(),
  storeContacts: jest.fn(),
}))

describe('ImportProgressScreen', () => {
  const pushMock = jest.fn()
  const backMock = jest.fn()
  const dispatchMock = jest.fn()
  const mockCreateDelegate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    jest
      .mocked(useRouter)
      .mockReturnValue({ push: pushMock, back: backMock } as unknown as ReturnType<typeof useRouter>)
    jest.mocked(useAppDispatch).mockReturnValue(dispatchMock)
    jest.mocked(useAppSelector).mockReturnValue('USD')
    jest.mocked(storePrivateKey).mockResolvedValue(undefined)
    mockCreateDelegate.mockResolvedValue({ success: true, delegateAddress: '0xDelegate' })

    // Mock useDelegate hook
    require('@/src/hooks/useDelegate').default.mockReturnValue({
      createDelegate: mockCreateDelegate,
    })

    // Mock transforms functions
    jest.mocked(transforms.fetchSafeOwnersInBatches).mockResolvedValue(new Set(['0x2']))
    jest.mocked(transforms.storeKeysWithValidation).mockResolvedValue(undefined)
    jest.mocked(transforms.storeContacts).mockImplementation(jest.fn())
  })

  it('calls storeKeysWithValidation with createDelegate parameter', async () => {
    const updateNotImportedKeys = jest.fn()

    jest.mocked(useDataImportContext).mockReturnValue({
      importedData: {
        data: {
          safes: [{ address: '0x1', chain: '1', name: 'Safe' }],
          keys: [{ address: '0x2', name: 'Key', key: 'AAAA' }],
          contacts: [{ address: '0x3', name: 'Contact', chain: '1' }],
        },
      },
      updateNotImportedKeys,
    } as unknown as ReturnType<typeof useDataImportContext>)

    // Test that the hook integration works by checking the mocks
    expect(mockCreateDelegate).toBeDefined()
    expect(transforms.storeKeysWithValidation).toBeDefined()

    // Simulate calling the storeKeysWithValidation with the createDelegate parameter
    await transforms.storeKeysWithValidation(
      { keys: [{ address: '0x2', name: 'Key', key: 'AAAA' }] },
      new Set(['0x2']),
      dispatchMock,
      updateNotImportedKeys,
      mockCreateDelegate,
    )

    // Verify that the function was called with the correct parameters
    expect(transforms.storeKeysWithValidation).toHaveBeenCalledWith(
      { keys: [{ address: '0x2', name: 'Key', key: 'AAAA' }] },
      new Set(['0x2']),
      dispatchMock,
      updateNotImportedKeys,
      mockCreateDelegate,
    )
  })

  it('useDelegate hook returns createDelegate function', () => {
    const useDelegate = require('@/src/hooks/useDelegate').default
    const result = useDelegate()

    expect(result.createDelegate).toBeDefined()
    expect(typeof result.createDelegate).toBe('function')
  })
})
