import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import ExternalLink from '@/components/common/ExternalLink'
import { RemoveModuleFlow } from '@/components/tx-flow/flows'
import DeleteIcon from '@/public/images/common/delete.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveRecoveryFlow } from '@/components/tx-flow/flows'
import { RecoveryFeature, useRecovery } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import SettingsCard from '../SettingsCard'

import css from '../TransactionGuards/styles.module.css'

const NoModules = () => {
  return <Typography className="mt-4 text-muted-foreground">No modules enabled</Typography>
}

const ModuleDisplay = ({ moduleAddress, chainId, name }: { moduleAddress: string; chainId: string; name?: string }) => {
  const { setTxFlow } = useContext(TxModalContext)
  const [recovery] = useRecovery()
  const { selectDelayModifierByAddress, $isReady } = useLoadFeature(RecoveryFeature)
  const delayModifier = recovery && selectDelayModifierByAddress?.(recovery, moduleAddress)

  const onRemove = () => {
    if (delayModifier) {
      setTxFlow(<RemoveRecoveryFlow delayModifier={delayModifier} />)
    } else {
      setTxFlow(<RemoveModuleFlow address={moduleAddress} />)
    }
  }

  return (
    <div className={css.guardDisplay}>
      <EthHashInfo
        name={name}
        shortAddress={false}
        address={moduleAddress}
        showCopyButton
        chainId={chainId}
        hasExplorer
      />
      <CheckWallet>
        {(isOk) => (
          <Button
            data-testid="module-remove-btn"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={!isOk || !$isReady}
            title="Remove module"
          >
            <DeleteIcon className="size-4 text-destructive" />
          </Button>
        )}
      </CheckWallet>
    </div>
  )
}

const SafeModules = () => {
  const { safe } = useSafeInfo()
  const safeModules = safe.modules || []

  return (
    <SettingsCard title="Safe modules">
      <div>
        <Typography>
          Modules allow you to customize the access-control logic of your Safe account. Modules are potentially risky,
          so make sure to only use modules from trusted sources. Learn more about modules{' '}
          <ExternalLink href="https://help.safe.global/articles/5490514177-What-is-a-module?">here</ExternalLink>
        </Typography>
        {safeModules.length === 0 ? (
          <NoModules />
        ) : (
          safeModules.map((module) => (
            <ModuleDisplay
              key={module.value}
              chainId={safe.chainId}
              moduleAddress={module.value}
              name={module.name || undefined}
            />
          ))
        )}
      </div>
    </SettingsCard>
  )
}

export default SafeModules
