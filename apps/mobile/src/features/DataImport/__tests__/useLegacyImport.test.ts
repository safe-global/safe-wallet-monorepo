import { act, renderHook } from '@/src/tests/test-utils'
import { useLegacyImport } from '../hooks/useLegacyImport'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import {
  decodeLegacyData,
  LegacyDataPasswordError,
  LegacyDataFormatError,
  LegacyDataCorruptedError,
} from '@/src/utils/legacyData'

jest.mock('expo-document-picker')
jest.mock('expo-file-system')
jest.mock('@/src/utils/legacyData', () => ({
  decodeLegacyData: jest.fn(),
  LegacyDataPasswordError: class LegacyDataPasswordError extends Error {
    constructor() {
      super('Invalid password for legacy data')
      this.name = 'LegacyDataPasswordError'
    }
  },
  LegacyDataFormatError: class LegacyDataFormatError extends Error {
    constructor() {
      super('Invalid legacy data format')
      this.name = 'LegacyDataFormatError'
    }
  },
  LegacyDataCorruptedError: class LegacyDataCorruptedError extends Error {
    constructor() {
      super('Legacy data appears to be corrupted')
      this.name = 'LegacyDataCorruptedError'
    }
  },
}))

describe('useLegacyImport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('imports a valid file', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'uri', name: 'file.json' }],
    } as unknown as DocumentPicker.DocumentPickerResult)

    const fileContent = JSON.stringify({ version: '1.0', data: { hello: 'world' } })
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(fileContent)
    jest.mocked(decodeLegacyData).mockReturnValue({
      version: '1.0',
      data: { hello: 'world' },
    })

    const { result } = renderHook(() => useLegacyImport())

    await act(async () => {
      await result.current.pickFile()
    })

    act(() => {
      result.current.handlePasswordChange('pw')
    })

    let data
    await act(async () => {
      data = await result.current.handleImport()
    })

    expect(data).toEqual({ version: '1.0', data: { hello: 'world' } })
    expect(result.current.importedData).toEqual({ version: '1.0', data: { hello: 'world' } })
    expect(result.current.error).toBeUndefined()
  })

  it('sets error on invalid JSON', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'uri', name: 'file.json' }],
    } as unknown as DocumentPicker.DocumentPickerResult)
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('not json')

    const { result } = renderHook(() => useLegacyImport())

    await act(async () => {
      await result.current.pickFile()
    })

    act(() => {
      result.current.handlePasswordChange('pw')
    })

    await act(async () => {
      await result.current.handleImport()
    })

    expect(result.current.error).toBe('Invalid file format. Please select a valid export file.')
  })

  it('sets error on wrong password', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'uri', name: 'file.json' }],
    } as unknown as DocumentPicker.DocumentPickerResult)
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('{}')
    jest.mocked(decodeLegacyData).mockImplementation(() => {
      throw new LegacyDataPasswordError()
    })

    const { result } = renderHook(() => useLegacyImport())

    await act(async () => {
      await result.current.pickFile()
    })

    act(() => {
      result.current.handlePasswordChange('pw')
    })

    await act(async () => {
      await result.current.handleImport()
    })

    expect(result.current.error).toBe('Incorrect password. Please try again.')
  })

  it('sets error on format error', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'uri', name: 'file.json' }],
    } as unknown as DocumentPicker.DocumentPickerResult)
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('{}')
    jest.mocked(decodeLegacyData).mockImplementation(() => {
      throw new LegacyDataFormatError()
    })

    const { result } = renderHook(() => useLegacyImport())

    await act(async () => {
      await result.current.pickFile()
    })

    act(() => {
      result.current.handlePasswordChange('pw')
    })

    await act(async () => {
      await result.current.handleImport()
    })

    expect(result.current.error).toBe('Invalid file format. Please select a valid export file.')
  })

  it('sets error on corrupted data error', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'uri', name: 'file.json' }],
    } as unknown as DocumentPicker.DocumentPickerResult)
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('{}')
    jest.mocked(decodeLegacyData).mockImplementation(() => {
      throw new LegacyDataCorruptedError()
    })

    const { result } = renderHook(() => useLegacyImport())

    await act(async () => {
      await result.current.pickFile()
    })

    act(() => {
      result.current.handlePasswordChange('pw')
    })

    await act(async () => {
      await result.current.handleImport()
    })

    expect(result.current.error).toBe('Invalid file format. Please select a valid export file.')
  })

  it('sets generic error for unknown errors', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'uri', name: 'file.json' }],
    } as unknown as DocumentPicker.DocumentPickerResult)
    jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue('{}')
    jest.mocked(decodeLegacyData).mockImplementation(() => {
      throw new Error('Unknown error')
    })

    const { result } = renderHook(() => useLegacyImport())

    await act(async () => {
      await result.current.pickFile()
    })

    act(() => {
      result.current.handlePasswordChange('pw')
    })

    await act(async () => {
      await result.current.handleImport()
    })

    expect(result.current.error).toBe('Failed to import data. Please check your file and password.')
  })
})
