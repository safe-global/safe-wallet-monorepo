import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { ProgressBar } from '@/components/common/ProgressBar'
import type ChainIndicator from '@/components/common/ChainIndicator'
import NewTxIcon from '@/public/images/transactions/new-tx.svg'

import css from './styles.module.css'

export type NewTxViewProps = {
  progress: number
  isDarkMode: boolean
  renderChainIndicator: (props: ComponentProps<typeof ChainIndicator>) => ReactNode
  hnBanner: ReactNode
  sendTokensButton: ReactNode
  swapButton: ReactNode
  txBuilderButton: ReactNode
}

export const NewTxView = ({
  progress,
  isDarkMode,
  renderChainIndicator,
  hnBanner,
  sendTokensButton,
  swapButton,
  txBuilderButton,
}: NewTxViewProps): ReactElement => {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 ${css.container}`}>
      <div className="flex justify-center">
        {/* Alignment of `TxLayout` */}
        <div className="flex w-full flex-col md:w-11/12">
          {renderChainIndicator({ inline: true, className: css.chain })}

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

              {hnBanner}

              {sendTokensButton}
              {swapButton}

              <Typography variant="h4" className={`mt-6 ${css.type}`}>
                Interact with contracts
              </Typography>

              {txBuilderButton}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
