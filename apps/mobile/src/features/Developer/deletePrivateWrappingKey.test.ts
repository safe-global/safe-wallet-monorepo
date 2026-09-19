import { NativeModules, Platform } from 'react-native'
import { faker } from '@faker-js/faker'
import { deletePrivateWrappingKey } from './deletePrivateWrappingKey'

describe('deletePrivateWrappingKey', () => {
  const originalPlatform = Platform.OS
  const originalModule = NativeModules.DeviceCrypto
  const nativeDelete = jest.fn()
  const address = faker.finance.ethereumAddress()

  beforeEach(() => {
    Platform.OS = 'ios'
    NativeModules.DeviceCrypto = { debugDeletePrivateWrappingKey: nativeDelete }
    nativeDelete.mockReset().mockResolvedValue({ publicKeyCount: 1 })
  })

  afterEach(() => {
    Platform.OS = originalPlatform
    NativeModules.DeviceCrypto = originalModule
  })

  it('uses the selected signer alias and awaits the native outcome', async () => {
    await expect(deletePrivateWrappingKey(address)).resolves.toEqual({ publicKeyCount: 1 })
    expect(nativeDelete).toHaveBeenCalledWith(`signer_address_${address}`)
  })

  it('preserves native failures instead of reporting success', async () => {
    const error = new Error('Private key was already absent')
    nativeDelete.mockRejectedValueOnce(error)
    await expect(deletePrivateWrappingKey(address)).rejects.toBe(error)
  })

  it('rejects invalid addresses without calling native deletion', async () => {
    await expect(deletePrivateWrappingKey('delegate-key')).rejects.toThrow('valid signer address')
    expect(nativeDelete).not.toHaveBeenCalled()
  })

  it('rejects Android without calling native deletion', async () => {
    Platform.OS = 'android'
    await expect(deletePrivateWrappingKey(address)).rejects.toThrow('only available on iOS')
    expect(nativeDelete).not.toHaveBeenCalled()
  })

  it('explains when the installed native build lacks the debug method', async () => {
    NativeModules.DeviceCrypto = {}
    await expect(deletePrivateWrappingKey(address)).rejects.toThrow('new native iOS build')
  })
})
