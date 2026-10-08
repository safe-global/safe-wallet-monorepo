import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useState, type ReactElement, type ReactNode } from 'react'
import { Circle as CircleOutlinedIcon } from 'lucide-react'

import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import { Skeleton } from '@/components/ui/skeleton'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import DotIcon from '@/public/images/messages/dot.svg'

import css from './styles.module.css'
import txSignersCss from '@/components/transactions/TxSigners/styles.module.css'

// Icons

const Created = () => <CreatedIcon className={css.icon} />

const Signed = () => <SignedIcon className={css.icon} />

const Dot = () => <DotIcon className={css.dot} />

const shouldHideConfirmations = (msg: MessageItem): boolean => {
  const isConfirmed = msg.status === 'CONFIRMED'

  // Threshold reached or more than 3 confirmations
  return isConfirmed || msg.confirmations.length > 3
}

export type MsgSignersViewProps = {
  msg: MessageItem
  showOnlyConfirmations?: boolean
  showMissingSignatures?: boolean
  backgroundColor?: string
  renderSigner: (signer: { address: string; name?: string | null }) => ReactNode
}

export function MsgSignersView({
  msg,
  showOnlyConfirmations = false,
  showMissingSignatures = false,
  backgroundColor,
  renderSigner,
}: MsgSignersViewProps): ReactElement {
  const [hideConfirmations, setHideConfirmations] = useState<boolean>(shouldHideConfirmations(msg))

  const toggleHide = () => {
    setHideConfirmations((prev) => !prev)
  }

  const { confirmations, confirmationsRequired, confirmationsSubmitted } = msg

  const missingConfirmations = [...new Array(Math.max(0, confirmationsRequired - confirmationsSubmitted))]

  const isConfirmed = msg.status === 'CONFIRMED'

  return (
    <ul className={css.signers}>
      {!showOnlyConfirmations && (
        <li className={css.listItem}>
          <div className={css.listItemIcon}>
            <Created />
          </div>
          <div className={css.listItemText}>
            <Typography variant="paragraph-bold">Created</Typography>
          </div>
        </li>
      )}
      <li className={css.listItem}>
        <div className={css.listItemIcon} style={{ backgroundColor }}>
          <Signed />
        </div>
        <div className={css.listItemText}>
          <Typography variant="paragraph-bold">
            Confirmations{' '}
            <span className={txSignersCss.confirmationsTotal}>
              ({`${confirmationsSubmitted} of ${confirmationsRequired}`})
            </span>
          </Typography>
        </div>
      </li>
      {!hideConfirmations &&
        confirmations.map(({ owner }) => (
          <li key={owner.value} className={css.listItem}>
            <div className={css.listItemIcon} style={{ backgroundColor }}>
              <Dot />
            </div>
            <div className={css.listItemText}>{renderSigner({ address: owner.value, name: owner.name })}</div>
          </li>
        ))}
      {!showOnlyConfirmations && confirmations.length > 0 && (
        <li className={css.listItem}>
          <div className={css.listItemIcon} style={{ backgroundColor }}>
            <Dot />
          </div>
          <div className={css.listItemText}>
            <Link render={<button type="button" />} onClick={toggleHide} className="text-base">
              {hideConfirmations ? 'Show all' : 'Hide all'}
            </Link>
          </div>
        </li>
      )}
      {showMissingSignatures &&
        missingConfirmations.map((_, idx) => (
          <li key={`skeleton${idx}`} className={css.listItem}>
            <div className={css.listItemIcon} style={{ backgroundColor }}>
              <CircleOutlinedIcon className={`${css.dot} text-[var(--color-border-main)]`} />
            </div>
            <div className={css.listItemText}>
              <div className="flex flex-row items-center gap-2">
                <Skeleton className="size-9 rounded-full" />
                <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
                  Confirmation #{idx + 1 + confirmationsSubmitted}
                </Typography>
              </div>
            </div>
          </li>
        ))}
      {isConfirmed && (
        <li className={css.listItem}>
          <div className={css.listItemIcon} style={{ backgroundColor }}>
            <Dot />
          </div>
          <div className={css.listItemText}>Confirmed</div>
        </li>
      )}
    </ul>
  )
}
