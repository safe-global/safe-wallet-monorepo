import { useContext, useEffect } from 'react'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { createTokenTransferParams } from '@/services/tx/tokenTransferParams'
import { createMultiSendCallOnlyTx } from '@/services/tx/tx-sender'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import { SafeTxContext } from '../../SafeTxProvider'
import type { TokenTransferParams } from './types'

const DEBOUNCE_MS = 300

/**
 * Builds the safeTx for a token transfer from live (debounced) form values and writes it to
 * SafeTxContext, so the decoded preview and hashes recompute as the user types — no step change.
 *
 * Relocated from ReviewTokenTransfer's effect, which only ran once form data was committed.
 */
export const useTokenTransferSafeTx = (recipients: TokenTransferParams[], txNonce?: number) => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const [balances] = useTrustedTokenBalances()
  const debouncedRecipients = useDebounce(recipients, DEBOUNCE_MS)

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [txNonce, setNonce])

  useEffect(() => {
    if (!balances) return

    const calls = debouncedRecipients
      .map((recipient) => {
        const token = balances.items.find((item) => sameAddress(item.tokenInfo.address, recipient.tokenAddress))
        if (!token || !recipient.recipient || !recipient.amount) return
        return createTokenTransferParams(
          recipient.recipient,
          recipient.amount,
          token.tokenInfo.decimals,
          recipient.tokenAddress,
        )
      })
      .filter((transfer): transfer is MetaTransactionData => !!transfer)

    if (calls.length === 0) {
      setSafeTx(undefined)
      return
    }

    setSafeTxError(undefined)
    createMultiSendCallOnlyTx(calls).then(setSafeTx).catch(setSafeTxError)
  }, [debouncedRecipients, balances, setSafeTx, setSafeTxError])
}
