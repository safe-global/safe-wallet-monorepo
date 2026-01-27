import { useIsCounterfactualSafe, CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { type ReactElement, useContext } from 'react'
import Button from '@mui/material/Button'
import { OVERVIEW_EVENTS, trackEvent, MixpanelEventParams } from '@/services/analytics'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'

const NewTxButton = (): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const { ActivateAccountButton } = useLoadFeature(CounterfactualFeature)

  const onClick = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
    trackEvent(
      { ...OVERVIEW_EVENTS.NEW_TRANSACTION, label: 'sidebar' },
      { [MixpanelEventParams.SIDEBAR_ELEMENT]: 'New Transaction' },
    )
  }

  if (isCounterfactualSafe) {
    return <ActivateAccountButton />
  }

  return (
    <CheckWallet allowSpendingLimit>
      {(isOk) => (
        <Button
          data-testid="new-tx-btn"
          onClick={onClick}
          variant="contained"
          size="small"
          disabled={!isOk}
          fullWidth
          disableElevation
          sx={{ py: 1.3 }}
        >
          New transaction
        </Button>
      )}
    </CheckWallet>
  )
}

export default NewTxButton
