import { useContext } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { useRouter } from 'next/router'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'
import css from './styles.module.css'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import { networks } from '@safe-global/protocol-kit/dist/src/utils/eip-3770/config'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useWallet from '@/hooks/wallets/useWallet'
import { isOwner } from '@/utils/transaction-guards'
import type { AddressEx } from '@safe-global/safe-gateway-typescript-sdk'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { gtmSetSafeAddress } from '@/services/analytics/gtm'

type Chains = Record<string, string>

const chains = networks.reduce<Chains>((result, { shortName, chainId }) => {
  result[chainId.toString()] = shortName.toString()
  return result
}, {})

const SendTransactionButton = ({ safe }: { safe: SafeOverview }) => {
  const router = useRouter()
  const wallet = useWallet()
  const canSend = isOwner(safe.owners as AddressEx[], wallet?.address)

  const { setTxFlow } = useContext(TxModalContext)

  const setActiveSafe = async () => {
    const shortname = chains[safe.chainId]

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
    trackEvent(SPACE_EVENTS.CREATE_SPACE_TX)

    setTxFlow(<TokenTransferFlow />, resetActiveSafe, false)
  }

  return (
    <Tooltip placement="top" title={canSend ? 'Send tokens' : 'You are not a signer of this Safe Account'}>
      <span>
        <IconButton className={css.sendButton} size="medium" onClick={onNewTxClick} disabled={!canSend}>
          <ArrowOutwardIcon />
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default SendTransactionButton
