import type { ComponentType, ReactElement, SVGProps } from 'react'
import { ArrowLeftRight, Code, Coins, Fingerprint, KeyRound, Layers } from 'lucide-react'
import { cn } from '@safe-global/views/utils/cn'
import SafeLogo from '@safe-global/views/assets/images/logo-no-text.svg'
import SafenetLogo from '@safe-global/views/assets/images/whats-new/safenet-logo.svg'
import SafeShieldLogo from '@safe-global/views/assets/images/whats-new/safe-shield-logo.svg'
import ProChip from '@safe-global/views/assets/images/whats-new/pro-chip.svg'
import { MOTIFS, type MotifName, type MotifTone } from './motifs'

const ICONS = {
  code: Code,
  coins: Coins,
  fingerprint: Fingerprint,
  key: KeyRound,
  layers: Layers,
  swap: ArrowLeftRight,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>

type IconName = keyof typeof ICONS
type LogoName = 'safe' | 'safePro' | 'safenet' | 'safeShield'

export type WhatsNewThumbnailVariant = LogoName | MotifName | IconName

export const WHATS_NEW_THUMBNAIL_VARIANTS = [
  'safe',
  'safePro',
  'safenet',
  'safeShield',
  ...(Object.keys(MOTIFS) as MotifName[]),
  ...(Object.keys(ICONS) as IconName[]),
] satisfies WhatsNewThumbnailVariant[]

const GRID_SIZE = 16
const GRID_PATH = Array.from({ length: 20 }, (_, i) => `M${i * GRID_SIZE} 0V320M0 ${i * GRID_SIZE}H320`).join('')

const TONE_CLASS: Record<MotifTone, string> = {
  accent: 'fill-[var(--color-static-text-brand)]',
  key: 'fill-[var(--color-static-main)]',
  light: 'fill-[var(--color-static-primary)]',
}

const Motif = ({ name }: { name: MotifName }): ReactElement => (
  <svg viewBox="0 0 10 10" className="size-16">
    {MOTIFS[name].map(([tone, x, y, width, height], index) => (
      <rect
        key={index}
        x={x}
        y={y}
        width={width}
        height={height}
        rx={Math.min(0.4, Math.min(width, height) * 0.22)}
        className={TONE_CLASS[tone]}
      />
    ))}
  </svg>
)

const Tile = ({ className, children }: { className?: string; children: ReactElement | ReactElement[] }) => (
  <span
    className={cn(
      'flex items-center justify-center gap-1 rounded-xl bg-[var(--color-static-primary)] text-[var(--color-static-main)]',
      className,
    )}
  >
    {children}
  </span>
)

const LOGOS: Record<LogoName, () => ReactElement> = {
  safe: () => (
    <Tile className="size-14">
      <SafeLogo className="size-8" />
    </Tile>
  ),
  safePro: () => (
    <Tile className="h-14 px-3">
      <SafeLogo className="size-7" />
      <ProChip className="h-4 w-6" />
    </Tile>
  ),
  safenet: () => (
    <Tile className="h-9 px-3">
      <SafenetLogo className="h-3 w-auto" />
    </Tile>
  ),
  safeShield: () => (
    <Tile className="size-14">
      <SafeShieldLogo className="h-8 w-auto" />
    </Tile>
  ),
}

const isMotif = (variant: WhatsNewThumbnailVariant): variant is MotifName => variant in MOTIFS
const isIcon = (variant: WhatsNewThumbnailVariant): variant is IconName => variant in ICONS

const Illustration = ({ variant }: { variant: WhatsNewThumbnailVariant }): ReactElement => {
  if (isMotif(variant)) return <Motif name={variant} />
  if (isIcon(variant)) {
    const Icon = ICONS[variant]
    return (
      <Tile className="size-14">
        <Icon className="size-7" strokeWidth={1.75} />
      </Tile>
    )
  }
  const Logo = LOGOS[variant]
  return <Logo />
}

export const WhatsNewThumbnail = ({
  variant,
  className,
}: {
  variant: WhatsNewThumbnailVariant
  className?: string
}): ReactElement => (
  <span
    aria-hidden
    data-testid="whats-new-thumbnail"
    data-variant={variant}
    className={cn('relative block overflow-hidden bg-[var(--color-secondary-light)]', className)}
  >
    <svg
      viewBox="0 0 128 160"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full stroke-[var(--color-static-text-brand)] opacity-40"
    >
      <path d={GRID_PATH} transform="translate(-96 -80)" />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center">
      <Illustration variant={variant} />
    </span>
  </span>
)
