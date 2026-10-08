import type { FormEvent, ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import ExternalLink from '@/components/common/ExternalLink'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'

export type CreateSafeOnNewChainViewProps = {
  open: boolean
  onClose: () => void
  onCancel: () => void
  onSubmit: (e?: FormEvent) => void
  chainIndicator?: ReactNode
  networkInput?: ReactNode
  willStayOutsideSpace: boolean
  spaceSafeLimit?: number | null
  safeCreationDataLoading: boolean
  safeCreationDataError?: Error
  isUnsupportedSafeCreationVersion?: boolean
  noChainsAvailable: boolean
  creationError?: Error
  isSubmitting: boolean
  submitDisabled: boolean
  helpArticleUrl: string
  renderErrorMessage: (props: { level?: 'error' | 'warning' | 'info'; error?: Error; children: ReactNode }) => ReactNode
}

export const CreateSafeOnNewChainView = ({
  open,
  onClose,
  onCancel,
  onSubmit,
  chainIndicator,
  networkInput,
  willStayOutsideSpace,
  spaceSafeLimit,
  safeCreationDataLoading,
  safeCreationDataError,
  isUnsupportedSafeCreationVersion,
  noChainsAvailable,
  creationError,
  isSubmitting,
  submitDisabled,
  helpArticleUrl,
  renderErrorMessage,
}: CreateSafeOnNewChainViewProps) => {
  return (
    <ModalDialog open={open} onClose={onClose} dialogTitle="Add another network" hideChainIndicator>
      <form onSubmit={onSubmit} id="recreate-safe">
        <div className="px-6 py-4" data-testid="add-chain-dialog">
          <div className="flex flex-col gap-4">
            <Typography>Add this Safe to another network with the same address.</Typography>

            {chainIndicator && (
              <div data-testid="added-network" className="rounded-md bg-[var(--color-background-main)] p-4">
                {chainIndicator}
              </div>
            )}

            {renderErrorMessage({
              level: 'info',
              children: (
                <>
                  The Safe will use the initial setup of the copied Safe. Any changes to owners, threshold, modules or
                  the Safe&apos;s version will not be reflected in the copy.
                </>
              ),
            })}

            {willStayOutsideSpace && (
              <div data-testid="space-seat-limit-notice">
                {renderErrorMessage({
                  level: 'info',
                  children: (
                    <>
                      This Workspace is at its limit of {spaceSafeLimit} Safe accounts. The new network will be added in
                      My accounts, outside the Workspace.
                    </>
                  ),
                })}
              </div>
            )}

            {safeCreationDataLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner className="size-10" />
                <Typography variant="paragraph-small">Loading Safe data</Typography>
              </div>
            ) : safeCreationDataError ? (
              renderErrorMessage({
                error: safeCreationDataError,
                level: 'error',
                children: <>Could not determine the Safe creation parameters.</>,
              })
            ) : isUnsupportedSafeCreationVersion ? (
              renderErrorMessage({
                children: (
                  <>This account was created from an outdated mastercopy. Adding another network is not possible.</>
                ),
              })
            ) : noChainsAvailable ? (
              renderErrorMessage({ level: 'error', children: <>This Safe cannot be replayed on any chains.</> })
            ) : (
              <>{networkInput}</>
            )}

            {creationError &&
              renderErrorMessage({
                error: creationError,
                level: 'error',
                children: <>{creationError.message || 'The Safe could not be created with the same address.'}</>,
              })}
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 border-t border-[var(--color-border-light)] px-6 py-4">
          {isUnsupportedSafeCreationVersion ? (
            <>
              <ExternalLink className="grow" href={helpArticleUrl}>
                Read more
              </ExternalLink>
              <Button onClick={onClose}>Got it</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button data-testid="modal-add-network-btn" type="submit" disabled={submitDisabled}>
                {isSubmitting ? <Spinner className="size-5" /> : 'Add network'}
              </Button>
            </>
          )}
        </div>
      </form>
    </ModalDialog>
  )
}
