import { useCallback, useContext } from 'react'
import { MakeASwapButton, SendTokensButton, TxBuilderButton } from '@/components/tx-flow/common/TxButton'
import { Typography } from '@/components/ui/typography'
import { TxModalContext } from '../../'
import TokenTransferFlow from '../TokenTransfer'
import { ProgressBar } from '@/components/common/ProgressBar'
import ChainIndicator from '@/components/common/ChainIndicator'
import NewTxIcon from '@/public/images/transactions/new-tx.svg'
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

import css from './styles.module.css'

const NewTxFlow = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const hn = useLoadFeature(HypernativeFeature)

  const onTokensClick = useCallback(() => {
    setTxFlow(<TokenTransferFlow />)
  }, [setTxFlow])

  const progress = 10

  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 ${css.container}`}>
      <div className="flex justify-center">
        {/* Alignment of `TxLayout` */}
        <div className="flex w-full flex-col md:w-11/12">
          <ChainIndicator inline className={css.chain} />

          <div
            className={`relative grid grid-cols-1 rounded-xl border border-border bg-card shadow-sm md:grid-cols-12 ${css.surface}`}
          >
            <div className={`md:col-span-12 ${css.progressBar}`}>
              <ProgressBar value={progress} />
            </div>
            <div className={`md:col-span-6 ${css.pane}`}>
              <div className={css.globs}>
                <NewTxIcon />
              </div>

              <Typography variant="h1" className={css.title}>
                New transaction
              </Typography>
            </div>

            <div className={`md:col-span-5 ${css.pane}`} style={{ gap: 'var(--space-2)' }}>
              <Typography variant="h4" className={css.type}>
                Manage assets
              </Typography>

              <hn.HnMiniTxBanner />

              <SendTokensButton onClick={onTokensClick} />
              <MakeASwapButton />

              <Typography variant="h4" className={`mt-6 ${css.type}`}>
                Interact with contracts
              </Typography>

              <TxBuilderButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewTxFlow
