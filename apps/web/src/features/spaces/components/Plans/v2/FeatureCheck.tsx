import { Check } from 'lucide-react'

/** 20px check icon. */
export const FeatureCheck = () => (
  <span
    aria-hidden
    data-testid="plan-feature-check"
    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted"
  >
    <Check className="size-3" strokeWidth={2} />
  </span>
)
