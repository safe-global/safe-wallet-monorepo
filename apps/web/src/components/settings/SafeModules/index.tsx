import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'

import { RemoveModuleFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { RemoveRecoveryFlow } from '@/components/tx-flow/flows'
import { RecoveryFeature, useRecovery } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import { ModuleDisplayView, SafeModulesView } from '@views/components/settings/SafeModules/SafeModulesView'

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
    <ModuleDisplayView
      addressInfo={
        <EthHashInfo
          name={name}
          shortAddress={false}
          address={moduleAddress}
          showCopyButton
          chainId={chainId}
          hasExplorer
        />
      }
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      isReady={$isReady}
      onRemove={onRemove}
    />
  )
}

const SafeModules = () => {
  const { safe } = useSafeInfo()
  const safeModules = safe.modules || []

  return (
    <SafeModulesView
      hasModules={safeModules.length !== 0}
      modules={safeModules.map((module) => (
        <ModuleDisplay
          key={module.value}
          chainId={safe.chainId}
          moduleAddress={module.value}
          name={module.name || undefined}
        />
      ))}
    />
  )
}

export default SafeModules
