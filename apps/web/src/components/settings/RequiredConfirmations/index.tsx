import { ChangeThresholdFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { RequiredConfirmationView } from '@views/components/settings/RequiredConfirmations/RequiredConfirmationView'

export const RequiredConfirmation = ({ threshold, owners }: { threshold: number; owners: number }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <RequiredConfirmationView
      threshold={threshold}
      owners={owners}
      renderCheckWallet={(render) => <CheckWallet>{render}</CheckWallet>}
      onChange={() => setTxFlow(<ChangeThresholdFlow />)}
    />
  )
}
