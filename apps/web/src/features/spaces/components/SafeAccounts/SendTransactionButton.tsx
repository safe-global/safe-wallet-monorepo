import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useContext } from 'react'
import { useRouter } from 'next/router'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { getEip3770ShortName } from '@safe-global/utils/utils/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useWallet from '@/hooks/wallets/useWallet'
import { isOwner } from '@/utils/transaction-guards'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { trackEvent } from '@/services/analytics'
import { gtmSetSafeAddress } from '@/services/analytics/gtm'
import { SendTransactionButtonView } from '@views/features/spaces/components/SafeAccounts/SendTransactionButtonView'

const SendTransactionButton = ({ safe }: { safe: SafeOverview }) => {
  const router = useRouter()
  const wallet = useWallet()
  const canSend = isOwner(safe.owners as AddressInfo[], wallet?.address)

  const { setTxFlow } = useContext(TxModalContext)

  const setActiveSafe = async () => {
    const shortname = getEip3770ShortName(safe.chainId)
    if (!shortname) return

    await router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        safe: `${shortname}:${safe.address.value}`,
        chain: shortname,
      },
    })
  }

  const resetActiveSafe = async () => {
    await router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        safe: undefined,
        chain: undefined,
      },
    })
  }

  const onNewTxClick = async () => {
    await setActiveSafe()
    // We have to set it explicitly otherwise its missing in the trackEvent below
    gtmSetSafeAddress(safe.address.value)
    trackEvent(SPACE_EVENTS.CREATE_SPACE_TX, {
      [MixpanelEventParams.CHAIN_ID]: safe.chainId,
      [MixpanelEventParams.SAFE_ADDRESS]: safe.address.value,
    })

    setTxFlow(<TokenTransferFlow />, resetActiveSafe, false)
  }

  return <SendTransactionButtonView canSend={canSend} onClick={onNewTxClick} />
}

export default SendTransactionButton
