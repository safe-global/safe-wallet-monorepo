import type { FormEvent, ReactElement, ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ExternalLink from '@/components/common/ExternalLink'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { AdminOnlyWorkspaceTooltip } from '@views/features/spaces/components/AdminOnlyWorkspaceTooltip'
import { ArrowLeft, Info, Plus, Settings2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { SearchInput } from '@/components/ui/search-input'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { cn } from '@/utils/cn'
import SelectedCounter, { safeLimitTooltip } from '@views/features/spaces/components/SelectedCounter'
import SafeLimitError from '@views/features/spaces/components/SelectedCounter/SafeLimitError'
import { Link } from '@/components/ui/link'
import type { SafeLimit } from '@/utils/spaces'

const SCROLL_REGION_CLASS =
  'overflow-y-auto overscroll-y-none pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'

export type AddAccountsViewStep = 'select' | 'manage' | 'name'

export type AddAccountsViewProps = {
  showTrigger: boolean
  isAdmin: boolean
  buttonVariant: 'outline' | 'default'
  buttonLabel: string
  onTriggerClick: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  view: AddAccountsViewStep
  onManageBack: () => void
  renderManageContent: (props: { secondaryLabel: 'Cancel' | 'Back' }) => ReactNode
  onSelectStep: () => void
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  nameFields: ReactNode
  onOpenManage: () => void
  isListEmpty: boolean
  hasNoSearchMatch: boolean
  hasWallet: boolean
  seatCount: number
  limit: SafeLimit
  isAtLimit: boolean
  isSafePro: boolean
  tierName?: string
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  renderSafesTable: (props: { disabledReason: string }) => ReactNode
  isLimitError: boolean
  onRetryLimit: () => void
  submitError?: string
  plansHref: string
  addManually: ReactElement
  submitDisabled: boolean
  isSubmitting: boolean
}

export const AddAccountsView = ({
  showTrigger,
  isAdmin,
  buttonVariant,
  buttonLabel,
  onTriggerClick,
  isOpen,
  onOpenChange,
  view,
  onManageBack,
  renderManageContent,
  onSelectStep,
  onSubmit,
  nameFields,
  onOpenManage,
  isListEmpty,
  hasNoSearchMatch,
  hasWallet,
  seatCount,
  limit,
  isAtLimit,
  isSafePro,
  tierName,
  searchQuery,
  onSearchQueryChange,
  renderSafesTable,
  isLimitError,
  onRetryLimit,
  submitError,
  plansHref,
  addManually,
  submitDisabled,
  isSubmitting,
}: AddAccountsViewProps) => {
  const limitTooltip =
    isSafePro && typeof limit === 'number'
      ? `${tierName ? `Your ${tierName} plan` : 'Your plan'} covers ${limit} Safe accounts.\nAt ${limit}, deselect one to add another. Safe accounts you leave out remain available in My accounts.`
      : safeLimitTooltip(limit)

  const emptyStateMessage = hasWallet
    ? 'No accounts yet — add some via "Manage list", or add one by address below.'
    : 'No saved Safe accounts yet — add one by address below.'

  return (
    <>
      {showTrigger && (
        <AdminOnlyWorkspaceTooltip isAdmin={isAdmin} side="bottom">
          <Button
            size="lg"
            className="font-normal"
            variant={buttonVariant}
            disabled={!isAdmin}
            onClick={onTriggerClick}
            data-testid="add-space-account-button"
          >
            <Plus
              className={cn('size-4', {
                'text-green-500': buttonVariant === 'default',
              })}
            />
            {buttonLabel}
          </Button>
        </AdminOnlyWorkspaceTooltip>
      )}

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {/* eslint-disable-next-line no-restricted-syntax -- bespoke full-height dialog layout preserved from dev's #8271 redesign */}
        <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
          {view === 'manage' ? (
            <>
              {/* eslint-disable-next-line no-restricted-syntax -- bespoke dialog header (back button row + divider) from dev's #8271 redesign */}
              <DialogHeader className="shrink-0 flex-row items-center gap-2 border-b border-border px-6 pb-4 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onManageBack}
                  aria-label="Back"
                  data-testid="manage-trusted-back"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <DialogTitle className="font-bold">Manage my account list</DialogTitle>
              </DialogHeader>

              <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
                {renderManageContent({ secondaryLabel: 'Back' })}
              </div>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line no-restricted-syntax -- bespoke dialog header divider/padding from dev's #8271 redesign */}
              <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
                <div className="flex items-center gap-2">
                  {view === 'name' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onSelectStep}
                      aria-label="Back"
                      data-testid="name-accounts-back"
                    >
                      <ArrowLeft className="size-5" />
                    </Button>
                  )}
                  <DialogTitle className="font-bold">
                    {view === 'name' ? 'Name your Safe accounts' : 'My accounts'}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
                {view === 'name' ? (
                  <div className={cn(SCROLL_REGION_CLASS, 'min-h-0 flex-1')} data-testid="name-accounts-region">
                    {nameFields}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex shrink-0 items-center gap-3 rounded-2xl bg-muted p-4">
                      <Info className="size-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">What are my accounts?</p>
                        <p className="text-sm text-muted-foreground">
                          This list protects you from impersonation. Anyone can create a Safe account listing your
                          address as a signer, so only accounts you&apos;ve confirmed appear here.{' '}
                          <ExternalLink href={HELP_CENTER_URL} noIcon className="underline">
                            Learn more
                          </ExternalLink>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenManage}
                        data-testid="open-manage-trusted-safes"
                        className="shrink-0"
                      >
                        <Settings2 className="size-4" />
                        Manage list
                      </Button>
                    </div>

                    {!isListEmpty && (
                      <div className="mb-3 flex shrink-0 items-center gap-3">
                        <SelectedCounter count={seatCount} limit={limit} isAtLimit={isAtLimit} tooltip={limitTooltip} />
                        <SearchInput
                          className="flex-1"
                          placeholder="by name, address or network"
                          aria-label="Search Safe accounts by name, address or network"
                          autoComplete="off"
                          value={searchQuery}
                          onChange={(e) => onSearchQueryChange(e.target.value)}
                          data-testid="add-accounts-search-input"
                        />
                      </div>
                    )}

                    <div
                      className={cn(SCROLL_REGION_CLASS, 'min-h-0 flex-1')}
                      data-testid="add-accounts-safes-list-region"
                    >
                      {isListEmpty ? (
                        <Typography variant="paragraph" align="center" color="muted" className="py-8">
                          {emptyStateMessage}
                        </Typography>
                      ) : hasNoSearchMatch ? (
                        <Typography variant="paragraph" align="center" color="muted" className="py-8">
                          No safes match your search
                        </Typography>
                      ) : (
                        renderSafesTable({ disabledReason: 'This safe is already part of your Workspace' })
                      )}
                    </div>
                  </>
                )}

                {isLimitError && view === 'select' && (
                  <div className="mt-4">
                    <SafeLimitError onRetry={onRetryLimit} />
                  </div>
                )}

                {submitError && (
                  <Alert variant="destructive" className="mt-4 shrink-0">
                    <AlertSeverityIcon variant="destructive" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {isSafePro && isAtLimit && (
                  <Typography variant="paragraph-small" color="muted" align="center" className="mt-4 shrink-0">
                    Need more?{' '}
                    <Link href={plansHref} variant="muted" data-testid="compare-plans-link">
                      Compare plans
                    </Link>
                  </Typography>
                )}

                <div className="mt-4 flex shrink-0 flex-row items-center gap-3">
                  <div className="flex-1">
                    {view === 'name' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={onSelectStep}
                        className="w-full"
                        data-testid="name-accounts-back-button"
                      >
                        Back
                      </Button>
                    ) : (
                      <Track {...SPACE_EVENTS.ADD_ACCOUNT_MANUALLY_MODAL}>{addManually}</Track>
                    )}
                  </div>

                  <Button
                    data-testid="add-accounts-button"
                    type="submit"
                    size="lg"
                    disabled={submitDisabled}
                    className="flex-1"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
