import { act } from '@/src/tests/test-utils'
import { createMnemonicAccount, getPrivateKey, storePrivateKey } from './useSign'
import { HDNodeWallet, Wallet } from 'ethers'
import * as Keychain from 'react-native-keychain'
import DeviceCrypto from 'react-native-device-crypto'

describe('useSign', () => {
  it('should store the private key given a private key', async () => {
    const { privateKey } = Wallet.createRandom()
    const spy = jest.spyOn(Keychain, 'setGenericPassword')
    const asymmetricKeySpy = jest.spyOn(DeviceCrypto, 'getOrCreateAsymmetricKey')
    const encryptSpy = jest.spyOn(DeviceCrypto, 'encrypt')

    await act(async () => {
      await storePrivateKey('userId', privateKey)
    })

    expect(asymmetricKeySpy).toHaveBeenCalledWith('userId', { accessLevel: 2, invalidateOnNewBiometry: true })
    expect(encryptSpy).toHaveBeenCalledWith('userId', privateKey, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Saving key',
      biometryDescription: 'Please authenticate yourself',
    })
    expect(spy).toHaveBeenCalledWith(
      'signer_address',
      JSON.stringify({ encryptyedPassword: 'encryptedText', iv: `${privateKey}000` }),
      {
        accessControl: 'BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE',
        accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
        service: 'signer_address_userId',
      },
    )
  })

  it('should decrypt and get the stored private key after it is encrypted', async () => {
    const { privateKey } = Wallet.createRandom()
    const spy = jest.spyOn(Keychain, 'setGenericPassword')
    let returnedKey = null

    // To generate the iv and wait till the hook re-renders
    await act(async () => {
      await storePrivateKey('userId', privateKey)
    })

    await act(async () => {
      returnedKey = await getPrivateKey('userId')
    })

    expect(spy).toHaveBeenCalledWith(
      'signer_address',
      JSON.stringify({ encryptyedPassword: 'encryptedText', iv: `${privateKey}000` }),
      {
        accessControl: 'BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE',
        accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
        service: 'signer_address_userId',
      },
    )
    expect(returnedKey).toBe(privateKey)
  })

  it('should import a wallet when given a mnemonic phrase', async () => {
    const { mnemonic, privateKey } = Wallet.createRandom()

    // To generate the iv and wait till the hook re-renders
    await act(async () => {
      const wallet = await createMnemonicAccount(mnemonic?.phrase as string)

      expect(wallet).toBeInstanceOf(HDNodeWallet)
      expect(wallet?.privateKey).toBe(privateKey)
    })
  })
})
