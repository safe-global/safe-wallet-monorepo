import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'

import { SafeFeature } from '@safe-global/protocol-kit'
import { hasSafeFeature } from '@/utils/safe-versions'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveGuardFlow } from '@/components/tx-flow/flows'
import {
  GuardDisplayView,
  TransactionGuardsView,
} from '@views/components/settings/TransactionGuards/TransactionGuardsView'

const GuardDisplay = ({ guardAddress, chainId }: { guardAddress: string; chainId: string }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <GuardDisplayView
      addressInfo={
        <EthHashInfo shortAddress={false} address={guardAddress} showCopyButton hasExplorer chainId={chainId} />
      }
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      onRemove={() => setTxFlow(<RemoveGuardFlow address={guardAddress} />)}
    />
  )
}

const TransactionGuards = () => {
  const { safe, safeLoaded } = useSafeInfo()

  const isVersionWithGuards = safeLoaded && hasSafeFeature(SafeFeature.SAFE_TX_GUARDS, safe.version)

  if (!isVersionWithGuards) {
    return null
  }

  return (
    <TransactionGuardsView
      guard={safe.guard ? <GuardDisplay guardAddress={safe.guard.value} chainId={safe.chainId} /> : undefined}
    />
  )
}

export default TransactionGuards
