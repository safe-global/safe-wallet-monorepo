import type { SafeTransaction } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'

import { createTx } from '@/services/tx/tx-sender'
import { gatewayApi } from '@/store/api/gateway'
import { toSupportedFiatCode } from '@/store/api/gateway/gtfFeePreview'
import type { AppDispatch } from '@/store'
import { GELATO_FEE_COLLECTORS } from '../constants'
import { trackError, Errors } from '@/services/exceptions'

export type ResolveFeeParamsArgs = {
  chainId: string
  safeAddress: string
  safeTx: SafeTransaction
  gasToken: string
  numberSignatures: number
  currency?: string
  dispatch: AppDispatch
}

/**
 * Merges the CGW fee-preview fee fields into a SafeTransaction so the first
 * signer's signed payload carries the params Safe's handlePayment() reads on
 * execution. Must run before any signature is applied.
 */
export const resolveFeeParams = async ({
  chainId,
  safeAddress,
  safeTx,
  gasToken,
  numberSignatures,
  currency,
  dispatch,
}: ResolveFeeParamsArgs): Promise<SafeTransaction> => {
  const { to, value, data, operation, nonce } = safeTx.data

  const preview = await dispatch(
    gatewayApi.endpoints.getGtfFeePreview.initiate(
      {
        chainId,
        safeAddress,
        tx: {
          to,
          value,
          data,
          operation,
          gasToken,
          numberSignatures,
          nonce: String(nonce),
          fiatCode: toSupportedFiatCode(currency),
        },
      },
      { forceRefetch: true },
    ),
  ).unwrap()

  const { safeTxGas, baseGas, gasPrice, gasToken: resolvedGasToken, refundReceiver } = preview.txData

  if (!GELATO_FEE_COLLECTORS.some((addr) => sameAddress(addr, refundReceiver))) {
    // Surface to Sentry so a Gelato collector rotation is observable instead of failing
    // silently for users who can't recover from the thrown error below.
    trackError(Errors._821, `Untrusted GTF refundReceiver ${refundReceiver} returned by CGW on chain ${chainId}`)
    throw new Error(`Refusing to sign: untrusted refundReceiver ${refundReceiver} returned by CGW.`)
  }

  return createTx(
    {
      ...safeTx.data,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken: resolvedGasToken,
      refundReceiver,
    },
    nonce,
  )
}
