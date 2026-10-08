import type { ReactNode } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import { ArrowRight, Check, ExternalLink as ExternalLinkIcon } from 'lucide-react'
import WorkspacesEmptyIllustration from '@/public/images/spaces/workspaces_empty.png'
import WorkspacesEmptyIllustrationDark from '@/public/images/spaces/workspaces_empty_dark.webp'
import SafeMarkIcon from '@/public/images/logo-no-text.svg'
import SafeProLockup from '@/public/images/safe-pro/safe-pro-lockup.svg'
import SafeProLockupDark from '@/public/images/safe-pro/safe-pro-lockup-dark.svg'
import AddIcon from '@/public/images/common/add.svg'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import WelcomeContentCard from '@/components/common/WelcomeContentCard'
import { AppRoutes } from '@/config/routes'
import { PRIVACY_URL, TERMS_URL } from '@safe-global/utils/config/constants'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

type BannerSlotProps = { className: string }

export const AddSpaceButton = ({
  onClick,
  disabled,
  spacesLimit,
  size = 'lg',
  variant = 'default',
  label = 'Create Workspace',
  icon = 'add',
  link = true,
}: {
  onClick?: () => void
  disabled?: boolean
  spacesLimit: number
  size?: 'lg' | 'default'
  variant?: 'default' | 'outline'
  label?: string
  icon?: 'add' | 'arrow'
  /** Off when the click opens a dialog instead of navigating to the onboarding. */
  link?: boolean
}) => {
  const iconSize = size === 'lg' ? 'size-5' : 'size-4'

  const button = (
    <Button
      data-testid="create-space-button"
      variant={variant}
      size={size}
      accentIcon={icon === 'arrow' && variant === 'default'}
      className={cn(
        // eslint-disable-next-line no-restricted-syntax -- bespoke full-height create-workspace CTA sizing from dev's #8271 redesign
        size === 'lg' && 'h-full rounded-lg px-6 py-3 text-base',
        variant === 'outline' && 'hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-50 grayscale',
      )}
      render={disabled ? <span /> : link ? <NextLink href={AppRoutes.welcome.createSpace} /> : undefined}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {icon === 'add' && (
        <AddIcon className={cn(variant === 'default' ? 'fill-primary-foreground' : 'fill-foreground', iconSize)} />
      )}
      {label}
      {icon === 'arrow' && <ArrowRight className={iconSize} />}
    </Button>
  )

  if (!disabled) return button

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>Limit of {spacesLimit} Workspaces reached</TooltipContent>
    </Tooltip>
  )
}

const termsLinkClassName = 'underline underline-offset-2'

export type SignedOutStateViewProps = {
  isDarkMode: boolean
  isSafeProAnnouncementEnabled: boolean
  isSafePro: boolean
  safeProUserTermsUrl: string
  renderSafeProBanner: (props: BannerSlotProps) => ReactNode
  renderWorkspaceBanner: (props: BannerSlotProps) => ReactNode
  signInOptions: ReactNode
}

export const SignedOutStateView = ({
  isDarkMode,
  isSafeProAnnouncementEnabled,
  isSafePro,
  safeProUserTermsUrl,
  renderSafeProBanner,
  renderWorkspaceBanner,
  signInOptions,
}: SignedOutStateViewProps) => {
  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      {/* The page keeps its Topbar + Accounts/Workspaces tabs, so the sign-in
          card renders inline rather than as a full-screen takeover. */}
      <div
        className={cn(
          'relative flex items-center justify-center pb-10',
          isSafeProAnnouncementEnabled ? 'pt-0' : 'pt-10',
        )}
      >
        <div className={cn('flex w-full flex-col items-center', isSafePro ? 'max-w-116' : 'max-w-110')}>
          {isSafeProAnnouncementEnabled
            ? renderSafeProBanner({ className: 'mb-4' })
            : renderWorkspaceBanner({ className: 'mb-3' })}

          <div className="relative w-full">
            <div className="relative w-full rounded-lg bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="mx-auto mb-6 flex h-10 items-center justify-center text-foreground">
                {/* The Pro brand stays once Safe Pro exists, banner or not. */}
                {isSafeProAnnouncementEnabled || isSafePro ? (
                  isDarkMode ? (
                    <SafeProLockupDark className="h-10 w-auto" />
                  ) : (
                    <SafeProLockup className="h-10 w-auto" />
                  )
                ) : (
                  <SafeMarkIcon className="size-10" />
                )}
              </div>

              <Typography variant="h3" className={cn('text-center', isSafePro ? 'mb-4' : 'mb-6')}>
                Sign in to your Workspace
              </Typography>

              {isSafePro && (
                <p className="mb-6 text-center text-xs leading-[18px] text-muted-foreground">
                  By continuing you accept the{' '}
                  <Link
                    variant="muted"
                    href={safeProUserTermsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={termsLinkClassName}
                  >
                    Safe Pro User Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    variant="muted"
                    href={PRIVACY_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cn(termsLinkClassName, 'whitespace-nowrap')}
                  >
                    Privacy Policy. <ExternalLinkIcon className="ml-0.5 inline size-4 align-text-bottom" />
                  </Link>
                </p>
              )}

              {signInOptions}
            </div>
          </div>

          {!isSafePro && (
            <p className="mt-4 text-center text-xs leading-[18px] text-muted-foreground">
              By continuing, you agree to the{' '}
              <Link
                variant="muted"
                href={TERMS_URL}
                target="_blank"
                rel="noreferrer noopener"
                className={termsLinkClassName}
              >
                Terms
              </Link>{' '}
              and{' '}
              <Link
                variant="muted"
                href={PRIVACY_URL}
                target="_blank"
                rel="noreferrer noopener"
                className={termsLinkClassName}
              >
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const WORKSPACE_BENEFITS = [
  'Organize multiple Safe accounts in one place',
  'Invite members and manage their roles',
  'Share an address book across your team',
]

export type NoSpacesStateViewProps = {
  isAtLimit: boolean
  spacesLimit: number
  isDarkMode: boolean
  isSafePro: boolean
  onCreateClick: () => void
  onInfoOpen: () => void
  infoModal: ReactNode
}

export const NoSpacesStateView = ({
  isAtLimit,
  spacesLimit,
  isDarkMode,
  isSafePro,
  onCreateClick,
  onInfoOpen,
  infoModal,
}: NoSpacesStateViewProps) => {
  return (
    <>
      <Card
        size="none"
        // eslint-disable-next-line no-restricted-syntax -- Figma's 32px corner has no Card `radius` option
        className="w-full rounded-4xl p-1 text-center"
      >
        <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-t-[calc(2rem-4px)] bg-muted p-8 text-left before:absolute before:top-[72%] before:-left-16 before:size-96 before:-translate-y-1/2 before:rounded-full before:bg-[var(--color-static-text-brand)] before:opacity-45 before:blur-3xl md:flex-row md:items-end md:gap-16">
          <div className="relative flex shrink-0 flex-col gap-4 md:self-center">
            {WORKSPACE_BENEFITS.map((benefit) => (
              <div key={benefit} className="flex flex-row items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-light-hover)]">
                  <Check className="size-4 text-badge-dot-success" strokeWidth={1.5} />
                </div>
                <Typography variant="paragraph-large" className="font-medium whitespace-nowrap">
                  {benefit}
                </Typography>
              </div>
            ))}
          </div>

          <Image
            src={isDarkMode ? WorkspacesEmptyIllustrationDark : WorkspacesEmptyIllustration}
            alt="Workspace dashboard showing accounts grouped by Workspace"
            className="relative -my-8 h-auto w-full min-w-0 md:-mr-8 md:w-[60%]"
          />
        </div>

        <div className="flex flex-col items-center gap-6 p-8">
          <Typography variant="h3">Collaborate on your Safe accounts with your team.</Typography>

          <div className="flex flex-col items-center gap-4">
            <div className="h-12">
              <AddSpaceButton
                label={isSafePro ? 'Get Safe Pro' : 'Create your first Workspace'}
                icon="arrow"
                disabled={isAtLimit}
                spacesLimit={spacesLimit}
                link
                onClick={onCreateClick}
              />
            </div>

            <Link variant="muted" className="text-sm underline" onClick={() => onInfoOpen()} href="#">
              What are Workspaces?
            </Link>
          </div>
        </div>
      </Card>
      {infoModal}
    </>
  )
}

export type SpacesListViewProps = {
  status: 'loading' | 'signed-out' | 'error' | 'list' | 'empty'
  accountsNavigation: ReactNode
  signedOutState: ReactNode
  noSpacesState: ReactNode
  isSafeProAnnouncementEnabled: boolean
  renderSafeProWorkspacesBanner: (props: BannerSlotProps) => ReactNode
  isAtSpacesLimit: boolean
  spacesLimit: number
  onAddSpaceClick: () => void
  onRetry: () => void
  pendingInviteBanners: ReactNode
  spaceRows: ReactNode
}

export const SpacesListView = ({
  status,
  accountsNavigation,
  signedOutState,
  noSpacesState,
  isSafeProAnnouncementEnabled,
  renderSafeProWorkspacesBanner,
  isAtSpacesLimit,
  spacesLimit,
  onAddSpaceClick,
  onRetry,
  pendingInviteBanners,
  spaceRows,
}: SpacesListViewProps) => {
  return (
    <div className={css.container}>
      <div className={css.mySpaces}>
        <div className={css.spacesHeader}>{accountsNavigation}</div>

        {status === 'loading' ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : status === 'signed-out' ? (
          signedOutState
        ) : status === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Typography color="muted">Couldn&apos;t load your Workspaces. Try again, or contact support.</Typography>
            <Button variant="outline" onClick={() => onRetry()}>
              Try again
            </Button>
          </div>
        ) : status === 'list' ? (
          <>
            {isSafeProAnnouncementEnabled && renderSafeProWorkspacesBanner({ className: 'mb-4' })}
            <WelcomeContentCard className="flex flex-col gap-4">
              <div className="flex justify-end">
                <AddSpaceButton
                  size="default"
                  variant="outline"
                  label="Create"
                  disabled={isAtSpacesLimit}
                  spacesLimit={spacesLimit}
                  onClick={onAddSpaceClick}
                />
              </div>

              {pendingInviteBanners}

              <div className="rounded-lg border border-border bg-card px-4 py-1" data-testid="org-list">
                {spaceRows}
              </div>
            </WelcomeContentCard>
          </>
        ) : (
          <>
            {isSafeProAnnouncementEnabled && renderSafeProWorkspacesBanner({ className: 'mb-4' })}
            {pendingInviteBanners}
            {noSpacesState}
          </>
        )}
      </div>
    </div>
  )
}
