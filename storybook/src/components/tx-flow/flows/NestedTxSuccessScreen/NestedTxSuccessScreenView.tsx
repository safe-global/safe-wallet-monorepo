import type { ReactElement, ReactNode } from 'react'
import type { UrlObject } from 'url'
import type { EthHashInfoProps } from '@/components/common/EthHashInfo/SrcEthHashInfo'
import NestedSafeIcon from '@/public/images/transactions/nestedTx.svg'
import ArrowDownIcon from '@/public/images/common/arrow-down.svg'

import css from './styles.module.css'
import Link from 'next/link'
import ExternalLink from '@/components/common/ExternalLink'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'
import Track from '@/components/common/Track'
import { Typography } from '@/components/ui/typography'
import ErrorMessage from '@/components/tx/ErrorMessage'

export const NestedTxSuccessScreenNotFoundView = (): ReactElement => (
  <ErrorMessage>No transaction data found</ErrorMessage>
)

export type NestedTxSuccessScreenViewProps = {
  parentSafe: { address: string; name?: string }
  currentSafe: { address: string; name?: string }
  href: UrlObject
  renderAddress: (props: EthHashInfoProps) => ReactNode
}

export const NestedTxSuccessScreenView = ({
  parentSafe,
  currentSafe,
  href,
  renderAddress,
}: NestedTxSuccessScreenViewProps): ReactElement => {
  return (
    <div className="mx-auto w-full max-w-[825px] rounded-lg bg-[var(--color-background-paper)] text-center">
      <div className="mt-6 flex flex-col items-center gap-4 p-6">
        <div className={css.icon}>
          <NestedSafeIcon className="size-9" aria-label="Nested Safe" />
        </div>
        <Typography data-testid="transaction-status" variant="h4" className="mt-4">
          A nested transaction was created
        </Typography>
        <Typography variant="paragraph-small" className="mb-6 block">
          Once confirmed and executed this signer transaction will confirm the child Safe&apos;s transaction.
        </Typography>
        <div className="flex w-[70%] flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
              Parent Safe
            </Typography>
            {renderAddress({ address: parentSafe.address, name: parentSafe.name, shortAddress: false })}
          </div>
          <div className="flex flex-row items-center gap-4 pl-2">
            <ArrowDownIcon className="size-6 text-[var(--color-border-main)]" />
            <Typography
              variant="code"
              className="rounded-sm bg-[var(--color-background-main)] px-2 py-0.5 font-mono whitespace-nowrap text-[var(--color-primary-light)]"
            >
              approveHash
            </Typography>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
              Current Safe
            </Typography>
            {renderAddress({ address: currentSafe.address, name: currentSafe.name, shortAddress: false })}
          </div>
        </div>
        <Track {...MODALS_EVENTS.OPEN_PARENT_TX}>
          <Link href={href} passHref legacyBehavior>
            <ExternalLink mode="button">Open the transaction</ExternalLink>
          </Link>
        </Track>
      </div>
    </div>
  )
}
