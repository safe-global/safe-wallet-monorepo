import { Button, CardActions, Divider, Typography } from '@mui/material'
import { useContext, type ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import TxCard from '../../common/TxCard'
import type { RecoveryFlowProps } from '.'

import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxFlowContext } from '../../TxFlowProvider'

export function RemoveRecoveryFlowOverview({ delayModifier }: RecoveryFlowProps): ReactElement {
  const { onNext } = useContext(TxFlowContext)
  return (
    <TxCard>
      <Typography variant="body2">
        This transaction will remove the recovery module from your Safe Account. You will no longer be able to recover
        your Safe Account.
      </Typography>

      <Typography variant="body2">
        This Recoverer will not be able to initiate the recovery process once this transaction is executed.
      </Typography>

      <div data-testid="remove-recoverer-section">
        <Typography variant="body2" color="text.secondary" mb={1}>
          Removing Recoverer
        </Typography>

        {delayModifier.recoverers.map((recoverer) => (
          <EthHashInfo
            avatarSize={32}
            key={recoverer}
            shortAddress={false}
            address={recoverer}
            hasExplorer
            showCopyButton
          />
        ))}
      </div>

      <Divider className={commonCss.nestedDivider} />

      <CardActions sx={{ mt: '0 !important' }}>
        <Button data-testid="next-btn" variant="contained" onClick={onNext}>
          Next
        </Button>
      </CardActions>
    </TxCard>
  )
}
