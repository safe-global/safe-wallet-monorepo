import { makeError } from 'ethers'

const TREZOR_REJECTION_CODE = 'Failure_ActionCancelled'

export function mapTrezorError(payload: { error: string; code?: string }) {
  const isRejection = payload.code === TREZOR_REJECTION_CODE

  if (!isRejection) {
    return makeError(payload.error ?? 'unknown', 'UNKNOWN_ERROR', {
      info: payload,
    })
  }

  return makeError('user rejected action', 'ACTION_REJECTED', {
    action: 'unknown',
    reason: 'rejected',
    info: payload,
  })
}
