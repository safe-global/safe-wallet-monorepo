import { useCallback } from 'react'
import { MakeASwapButton, SendTokensButton, TxBuilderButton } from '@/components/tx-flow/common/TxButton'
import { Typography } from '@safe-global/views/components/ui/typography'
import useSetScopedTxFlow from '@/components/tx-flow/safe-scope/useSetScopedTxFlow'
import TokenTransferFlow from '../TokenTransfer'
import { ProgressBar } from '@safe-global/views/components/common/ProgressBar'
import ChainIndicator from '@/components/common/ChainIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import NewTxIcon from '@/public/images/transactions/new-tx.svg'
import { HypernativeFeature } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'

import css from './styles.module.css'

const NewTxFlow = () => {
  // Opened from a Space, the flow is scoped to the picked Safe: the next step must stay in that scope
  const setTxFlow = useSetScopedTxFlow()
  const hn = useLoadFeature(HypernativeFeature)
  const isDarkMode = useDarkMode()

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
            /* overflow-hidden so the square-ended ProgressBar is clipped to the corner radius, as
               TxLayoutBase's header does — without it the bar juts past the rounded top-left. */
            className={`relative grid grid-cols-1 overflow-hidden rounded-xl bg-card shadow-sm md:grid-cols-12 ${css.surface}`}
          >
            <div className={`md:col-span-12 ${css.progressBar}`}>
              <ProgressBar value={progress} color={isDarkMode ? 'primary' : 'secondary'} />
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
