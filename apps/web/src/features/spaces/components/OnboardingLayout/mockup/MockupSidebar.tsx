import { motion } from 'motion/react'
import { ChevronDown, House, WalletCards, BookUser, UsersRound, Settings } from 'lucide-react'
import SafeLogo from '@/public/images/logo-no-text.svg'
import SpaceAvatar from './SpaceAvatar'

interface MockupSidebarProps {
  displayName: string
  initial: string
  highlight: 'switcher' | 'accounts' | 'none'
}

const navItems = [
  { Icon: House, width: '60%' },
  { Icon: WalletCards, width: '74%' },
  { Icon: BookUser, width: '80%' },
  { Icon: UsersRound, width: '55%' },
  { Icon: Settings, width: '65%' },
]

const MockupSidebar = ({ displayName, initial, highlight }: MockupSidebarProps) => (
  <div className="flex w-[220px] shrink-0 flex-col gap-2 border-r p-4">
    <SafeLogo alt="Safe" width={24} height={24} className="mb-3 shrink-0" />

    <motion.div
      animate={{
        // Hex inlined for the DS success-green token (--color-success-main, #00b460). Two reasons we
        // can't use var() here: (1) motion interpolates box-shadow in JS frame-by-frame and can't
        // resolve CSS vars at animation time, so it'd snap instead of fading; (2) the rgba() alpha
        // form needs raw rgb channels, and Tailwind's /opacity modifier only works in utility classes,
        // not inline strings. Safe to hardcode because --color-success-main is #00b460 in both
        // light and dark mode (see vars.css).
        scale: highlight === 'switcher' ? 1.18 : 1,
        boxShadow:
          highlight === 'switcher'
            ? '0 0 0 1px #00b460, 0 0 5px 5px rgba(0, 180, 96, 0.3)'
            : '0 0 0 0 rgba(0, 180, 96, 0)',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ transformOrigin: 'left center' }}
      className="flex items-center gap-3 rounded-xl bg-muted p-3 transition-colors hover:bg-[var(--color-secondary-background)]"
    >
      <SpaceAvatar initial={initial} />
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="truncate text-sm font-semibold leading-tight text-foreground">{displayName}</div>
        <div className="text-xs leading-none text-muted-foreground">Workspace</div>
      </div>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </motion.div>

    {/* Nav rows: real icon + skeleton label bar */}
    <div className="flex flex-col gap-1 pt-1">
      {navItems.map(({ Icon, width }, i) => (
        <div key={i} className="flex h-10 items-center gap-3 rounded-lg px-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          <div className="h-2.5 rounded-full bg-muted" style={{ width }} />
        </div>
      ))}
    </div>
  </div>
)

export default MockupSidebar
