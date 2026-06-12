import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { SafeFeature } from '@safe-global/protocol-kit'
import { hasSafeFeature } from '@/utils/safe-versions'
import DeleteIcon from '@/public/images/common/delete.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveGuardFlow } from '@/components/tx-flow/flows'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

const NoTransactionGuard = () => {
  return <Typography className="mt-4 text-muted-foreground">No transaction guard set</Typography>
}

const GuardDisplay = ({ guardAddress, chainId }: { guardAddress: string; chainId: string }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <div className={css.guardDisplay}>
      <EthHashInfo shortAddress={false} address={guardAddress} showCopyButton hasExplorer chainId={chainId} />
      <CheckWallet>
        {(isOk) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTxFlow(<RemoveGuardFlow address={guardAddress} />)}
            disabled={!isOk}
          >
            <DeleteIcon className="size-4 text-destructive" />
          </Button>
        )}
      </CheckWallet>
    </div>
  )
}

const TransactionGuards = () => {
  const { safe, safeLoaded } = useSafeInfo()

  const isVersionWithGuards = safeLoaded && hasSafeFeature(SafeFeature.SAFE_TX_GUARDS, safe.version)

  if (!isVersionWithGuards) {
    return null
  }

  return (
    <div className="rounded-lg bg-[var(--color-background-paper)] p-8">
      <div className="grid grid-cols-1 justify-between gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <Typography variant="h4">Transaction guards</Typography>
        </div>

        <div>
          <div>
            <Typography>
              Transaction guards impose additional constraints that are checked prior to executing a Safe transaction.
              Transaction guards are potentially risky, so make sure to only use transaction guards from trusted
              sources. Learn more about transaction guards{' '}
              <ExternalLink href={HelpCenterArticle.TRANSACTION_GUARD}>here</ExternalLink>.
            </Typography>
            {safe.guard ? (
              <GuardDisplay guardAddress={safe.guard.value} chainId={safe.chainId} />
            ) : (
              <NoTransactionGuard />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionGuards
