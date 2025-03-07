import DeviceCrypto from 'react-native-device-crypto'
import * as Keychain from 'react-native-keychain'
import DeviceInfo from 'react-native-device-info'
import { Wallet } from 'ethers'

const getKeychainKey = (userId: string) => `signer_address_${userId}`

export const storePrivateKey = async (userId: string, privateKey: string) => {
  try {
    const isEmulator = await DeviceInfo.isEmulator()
    const keychainKey = getKeychainKey(userId)

    await DeviceCrypto.getOrCreateAsymmetricKey(userId, {
      accessLevel: isEmulator ? 1 : 2,
      invalidateOnNewBiometry: true,
    })

    const encryptyedPrivateKey = await DeviceCrypto.encrypt(userId, privateKey, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Saving key',
      biometryDescription: 'Please authenticate yourself',
    })

    await Keychain.setGenericPassword(
      'signer_address',
      JSON.stringify({
        encryptyedPassword: encryptyedPrivateKey.encryptedText,
        iv: encryptyedPrivateKey.iv,
      }),
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: keychainKey,
      },
    )

    // This enrols the biometry authentication in the device
    await Keychain.getGenericPassword({
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      service: keychainKey,
    })
  } catch (err) {
    console.log(err)
    throw new Error('Failed to store private key')
  }
}

export const getPrivateKey = async (userId: string) => {
  try {
    const keychainKey = getKeychainKey(userId)
    const user = await Keychain.getGenericPassword({
      service: keychainKey,
    })

    if (!user) {
      throw 'user password not found'
    }

    const { encryptyedPassword, iv } = JSON.parse(user.password)
    const decryptedKey = await DeviceCrypto.decrypt(userId, encryptyedPassword, iv, {
      biometryTitle: 'Authenticate',
      biometrySubTitle: 'Signing',
      biometryDescription: 'Authenticate yourself to sign the text',
    })

    return decryptedKey
  } catch (err) {
    console.log(err)
  }
}

export const createMnemonicAccount = async (mnemonic: string) => {
  try {
    if (!mnemonic) {
      return
    }

    return Wallet.fromPhrase(mnemonic)
  } catch (err) {
    console.log(err)
  }
}
