import { type ReactElement, useContext, useMemo } from 'react'

import { DelayModifierRow } from './DelayModifierRow'
import useRecovery from '../../hooks/useRecovery'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import UpsertRecoveryFlow from '@/components/tx-flow/flows/UpsertRecovery'
import {
  RecoverySettingsView,
  SetupRecoveryButtonView,
} from '@views/features/recovery/components/RecoverySettings/RecoverySettingsView'

const EVENT_LABEL = 'settings'

function RecoverySettings(): ReactElement {
  const [recovery] = useRecovery()

  const isRecoveryEnabled = recovery && recovery.length > 0

  const recovererRows = useMemo(() => {
    return recovery?.flatMap((delayModifier) => {
      const { recoverers, delay, expiry } = delayModifier

      return recoverers.map((recoverer) => ({
        recoverer,
        delaySeconds: Number(delay),
        expirySeconds: Number(expiry),
        actions: <DelayModifierRow delayModifier={delayModifier} />,
      }))
    })
  }, [recovery])

  return (
    <RecoverySettingsView
      isRecoveryEnabled={!!isRecoveryEnabled}
      recovererRows={recovererRows}
      setupButton={<SetupRecoveryButton eventLabel={EVENT_LABEL} />}
    />
  )
}

const SetupRecoveryButton = ({ eventLabel }: { eventLabel: string }) => {
  const { setTxFlow } = useContext(TxModalContext)
  return (
    <SetupRecoveryButtonView
      eventLabel={eventLabel}
      onSetup={() => setTxFlow(<UpsertRecoveryFlow />)}
      renderCheckWallet={(children) => <CheckWallet>{children}</CheckWallet>}
    />
  )
}

export default RecoverySettings
