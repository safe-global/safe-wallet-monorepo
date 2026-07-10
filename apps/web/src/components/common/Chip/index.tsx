import { Chip as ShadcnChip } from '@/components/ui/chip'

type ChipSx = {
  backgroundColor?: string
  color?: string
  borderRadius?: number
}

type Props = {
  label?: string
  sx?: ChipSx
  fontWeight?: string
}

const resolveColor = (value?: string): string | undefined =>
  value === undefined ? undefined : value.includes('.') ? `var(--color-${value.replace('.', '-')})` : value

export function Chip({ sx, label = 'New', fontWeight = 'bold' }: Props) {
  const style: React.CSSProperties = {
    marginTop: '-2px',
    fontWeight,
    backgroundColor: resolveColor(sx?.backgroundColor),
    color: resolveColor(sx?.color),
    ...(sx?.borderRadius !== undefined ? { borderRadius: sx.borderRadius * 4 } : {}),
  }

  // MUI compat shim: inline style bridges the legacy `sx` prop; migrate call sites then delete
  return <ShadcnChip style={style}>{label}</ShadcnChip>
}
