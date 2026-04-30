export type {
  ExtractedPasskeyData,
  PasskeyArgType,
  PasskeyCoordinates,
  PasskeyGetFn,
  PasskeyMetadata,
  PasskeyStorage,
  RelayClient,
  RelayTaskStatus,
} from './types'
export { IdentityDeploymentError, UnsupportedChainError } from './types'

export {
  buildPasskeyArg,
  deriveIdentityAddress,
  isIdentityDeployed,
  resolveIdentityForChain,
  resolveVerifierAddress,
} from './identity'
export { awaitDeployment, deployIdentity, encodeCreateSignerCall, RelayStatus } from './deployment'
export type { SignSafeTxWithPasskeyArgs, SignSafeTxWithPasskeyResult } from './signing'
export { signSafeTxWithPasskey } from './signing'
