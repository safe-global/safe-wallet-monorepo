// Threshold/owners badge overlaid on the bottom-right of a safe avatar (matches the accounts modal).
// Absolutely positioned, so the parent must be `relative`.
const ThresholdBadge = ({ threshold, owners }: { threshold: number; owners: number }) => {
  if (threshold <= 0 || owners <= 0) return null
  return (
    <span
      data-testid="safe-selector-threshold"
      className="absolute -bottom-1 -right-1.5 flex items-center justify-center whitespace-nowrap rounded border border-border bg-background px-[3px] py-px text-[9px] font-bold leading-none text-foreground shadow-sm"
    >
      {threshold}/{owners}
    </span>
  )
}

export default ThresholdBadge
