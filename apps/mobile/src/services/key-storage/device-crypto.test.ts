const mockNativeDeleteKey = jest.fn<Promise<boolean>, [string]>()
const mockNativeAuthenticate = jest.fn()

jest.mock('react-native', () => ({
  NativeModules: { DeviceCrypto: { deleteKey: mockNativeDeleteKey, authenticateWithBiometry: mockNativeAuthenticate } },
}))

const DeviceCrypto =
  jest.requireActual<typeof import('react-native-device-crypto')>('react-native-device-crypto').default

describe('device crypto native deletion bridge', () => {
  beforeEach(() => {
    mockNativeDeleteKey.mockReset()
    mockNativeAuthenticate.mockReset()
  })

  it('forwards biometric prompts to native authentication', async () => {
    mockNativeAuthenticate.mockResolvedValue(true)
    const options = {
      biometryTitle: '',
      biometrySubTitle: '',
      biometryDescription: 'Remove signer',
    }

    await expect(DeviceCrypto.authenticateWithBiometry(options)).resolves.toBe(true)
    expect(mockNativeAuthenticate).toHaveBeenCalledWith(options)
  })

  it('preserves structured native authentication errors', async () => {
    const error = Object.assign(new Error('localized'), { code: 'E_AUTHENTICATION_-8' })
    mockNativeAuthenticate.mockRejectedValue(error)

    await expect(
      DeviceCrypto.authenticateWithBiometry({ biometryTitle: '', biometrySubTitle: '', biometryDescription: '' }),
    ).rejects.toBe(error)
  })

  it('waits for native deletion to finish', async () => {
    let finishDeletion!: (result: boolean) => void
    mockNativeDeleteKey.mockReturnValue(
      new Promise((resolve) => {
        finishDeletion = resolve
      }),
    )
    const completed = jest.fn()

    const deleting = DeviceCrypto.deleteKey('test-alias').then(completed)
    await Promise.resolve()
    await Promise.resolve()
    expect(completed).not.toHaveBeenCalled()

    finishDeletion(true)
    await deleting
    expect(completed).toHaveBeenCalledWith(true)
  })

  it('propagates native deletion failures', async () => {
    const error = Object.assign(new Error('Status: -25293'), { code: 'E_DELETE_PRIVATE_KEY' })
    mockNativeDeleteKey.mockRejectedValueOnce(error)
    await expect(DeviceCrypto.deleteKey('test-alias')).rejects.toBe(error)
  })

  it('does not turn a native false result into success', async () => {
    mockNativeDeleteKey.mockResolvedValueOnce(false)
    await expect(DeviceCrypto.deleteKey('test-alias')).resolves.toBe(false)
  })
})
