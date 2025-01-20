import ChainIndicator from '@/components/common/ChainIndicator'
import { ProgressBar } from '@/components/common/ProgressBar'
import { MakeASwapButton, SendTokensButton, TxBuilderButton } from '@/components/tx-flow/common/TxButton'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import NewTxIcon from '@/public/images/transactions/new-tx.svg'
import { Container, Grid, Paper, Typography } from '@mui/material'
import { useCallback, useContext } from 'react'
import { TxModalContext } from '../../'
import TokenTransferFlow from '../TokenTransfer'

import useIsSafenetEnabled from '@/hooks/useIsSafenetEnabled'
import SafenetTokenTransfersFlow from '../SafenetTokenTransfers'
import css from './styles.module.css'

const NewTxFlow = () => {
  const txBuilder = useTxBuilderApp()
  const { setTxFlow } = useContext(TxModalContext)
  const isSafenetEnabled = useIsSafenetEnabled()

  const onTokensClick = useCallback(() => {
    if (isSafenetEnabled) {
      setTxFlow(<SafenetTokenTransfersFlow />)
      return
    }
    setTxFlow(<TokenTransferFlow />)
  }, [setTxFlow, isSafenetEnabled])

  const progress = 10

  return (
    <Container className={css.container}>
      <Grid
        container
        sx={{
          justifyContent: 'center',
        }}
      >
        {/* Alignment of `TxLayout` */}
        <Grid
          item
          xs={12}
          md={11}
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChainIndicator inline className={css.chain} />

          <Grid container component={Paper}>
            <Grid item xs={12} className={css.progressBar}>
              <ProgressBar value={progress} />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              className={css.pane}
              sx={{
                gap: 3,
              }}
            >
              <div className={css.globs}>
                <NewTxIcon />
              </div>

              <Typography variant="h1" className={css.title}>
                New transaction
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              md={5}
              className={css.pane}
              sx={{
                gap: 2,
              }}
            >
              <Typography variant="h4" className={css.type}>
                Manage assets
              </Typography>

              <SendTokensButton onClick={onTokensClick} />
              <MakeASwapButton />

              {txBuilder?.app && (
                <>
                  <Typography
                    variant="h4"
                    className={css.type}
                    sx={{
                      mt: 3,
                    }}
                  >
                    Interact with contracts
                  </Typography>

                  <TxBuilderButton />
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}

export default NewTxFlow
