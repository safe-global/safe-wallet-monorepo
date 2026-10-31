import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { MOCK_TRIAL_STATES, type MockTrialState } from './mockTrial'

/** Dev-only switcher for the prototype review; never rendered in production. */
const MockTrialControl = ({
  value,
  onChange,
}: {
  value: MockTrialState | null
  onChange: (next: MockTrialState | null) => void
}) => (
  <div
    role="group"
    aria-label="Mock Pro trial state (dev only)"
    className="fixed bottom-4 left-4 z-50 flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1.5 shadow-xs"
    data-testid="mock-trial-control"
  >
    <Typography variant="paragraph-mini-medium" color="muted" className="px-1.5">
      Trial mock
    </Typography>
    <Button size="xs" variant={value === null ? 'secondary' : 'ghost-muted'} onClick={() => onChange(null)}>
      Off
    </Button>
    {(Object.keys(MOCK_TRIAL_STATES) as MockTrialState[]).map((key) => (
      <Button
        key={key}
        size="xs"
        variant={value === key ? 'secondary' : 'ghost-muted'}
        aria-pressed={value === key}
        onClick={() => onChange(key)}
      >
        {MOCK_TRIAL_STATES[key].label}
      </Button>
    ))}
  </div>
)

export default MockTrialControl
