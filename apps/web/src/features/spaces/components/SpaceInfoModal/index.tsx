import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Layers, UsersRound, ShieldAlert, ChevronDown, TrendingUp, ArrowUpRight, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import Identicon from '@/components/common/Identicon'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

const SPACE_HELP_ARTICLE_LINK = 'https://help.safe.global/collections/1628654831-workspace?lang=en'

const TOTAL_TREASURY = 47829104

const BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Layers, title: 'Every Safe in one view', desc: 'One balance, one activity feed, across chains.' },
  { icon: UsersRound, title: 'Access by role', desc: 'Admin, Member, Viewer — with a shared address book.' },
  {
    icon: ShieldAlert,
    title: 'Security & audit in one view',
    desc: 'Monitor risk across every Safe. Export every action.',
  },
]

const CHAIN_LOGO_URL = (chainId: number) =>
  `https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`

const PREVIEW_ACCOUNTS: {
  name: string
  threshold: string
  address: string
  chainName: string
  chainLogo: string
  value: string
  pending?: string
}[] = [
  {
    name: 'Operations',
    threshold: '3/6',
    address: '0xa11ce0dd1f7c2b3e4f5a6b7c8d9e0f1a2b3c4d5e',
    chainName: 'Ethereum',
    chainLogo: CHAIN_LOGO_URL(1),
    value: '$28.4M',
    pending: '2 pending',
  },
  {
    name: 'Payroll',
    threshold: '2/4',
    address: '0xbc7e9a2d01f3e4c5b6a7980d1e2f3a4b5c6d7e8f',
    chainName: 'Base',
    chainLogo: CHAIN_LOGO_URL(8453),
    value: '$12.1M',
  },
  {
    name: 'Grants',
    threshold: '4/7',
    address: '0xd4fa61e08c5b3a2917f6e4d0c1b2a3948576e5d2',
    chainName: 'BNB Smart Chain',
    chainLogo: CHAIN_LOGO_URL(56),
    value: '$7.3M',
  },
]

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/** Eases a number up to the total treasury value once on mount. */
const useCountUp = (target: number, enabled: boolean, duration = 1400, delay = 480) => {
  const [value, setValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled) return

    let frame = 0
    const start = performance.now() + delay
    const step = (now: number) => {
      const elapsed = now - start
      if (elapsed < 0) {
        frame = requestAnimationFrame(step)
        return
      }
      const t = Math.min(elapsed / duration, 1)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.floor(target * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
  }, [target, enabled, duration, delay])

  return value
}

const SpaceInfoModal = ({ onClose }: { onClose: () => void }) => {
  const reduceMotion = useReducedMotion() ?? false
  const total = useCountUp(TOTAL_TREASURY, !reduceMotion)

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.32, 0.72, 0, 1] as const },
        }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[960px] gap-0 overflow-hidden border-0 p-0 sm:rounded-3xl"
      >
        {/* Mobile close — the dark panel (with its own close) is hidden on small screens */}
        <DialogClose
          aria-label="Close"
          render={<Button variant="ghost" size="icon-sm" className="absolute top-4 right-4 z-[3] md:hidden" />}
        >
          <X className="size-4" />
        </DialogClose>

        <div className="grid md:grid-cols-2">
          {/* Left — the pitch */}
          <div className="flex flex-col justify-center gap-10 p-9 md:p-12">
            <div>
              <DialogTitle className="text-[40px] font-bold leading-[44px] tracking-[-0.04em] text-balance">
                One workspace for your team.
              </DialogTitle>

              <DialogDescription className="mt-3 max-w-[420px] text-base leading-6">
                Every Safe, every signer, every transaction — in one place.
              </DialogDescription>
            </div>

            <div className="flex flex-col gap-7">
              {BENEFITS.map((benefit, i) => (
                <motion.div key={benefit.title} className="flex items-start gap-4" {...rise(0.2 + i * 0.1)}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-[#166534]">
                    <benefit.icon className="size-[18px]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Typography variant="paragraph-small-bold">{benefit.title}</Typography>
                    <Typography variant="paragraph-small" color="muted">
                      {benefit.desc}
                    </Typography>
                  </div>
                </motion.div>
              ))}
            </div>

            <Typography variant="paragraph-small" color="muted">
              New to workspaces?{' '}
              <a
                href={SPACE_HELP_ARTICLE_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-foreground underline underline-offset-2"
              >
                Learn more
                <ArrowUpRight className="size-3.5" />
              </a>
            </Typography>
          </div>

          {/* Right — live workspace preview */}
          <div className="relative hidden flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_at_70%_20%,#1a1a1a_0%,#050505_100%)] p-9 md:flex md:p-12">
            <div className={css.glowPrimary} aria-hidden />
            <div className={css.glowSecondary} aria-hidden />

            <DialogClose
              aria-label="Close"
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-5 right-5 z-[3] text-white/70 hover:bg-white/15 hover:text-white"
                />
              }
            >
              <X className="size-4" />
            </DialogClose>

            <motion.div className="relative z-[1]" {...rise(0.22)}>
              <div className="mb-7 inline-flex w-fit items-center gap-2.5 rounded-lg border border-white/50 bg-white/95 px-3.5 py-2.5 shadow-lg">
                <span className="flex size-6 items-center justify-center rounded-sm bg-[var(--color-static-text-brand)] text-[13px] font-bold text-[#0a0a0a]">
                  A
                </span>
                <span className="text-sm font-semibold text-[#0a0a0a]">Acme Treasury</span>
                <ChevronDown className="size-3.5 text-[#737373]" />
              </div>

              <div className="text-[11px] font-medium uppercase tracking-[1.2px] text-white/50">Total treasury</div>
              <div className="mt-3 flex items-baseline gap-3.5">
                <span className="text-[40px] font-bold leading-[44px] tracking-[-1.4px] tabular-nums text-white">
                  ${total.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-static-text-brand)]">
                  <TrendingUp className="size-3" />
                  +2.3%
                </span>
              </div>
            </motion.div>

            <div className="relative z-[1] mt-9 flex flex-col gap-2">
              {PREVIEW_ACCOUNTS.map((account, i) => (
                <motion.div
                  key={account.address}
                  className={cn(
                    'flex items-center gap-3.5 rounded-xl border border-white/40 bg-white/95 px-4 py-3.5 shadow-md',
                    css.shine,
                  )}
                  style={{ '--shine-delay': `${780 + i * 100}ms` } as React.CSSProperties}
                  {...rise(0.42 + i * 0.1)}
                >
                  <div className="shrink-0 overflow-hidden rounded-full">
                    <Identicon address={account.address} size={32} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-sm font-semibold leading-[18px] text-[#0a0a0a]">
                      {account.name} · {account.threshold}
                      {account.pending && (
                        <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] font-semibold text-[#525252]">
                          {account.pending}
                        </span>
                      )}
                    </div>
                    <div className="text-xs tabular-nums text-[#737373]">{shortAddress(account.address)}</div>
                  </div>
                  <img
                    src={account.chainLogo}
                    alt={`${account.chainName} logo`}
                    width={22}
                    height={22}
                    loading="lazy"
                    className="size-[22px] shrink-0 rounded-full bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
                  />
                  <span className="text-sm font-semibold tabular-nums text-[#0a0a0a]">{account.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SpaceInfoModal
