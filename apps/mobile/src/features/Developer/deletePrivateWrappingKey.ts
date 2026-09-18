import { NativeModules, Platform } from 'react-native'
import { isAddress } from 'ethers'

type DebugDeviceCrypto = {
  debugDeletePrivateWrappingKey?: (alias: string) => Promise<{ publicKeyCount: number }>
}

export const deletePrivateWrappingKey = async (address: string): Promise<{ publicKeyCount: number }> => {
  if (Platform.OS !== 'ios') {
    throw new Error('This experiment is only available on iOS.')
  }
  if (!isAddress(address)) {
    throw new Error('Select a valid signer address.')
  }

  const nativeCrypto: DebugDeviceCrypto | undefined = NativeModules.DeviceCrypto
  if (!nativeCrypto?.debugDeletePrivateWrappingKey) {
    throw new Error('Install a new native iOS build containing the wrapping-key debug action.')
  }

  return nativeCrypto.debugDeletePrivateWrappingKey(`signer_address_${address}`)
}
