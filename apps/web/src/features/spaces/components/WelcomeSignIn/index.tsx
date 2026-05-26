import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useCallback } from 'react'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import { motion } from 'motion/react'
import {
  Sparkles, Layers, Users, Shield, Eye, X, ChevronRight,
  LayoutGrid, UserCog, ShieldCheck, Check,
} from 'lucide-react'
import { blo } from 'blo'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { AppRoutes } from '@/config/routes'
import { OidcAuthFeature } from '@/features/oidc-auth'
import { useLoadFeature } from '@/features/__core__'
import SignInButton from '@/features/spaces/components/SignInButton'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import { getActiveFlow, getBannerStyle, isV2Flow, isLightPanelFlow, type BannerStyle } from '../FlowSelector'
import { containerVariants, itemVariants, iconVariants } from '../CreateSpaceOnboarding/utils'
import css from './styles.module.css'

/* ── Fake addresses for deterministic blo identicons ── */
const DEMO_ADDRESSES: `0x${string}`[] = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xdeadbeef00000000deadbeef00000000deadbeef',
  '0x1111222233334444555566667777888899990000',
]

/* ── Animated number counter for the treasury total ── */
const TARGET_VALUE = 475192.5
const ANIMATION_DURATION = 1200 // ms

const AnimatedCounter = ({ textClassName = 'text-white' }: { textClassName?: string }) => {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * TARGET_VALUE)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <p className={cn('mt-1 text-[30px] font-bold tabular-nums tracking-tight', textClassName)}>
      ${formatted}
    </p>
  )
}

const getRedirectForFlow = (): string => {
  const flow = getActiveFlow()
  switch (flow) {
    case 'existing-has-safes-has-spaces':
      return AppRoutes.spaces.index
    case 'new-user':
      return AppRoutes.welcome.createSpace
    case 'existing-has-safes-no-spaces':
    default:
      return AppRoutes.welcome.createSpace
  }
}

const WelcomeSignIn = (): ReactElement => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)
  const wasOidcPending = useRef(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isOldInterfaceOpen, setIsOldInterfaceOpen] = useState(false)
  // Safe to read localStorage directly — this component is ssr: false
  const [bannerStyle, setBannerStyleState] = useState<BannerStyle>(() => getBannerStyle())
  const [isV2, setIsV2] = useState(() => isV2Flow())
  const [isLightPanel] = useState(() => isLightPanelFlow())

  // Only redirect after OIDC sign-in completes (pending → done), not on page load
  useEffect(() => {
    if (isOidcLoginPending) {
      wasOidcPending.current = true
    } else if (wasOidcPending.current && isUserSignedIn) {
      wasOidcPending.current = false
      router.push({ pathname: getRedirectForFlow(), query: router.query })
    }
  }, [isOidcLoginPending, isUserSignedIn, router])

  const afterSignIn = useCallback(() => {
    router.push({ pathname: getRedirectForFlow(), query: router.query })
  }, [router])

  const { EmailSignInButton, GoogleSignInButton, $isDisabled, $isReady } = useLoadFeature(OidcAuthFeature)

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-secondary p-3">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1, x: [0, 35, -20, 10, 0], y: [0, -30, 20, -10, 0] }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeOut' },
              scale: { duration: 1.4, ease: 'easeOut' },
              x: { duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
              y: { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
            }}
          >
            <div className="h-[560px] w-[560px] rounded-full bg-gradient-to-br from-green-200/40 via-green-100/20 to-transparent blur-3xl dark:from-green-900/25 dark:via-green-800/10 dark:to-transparent" />
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute bottom-1/4 right-1/4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, -30, 20, -10, 0], y: [0, 25, -15, 8, 0] }}
          transition={{
            opacity: { duration: 1.8, delay: 0.3, ease: 'easeOut' },
            x: { duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 2 },
            y: { duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 },
          }}
        >
          <div className="h-[280px] w-[280px] rounded-full bg-gradient-to-tr from-blue-100/25 via-transparent to-transparent blur-3xl dark:from-blue-900/15" />
        </motion.div>

        {isV2 ? (
          /* ══════ v2 layout (matches Figma) ══════ */
          <>
            {/* Green announcement strip — fixed at top */}
            <div className="fixed top-0 left-0 right-0 z-[100] flex w-full items-center justify-center gap-3 bg-[#f0fdf4] px-4 py-2 dark:bg-[#0a1f0d]">
              <span className="size-1.5 shrink-0 rounded-full bg-[#16a34a] dark:bg-[#00C853]" />
              <p className="text-[13px] text-[#374151] dark:text-[#d1d5db]">
                Safe&#123;Wallet&#125; has a{' '}
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  className="font-bold text-[#111827] underline decoration-[#111827]/30 underline-offset-2 transition-opacity hover:opacity-70 dark:text-white dark:decoration-white/30"
                >
                  new workspace-centric
                </button>
                {' '}interface. The previous interface is available for a limited time.
              </p>
              <button
                type="button"
                onClick={() => setIsOldInterfaceOpen(true)}
                className="ml-1 inline-flex items-center gap-1 text-[13px] text-[#374151] transition-opacity hover:opacity-70 dark:text-[#d1d5db]"
              >
                Go to old interface
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Sign-in card — separate, fully rounded */}
            <motion.div
              className="relative w-[420px] overflow-hidden rounded-3xl bg-background pb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Safe Accounts pill — 16px from card edges */}
              <div className="px-4 pt-4 pb-4">
                <motion.div
                  variants={itemVariants}
                  className="flex w-full items-center gap-2.5 rounded-full border border-border/50 bg-background px-2.5 py-1"
                >
                  <div className="flex -space-x-2">
                    {DEMO_ADDRESSES.slice(0, 3).map((addr) => (
                      <div
                        key={addr}
                        className="size-7 rounded-full border-2 border-white bg-cover dark:border-[#1a1a1a]"
                        style={{ backgroundImage: `url(${blo(addr)})` }}
                      />
                    ))}
                    <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#f0f0f0] text-[10px] font-bold text-foreground dark:border-[#1a1a1a] dark:bg-[#2a2a2a]">
                      +2
                    </span>
                  </div>
                  <span className="flex-1 text-sm text-foreground">
                    You have <strong>5 Safe Accounts</strong>
                  </span>
                  <div className="flex size-6 items-center justify-center rounded-full bg-[#12FF80]/20">
                    <Check className="size-3.5 text-[#00C853]" />
                  </div>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-8 px-10">
                {/* Safe logo */}
                <motion.div variants={iconVariants} className="relative pt-4">
                  <SafeLogo alt="Safe logo" width={51} height={39} />
                </motion.div>

                {/* Heading — no subtitle */}
                <motion.div variants={itemVariants}>
                  <Typography variant="h2" align="center">
                    Sign in
                  </Typography>
                </motion.div>

                {/* Sign-in buttons */}
                <motion.div variants={itemVariants} className="flex w-full flex-col gap-3">
                  {!$isDisabled && $isReady && (
                    <>
                      <div className={css.googlePrimary}>
                        <GoogleSignInButton />
                      </div>
                      <EmailSignInButton />

                      <div className={css.orDivider}>
                        <Typography variant="paragraph" color="muted" className="text-xs">
                          OR
                        </Typography>
                      </div>
                    </>
                  )}

                  <SignInButton
                    afterSignIn={afterSignIn}
                    redirectLoading={false}
                    buttonStyle="walletBtnSecondary"
                    buttonText={{ connected: 'Continue with', disconnected: 'Continue with wallet' }}
                  />
                </motion.div>

                {/* Footer */}
                <motion.div variants={itemVariants}>
                  <Typography variant="paragraph" color="muted" align="center" className="text-xs">
                    By continuing, you agree to Safe&apos;s{' '}
                    <NextLink href={AppRoutes.terms} className="underline">
                      Terms
                    </NextLink>{' '}
                    and{' '}
                    <NextLink href={AppRoutes.privacy} className="underline">
                      Privacy Policy
                    </NextLink>
                  </Typography>
                </motion.div>

              </div>
            </motion.div>

            {/* spacer for fixed strip at top */}
            <div className="h-9" />
          </>
        ) : (
          /* ══════ Default flow layout ══════ */
          <motion.div
            className="relative w-[420px] overflow-hidden rounded-3xl bg-background pb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {bannerStyle === 'minimal' ? (
              <motion.div variants={itemVariants}>
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  className={cn(
                    'flex w-full items-center gap-3 px-5 pb-4 pt-5 text-left transition-colors',
                    css.bannerShine,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1">
                    <Sparkles className="size-3.5 flex-shrink-0 text-[#00E46A]" />
                    <span className="text-sm font-semibold text-foreground">New</span>
                  </span>
                  <span className="text-sm text-muted-foreground">Improved app experience built around Workspaces</span>
                </button>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="p-2">
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(true)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl bg-[#F5F5F5] p-2 text-left transition-colors hover:bg-[#EBEBEB] dark:bg-[#1a1a1a] dark:hover:bg-[#252525]',
                    css.bannerShine,
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1 dark:bg-[#2a2a2a]">
                    <Sparkles className="size-3.5 flex-shrink-0 text-[#00E46A]" />
                    <span className="text-sm font-semibold text-foreground">New</span>
                  </span>
                  <span className="text-sm text-muted-foreground">Improved app experience built around Workspaces</span>
                </button>
              </motion.div>
            )}

            <div className="flex flex-col items-center gap-8 px-10 pt-[72px]">
              <motion.div variants={iconVariants} className="relative">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                  <SafeLogo alt="Safe logo" width={51} height={39} />
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col items-center gap-2">
                <Typography variant="h2" align="center">
                  Sign in
                </Typography>
                <Typography variant="paragraph" align="center" color="muted">
                  Manage payments, interact with DeFi and govern protocols all in one place.
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants} className="flex w-full flex-col gap-4">
                {!$isDisabled && $isReady && (
                  <>
                    <div className={css.googlePrimary}>
                      <GoogleSignInButton />
                    </div>
                    <EmailSignInButton />

                    <div className={css.orDivider}>
                      <Typography variant="paragraph" color="muted" className="text-xs">
                        OR
                      </Typography>
                    </div>
                  </>
                )}

                <SignInButton
                  afterSignIn={afterSignIn}
                  redirectLoading={false}
                  buttonStyle="walletBtnSecondary"
                  buttonText={{ connected: 'Continue with', disconnected: 'Continue with wallet' }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Typography variant="paragraph" color="muted" align="center" className="text-xs">
                  By continuing, you agree to Safe&apos;s{' '}
                  <NextLink href={AppRoutes.terms} className="underline">
                    Terms
                  </NextLink>{' '}
                  and{' '}
                  <NextLink href={AppRoutes.privacy} className="underline">
                    Privacy Policy
                  </NextLink>
                </Typography>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Use old interface link — only for default flow (v2 has it inside the card) */}
        {!isV2 && (
          <motion.button
            type="button"
            onClick={() => setIsOldInterfaceOpen(true)}
            className="relative mt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Use old interface
          </motion.button>
        )}
      </div>

      {/* Feature popup */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsInfoOpen(false)}
        >
          {isV2 ? (
            /* ── v2: Dev's split-panel modal ── */
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              {/* Close — diagonally outside top-right corner of popup */}
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="absolute -right-9 -top-9 z-50 flex size-8 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25 hover:text-white"
              >
                <X className="size-4" />
              </button>
            <motion.div
              className="relative flex w-full max-w-[840px] overflow-hidden rounded-3xl bg-background shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* LEFT PANEL — copy */}
              <div className="flex w-[380px] shrink-0 flex-col justify-between p-10">
                <div className="flex flex-col gap-8">
                  {/* Headline */}
                  <div className="flex flex-col gap-3">
                    <h2 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
                      One workspace<br />for your team.
                    </h2>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      Every Safe, every signer, every transaction — in one place.
                    </p>
                  </div>

                  {/* Benefits — light green bg, 12px corner radius icons */}
                  <div className="flex flex-col gap-5">
                    {[
                      {
                        icon: LayoutGrid,
                        title: 'Every Safe in one view',
                        desc: 'One balance, one activity feed, across chains.',
                      },
                      {
                        icon: UserCog,
                        title: 'Access by role',
                        desc: 'Admin, Member, Viewer — with a shared address book.',
                      },
                      {
                        icon: ShieldCheck,
                        title: 'Security & audit in one view',
                        desc: 'Monitor risk across every Safe. Export every action.',
                      },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f0fdf4] dark:bg-[#12FF80]/10">
                          <Icon className="size-[18px] text-[#16a34a] dark:text-[#12FF80]" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[15px] font-semibold text-foreground">{title}</span>
                          <span className="text-[13px] leading-snug text-muted-foreground">{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-10 flex flex-col gap-3">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => setIsInfoOpen(false)}
                  >
                    Set up your workspace &rarr;
                  </Button>
                  <button
                    type="button"
                    onClick={() => window.open('https://safe.global/spaces', '_blank')}
                    className="py-1 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    New to workspaces? Learn more
                  </button>
                </div>
              </div>

              {/* RIGHT PANEL — hugs bg SVG, equal margin all sides */}
              <div className={cn(
                'relative w-[420px] shrink-0 overflow-hidden rounded-2xl m-3',
                isLightPanel ? 'bg-[#f5f5f5]' : 'bg-[#121312]',
              )}>
                {/* Background SVG — sets the panel height */}
                {!isLightPanel && (
                  <img src="/images/spaces/banner-bg.svg" alt="" className="block w-full" />
                )}
                {isLightPanel && (
                  <div className="w-full" style={{ aspectRatio: '420/522' }} />
                )}

                {/* ── Workspace name pill ── */}
                <div className={cn(
                  'absolute left-[32px] top-[80px] z-10 rounded-[22px] p-[5px] transition-all duration-200 hover:scale-105',
                  isLightPanel
                    ? 'bg-black/[0.05] shadow-[0_0_47px_rgba(0,0,0,0.08)] hover:shadow-[0_0_60px_rgba(22,163,106,0.12)]'
                    : 'bg-white/10 shadow-[0_0_47px_rgba(0,0,0,0.2)] hover:shadow-[0_0_60px_rgba(18,255,128,0.15)]',
                )}>
                  <div className={cn(
                    'flex items-center gap-3 rounded-[16px] px-3 py-2',
                    isLightPanel
                      ? 'bg-white/90 shadow-[0_0_30px_rgba(0,0,0,0.06)]'
                      : 'bg-black/80 shadow-[0_0_30px_rgba(92,92,92,0.2)]',
                  )}>
                    <div className="flex size-[20px] items-center justify-center rounded-[12px] bg-[#4ade80] text-[11px] font-semibold text-[#1f201f]">
                      A
                    </div>
                    <div className="flex flex-col gap-1 leading-none">
                      <span className={cn('text-[14px]', isLightPanel ? 'text-[#1a1a1a]' : 'text-[#f5f5f5]')}>Acme Treasury</span>
                      <span className={cn('text-[12px]', isLightPanel ? 'text-[#1a1a1a]/60' : 'text-[#f5f5f5]/60')}>Workspace</span>
                    </div>
                    <svg className={cn('ml-1 size-[20px]', isLightPanel ? 'text-[#1a1a1a]/60' : 'text-[#f5f5f5]/60')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 15l5 5 5-5M7 9l5-5 5 5" /></svg>
                  </div>
                </div>

                {/* ── Total treasury ── */}
                <div className="pointer-events-none absolute left-[41px] top-[155px]">
                  <span className={cn(
                    'text-[9px] font-normal uppercase tracking-[0.08em]',
                    isLightPanel ? 'text-black/50' : 'text-white/50',
                  )}>
                    Total treasury
                  </span>
                  <AnimatedCounter textClassName={isLightPanel ? 'text-[#1a1a1a]' : 'text-white'} />
                </div>

                {/* Card SVGs — staggered, ring border */}
                <img src="/images/spaces/card-1.svg" alt="" className={cn(
                  'absolute left-[20px] top-[230px] z-10 w-[345px] rounded-2xl transition-all duration-200 hover:scale-105',
                  isLightPanel
                    ? 'ring-[6px] ring-black/5 hover:shadow-[0_0_60px_rgba(22,163,106,0.1)]'
                    : 'ring-[6px] ring-white/5 hover:shadow-[0_0_60px_rgba(18,255,128,0.15)]',
                )} />
                <img src="/images/spaces/card-2.svg" alt="" className={cn(
                  'absolute left-[30px] top-[305px] z-20 w-[345px] rounded-2xl transition-all duration-200 hover:scale-105',
                  isLightPanel
                    ? 'ring-[6px] ring-black/5 hover:shadow-[0_0_60px_rgba(22,163,106,0.1)]'
                    : 'ring-[6px] ring-white/5 hover:shadow-[0_0_60px_rgba(18,255,128,0.15)]',
                )} />
                <img src="/images/spaces/card-3.svg" alt="" className={cn(
                  'absolute left-[40px] top-[378px] z-30 w-[345px] rounded-2xl transition-all duration-200 hover:scale-105',
                  isLightPanel
                    ? 'ring-[6px] ring-black/5 hover:shadow-[0_0_60px_rgba(22,163,106,0.1)]'
                    : 'ring-[6px] ring-white/5 hover:shadow-[0_0_60px_rgba(18,255,128,0.15)]',
                )} />
              </div>
            </motion.div>
            </div>
          ) : (
            /* ── Default: feature list popup ── */
            <div className="relative w-[420px] rounded-3xl bg-background p-8" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
              <div className="flex flex-col gap-6">
                <Typography variant="h3">
                  Safe just got better
                </Typography>

                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Layers className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">All Safes in one place</span>
                      <p className="text-sm text-muted-foreground">
                        Your accounts are consolidated into Workspaces automatically
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Users className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">Team collaboration</span>
                      <p className="text-sm text-muted-foreground">
                        Invite members with role-based access to each Workspace
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Shield className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">Same security, better UX</span>
                      <p className="text-sm text-muted-foreground">Nothing changes about your Safes or signers</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Eye className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">Cross-chain overview</span>
                      <p className="text-sm text-muted-foreground">
                        See all assets across chains in a unified dashboard
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#f0fdf4] p-4 dark:bg-[#0a1f0d]">
                  <div className="flex -space-x-2">
                    <div className="size-8 rounded-full border-2 border-[#f0fdf4] bg-[#d4b4e8] dark:border-[#0a1f0d]" />
                    <div className="size-8 rounded-full border-2 border-[#f0fdf4] bg-[#7cb342] dark:border-[#0a1f0d]" />
                    <div className="size-8 rounded-full border-2 border-[#f0fdf4] bg-[#5c8fcc] dark:border-[#0a1f0d]" />
                  </div>
                  <p className="text-sm text-foreground">
                    <strong>8 Safes</strong> ready to consolidate into a Workspace
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    onClick={() => setIsInfoOpen(false)}
                  >
                    Sign in now
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setIsInfoOpen(false)
                      window.open('https://safe.global/spaces', '_blank')
                    }}
                  >
                    Learn more about Workspaces
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Old interface confirmation dialog */}
      {isOldInterfaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOldInterfaceOpen(false)}>
          <div
            className="w-[400px] rounded-3xl bg-background p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-8 text-center">
              <Typography variant="h3">Temporarily available</Typography>
              <Typography variant="paragraph" color="muted">
                The old interface will only be available until June 1st. Your Safes stay exactly the way they are.
              </Typography>
              <div className="flex w-full flex-col gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => setIsOldInterfaceOpen(false)}
                >
                  Stay on new interface
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setIsOldInterfaceOpen(false)
                    router.push(AppRoutes.welcome.accounts)
                  }}
                >
                  Continue to old interface
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WelcomeSignIn
